// client/src/context/ChatContext.jsx
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { socket } from '../socket/socket';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { showBrowserNotification, playNotificationSound } from '../utils/helpers';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadRooms, setUnreadRooms] = useState({}); // Track unread messages per room
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // Connect to socket
  useEffect(() => {
    if (isAuthenticated && token) {
      socket.auth = { token };
      socket.connect();

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  // Socket event listeners
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log('Connected to server');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    };

    const onReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      
      // Update unread count for the room if not currently viewing it
      if (message.room !== currentRoom && message.sender._id !== user?._id) {
        setUnreadRooms(prev => ({
          ...prev,
          [message.room]: (prev[message.room] || 0) + 1
        }));
      }
      
      // Play sound and show notification if message is not from current user
      if (message.sender._id !== user?._id) {
        playNotificationSound();
        showBrowserNotification(
          `New message from ${message.sender.username}`,
          { body: message.content }
        );
        setUnreadCount((prev) => prev + 1);
      }
    };

    const onPrivateMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      
      if (message.sender._id !== user?._id) {
        playNotificationSound();
        showBrowserNotification(
          `Private message from ${message.sender.username}`,
          { body: message.content }
        );
        setUnreadCount((prev) => prev + 1);
      }
    };

    const onOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const onUserTyping = (data) => {
      setTypingUsers(data.users || []);
    };

    const onUserJoinedRoom = (data) => {
      toast.success(`${data.username} joined the room`);
    };

    const onUserLeftRoom = (data) => {
      toast(`${data.username} left the room`);
    };

    const onMessageReaction = (message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === message._id ? message : msg))
      );
    };

    const onError = (error) => {
      toast.error(error.message || 'An error occurred');
    };

    const onFriendRequestReceived = (data) => {
      setFriendRequests((prev) => [
        {
          _id: data.requestId,
          sender: data.sender,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);
      playNotificationSound();
      toast(`${data.sender.username} sent you a friend request!`, {
        icon: '👋',
        duration: 5000,
      });
    };

    const onFriendRequestAccepted = (data) => {
      // Remove from sent requests if needed
      toast.success(`${data.acceptedBy.username} accepted your friend request!`);
      // Add friend to friends list
      setFriends((prev) => [
        ...prev,
        {
          ...data.acceptedBy,
          conversationId: data.conversationId,
        },
      ]);
      // Add room to rooms
      if (data.room) {
        setRooms((prev) => [...prev, data.room]);
      }
    };

    const onFriendRequestDeclined = (data) => {
      toast(`${data.declinedBy.username} declined your friend request`, {
        icon: '😔',
      });
    };

    const onFriendshipCreated = (data) => {
      // Add friend to friends list
      setFriends((prev) => [
        ...prev,
        {
          ...data.friend,
          conversationId: data.conversationId,
          friendshipId: data.friendshipId,
        },
      ]);
      // Add room to rooms
      if (data.room) {
        setRooms((prev) => {
          const exists = prev.find((r) => r._id === data.room._id);
          return exists ? prev : [...prev, data.room];
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('online_users', onOnlineUsers);
    socket.on('user_typing', onUserTyping);
    socket.on('user_joined_room', onUserJoinedRoom);
    socket.on('user_left_room', onUserLeftRoom);
    socket.on('message_reaction', onMessageReaction);
    socket.on('error', onError);
    socket.on('friend_request_received', onFriendRequestReceived);
    socket.on('friend_request_accepted', onFriendRequestAccepted);
    socket.on('friend_request_declined', onFriendRequestDeclined);
    socket.on('friendship_created', onFriendshipCreated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('online_users', onOnlineUsers);
      socket.off('user_typing', onUserTyping);
      socket.off('user_joined_room', onUserJoinedRoom);
      socket.off('user_left_room', onUserLeftRoom);
      socket.off('message_reaction', onMessageReaction);
      socket.off('error', onError);
      socket.off('friend_request_received', onFriendRequestReceived);
      socket.off('friend_request_accepted', onFriendRequestAccepted);
      socket.off('friend_request_declined', onFriendRequestDeclined);
      socket.off('friendship_created', onFriendshipCreated);
    };
  }, [user]);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      // Fetch all public rooms instead of just user's rooms
      const response = await api.get('/rooms');
      setRooms(response.data.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, []);

  // Join room
  const joinRoom = useCallback((roomId) => {
    socket.emit('join_room', roomId);
    setCurrentRoom(roomId);
    // Clear unread count for this room when joining
    setUnreadRooms(prev => {
      const updated = { ...prev };
      delete updated[roomId];
      return updated;
    });
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomId) => {
    socket.emit('leave_room', roomId);
    if (currentRoom === roomId) {
      setCurrentRoom(null);
    }
    // Remove room from state when user leaves
    setRooms(prev => prev.filter(r => r._id !== roomId));
    setMessages([]);
  }, [currentRoom]);

  // Send message
  const sendMessage = useCallback((messageData) => {
    socket.emit('send_message', messageData);
  }, []);

  // Send private message
  const sendPrivateMessage = useCallback((recipientId, content) => {
    socket.emit('private_message', { recipientId, content });
  }, []);

  // Typing indicators
  const startTyping = useCallback((roomId) => {
    socket.emit('typing_start', { roomId });
  }, []);

  const stopTyping = useCallback((roomId) => {
    socket.emit('typing_stop', { roomId });
  }, []);

  // Add reaction
  const addReaction = useCallback((messageId, emoji) => {
    socket.emit('add_reaction', { messageId, emoji });
  }, []);

  // Load messages for room
  const loadRoomMessages = useCallback(async (roomId) => {
    try {
      const response = await api.get(`/messages/room/${roomId}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Create room
  const createRoom = useCallback(async (roomData) => {
    try {
      const response = await api.post('/rooms', roomData);
      toast.success('Room created successfully');
      await fetchRooms();
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create room');
      throw error;
    }
  }, [fetchRooms]);

  // Start direct chat with a user
  const startDirectChat = useCallback(async (userId) => {
    try {
      // First, check if DM already exists in current rooms
      const existingDM = rooms.find(room => 
        room.roomType === 'direct' && 
        room.members?.some(member => (member._id || member) === userId)
      );

      if (existingDM) {
        // Open existing conversation
        joinRoom(existingDM._id);
        await loadRoomMessages(existingDM._id);
        return;
      }

      // Create new DM
      const response = await api.post('/rooms/direct', { recipientId: userId });
      const directRoom = response.data.data;
      
      // Add to rooms if not already there
      setRooms(prev => {
        const exists = prev.find(r => r._id === directRoom._id);
        return exists ? prev : [...prev, directRoom];
      });
      
      // Join the room
      joinRoom(directRoom._id);
      await loadRoomMessages(directRoom._id);
    } catch (error) {
      console.error('Error starting direct chat:', error);
      toast.error(error.response?.data?.error || 'Failed to start chat');
    }
  }, [rooms, joinRoom, loadRoomMessages]);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    try {
      const response = await api.get('/friends/requests');
      setFriendRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }, []);

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, []);

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverId) => {
    try {
      const response = await api.post('/friends/request', { receiverId });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error.response?.data || error;
    }
  }, []);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId) => {
    try {
      const response = await api.post(`/friends/accept/${requestId}`);
      
      // Remove from friend requests
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
      
      // Fetch updated friends and rooms
      await fetchFriends();
      await fetchRooms();
      
      // Auto-open the new conversation
      if (response.data.data?.conversationId) {
        joinRoom(response.data.data.conversationId);
        await loadRoomMessages(response.data.data.conversationId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error.response?.data || error;
    }
  }, [fetchFriends, fetchRooms, joinRoom, loadRoomMessages]);

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId) => {
    try {
      const response = await api.post(`/friends/decline/${requestId}`);
      
      // Remove from friend requests
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
      
      return response.data;
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error.response?.data || error;
    }
  }, []);

  // Fetch initial data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
      fetchFriendRequests();
      fetchFriends();
    }
  }, [isAuthenticated, fetchRooms, fetchFriendRequests, fetchFriends]);

  const value = {
    isConnected,
    messages,
    rooms,
    currentRoom,
    onlineUsers,
    typingUsers,
    unreadCount,
    unreadRooms,
    friendRequests,
    friends,
    setUnreadCount,
    fetchRooms,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendPrivateMessage,
    startTyping,
    stopTyping,
    addReaction,
    loadRoomMessages,
    createRoom,
    startDirectChat,
    fetchFriendRequests,
    fetchFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
