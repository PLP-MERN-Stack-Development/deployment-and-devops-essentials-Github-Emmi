const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');
const { verifyToken } = require('../utils/tokenUtils');

// Store online users
const onlineUsers = new Map();

// Store typing users per room
const typingUsers = new Map();

const setupSocketHandlers = (io) => {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.username} (${socket.id})`);

    // Add user to online users
    onlineUsers.set(socket.userId, {
      socketId: socket.id,
      username: socket.username,
      userId: socket.userId,
    });

    // Update user status in database
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      socketId: socket.id,
    });

    // Broadcast online users
    io.emit('online_users', Array.from(onlineUsers.values()));

    // User joins their own room for private messages
    socket.join(socket.userId);

    // Handle joining a chat room
    socket.on('join_room', async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);
        
        // Notify room members
        socket.to(roomId).emit('user_joined_room', {
          userId: socket.userId,
          username: socket.username,
          roomId,
        });

        console.log(`${socket.username} joined room: ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle leaving a chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left_room', {
        userId: socket.userId,
        username: socket.username,
        roomId,
      });
      console.log(`${socket.username} left room: ${roomId}`);
    });

    // Handle sending a message to a room
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, messageType, fileUrl, fileName, fileSize } = data;

        const message = await Message.create({
          sender: socket.userId,
          content,
          room: roomId || null,
          messageType: messageType || 'text',
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar');

        // Update room's last message
        if (roomId) {
          await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });
          // Include room field in the emitted message
          const messageWithRoom = populatedMessage.toObject();
          messageWithRoom.room = roomId;
          io.to(roomId).emit('receive_message', messageWithRoom);
        } else {
          io.emit('receive_message', populatedMessage);
        }

        // Clear typing indicator
        handleStopTyping(socket, roomId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle private messages
    socket.on('private_message', async (data) => {
      try {
        const { recipientId, content, messageType, fileUrl, fileName, fileSize } = data;

        const message = await Message.create({
          sender: socket.userId,
          recipient: recipientId,
          content,
          messageType: messageType || 'text',
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar');

        // Send to recipient
        io.to(recipientId).emit('private_message', populatedMessage);
        
        // Send back to sender
        socket.emit('private_message', populatedMessage);

        console.log(`Private message from ${socket.username} to ${recipientId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      handleStartTyping(socket, roomId);
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      handleStopTyping(socket, roomId);
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        const message = await Message.findById(messageId);
        
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
          (r) => r.user.toString() === socket.userId && r.emoji === emoji
        );

        if (existingReaction) {
          // Remove reaction
          message.reactions = message.reactions.filter(
            (r) => !(r.user.toString() === socket.userId && r.emoji === emoji)
          );
        } else {
          // Add reaction
          message.reactions.push({
            user: socket.userId,
            emoji,
          });
        }

        await message.save();

        const updatedMessage = await Message.findById(messageId)
          .populate('sender', 'username avatar')
          .populate('reactions.user', 'username');

        // Broadcast to room or global
        if (message.room) {
          io.to(message.room.toString()).emit('message_reaction', updatedMessage);
        } else if (message.recipient) {
          io.to(message.recipient.toString()).emit('message_reaction', updatedMessage);
          io.to(message.sender.toString()).emit('message_reaction', updatedMessage);
        } else {
          io.emit('message_reaction', updatedMessage);
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle message read receipts
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        
        if (!message) {
          return;
        }

        // Check if already read
        const alreadyRead = message.readBy.find(
          (r) => r.user.toString() === socket.userId
        );

        if (!alreadyRead) {
          message.readBy.push({ user: socket.userId });
          await message.save();

          // Notify sender
          io.to(message.sender.toString()).emit('message_read', {
            messageId,
            userId: socket.userId,
            username: socket.username,
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username} (${socket.id})`);

      // Remove from online users
      onlineUsers.delete(socket.userId);

      // Update user status in database
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date(),
        socketId: null,
      });

      // Remove from all typing indicators
      typingUsers.forEach((users, roomId) => {
        if (users.has(socket.userId)) {
          handleStopTyping(socket, roomId);
        }
      });

      // Broadcast updated online users
      io.emit('online_users', Array.from(onlineUsers.values()));
      
      // Broadcast user offline
      io.emit('user_offline', {
        userId: socket.userId,
        username: socket.username,
      });
    });
  });

  // Helper function to handle start typing
  function handleStartTyping(socket, roomId) {
    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Map());
    }

    const roomTypingUsers = typingUsers.get(roomId);
    roomTypingUsers.set(socket.userId, {
      userId: socket.userId,
      username: socket.username,
    });

    // Broadcast to room
    if (roomId) {
      socket.to(roomId).emit('user_typing', {
        roomId,
        users: Array.from(roomTypingUsers.values()),
      });
    } else {
      socket.broadcast.emit('user_typing', {
        users: Array.from(roomTypingUsers.values()),
      });
    }
  }

  // Helper function to handle stop typing
  function handleStopTyping(socket, roomId) {
    if (!typingUsers.has(roomId)) {
      return;
    }

    const roomTypingUsers = typingUsers.get(roomId);
    roomTypingUsers.delete(socket.userId);

    // Broadcast to room
    if (roomId) {
      socket.to(roomId).emit('user_typing', {
        roomId,
        users: Array.from(roomTypingUsers.values()),
      });
    } else {
      socket.broadcast.emit('user_typing', {
        users: Array.from(roomTypingUsers.values()),
      });
    }

    // Clean up empty maps
    if (roomTypingUsers.size === 0) {
      typingUsers.delete(roomId);
    }
  }
};

module.exports = setupSocketHandlers;
