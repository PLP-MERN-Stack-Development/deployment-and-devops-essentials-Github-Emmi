const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Friendship = require('../models/Friendship');
const Room = require('../models/Room');
const Message = require('../models/Message');

// @desc    Search user by email
// @route   POST /api/friends/search
// @access  Private
exports.searchUserByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const currentUserId = req.user._id;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Find user by email (exclude current user)
  const user = await User.findOne({ email, _id: { $ne: currentUserId } }).select(
    '-password'
  );

  if (!user) {
    return res.json({ success: false, message: 'No user found with that email' });
  }

  // Check if already friends
  const friendship = await Friendship.findBetweenUsers(currentUserId, user._id);

  if (friendship) {
    return res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isFriend: true,
        conversationId: friendship.conversationRoom._id,
      },
    });
  }

  // Check for pending request (sent or received)
  const pendingRequest = await FriendRequest.findOne({
    $or: [
      { sender: currentUserId, receiver: user._id, status: 'pending' },
      { sender: user._id, receiver: currentUserId, status: 'pending' },
    ],
  });

  res.json({
    success: true,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      isFriend: false,
      hasPendingRequest: !!pendingRequest,
      requestSentByMe: pendingRequest?.sender.toString() === currentUserId.toString(),
      requestId: pendingRequest?._id,
    },
  });
});

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
exports.sendFriendRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (!receiverId) {
    return res.status(400).json({ error: 'Receiver ID is required' });
  }

  // Validation: Cannot send request to yourself
  if (senderId.toString() === receiverId) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' });
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if already friends
  const existingFriendship = await Friendship.findBetweenUsers(senderId, receiverId);

  if (existingFriendship) {
    return res.status(400).json({ error: 'You are already friends with this user' });
  }

  // Check for existing pending request (either direction)
  const existingRequest = await FriendRequest.findBetweenUsers(senderId, receiverId);

  if (existingRequest) {
    return res.status(400).json({
      error: 'A friend request already exists between you and this user',
    });
  }

  // Create friend request
  const friendRequest = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
    status: 'pending',
  });

  const populatedRequest = await FriendRequest.findById(friendRequest._id)
    .populate('sender', 'username email avatar')
    .populate('receiver', 'username email avatar');

  // Emit socket event to receiver
  const io = req.app.get('io');
  if (receiver.socketId) {
    io.to(receiver.socketId).emit('friend_request_received', {
      requestId: friendRequest._id,
      sender: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar,
        email: req.user.email,
      },
      createdAt: friendRequest.createdAt,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Friend request sent successfully',
    data: populatedRequest,
  });
});

// @desc    Accept friend request
// @route   POST /api/friends/accept/:requestId
// @access  Private
exports.acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const friendRequest = await FriendRequest.findById(requestId)
    .populate('sender', 'username email avatar')
    .populate('receiver', 'username email avatar');

  if (!friendRequest) {
    return res.status(404).json({ error: 'Friend request not found' });
  }

  // Only receiver can accept the request
  if (friendRequest.receiver._id.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'You are not authorized to accept this request' });
  }

  if (friendRequest.status !== 'pending') {
    return res.status(400).json({ error: 'This request has already been processed' });
  }

  // Create DM room for the friendship
  const room = await Room.create({
    name: `${friendRequest.sender.username} & ${friendRequest.receiver.username}`,
    roomType: 'direct',
    creator: userId,
    members: [friendRequest.sender._id, friendRequest.receiver._id],
    admins: [friendRequest.sender._id, friendRequest.receiver._id],
  });

  // Create friendship
  const friendship = await Friendship.create({
    user1: friendRequest.sender._id,
    user2: friendRequest.receiver._id,
    conversationRoom: room._id,
  });

  // Update friend request status
  friendRequest.status = 'accepted';
  await friendRequest.save();

  // Add to each user's friends list
  await User.findByIdAndUpdate(friendRequest.sender._id, {
    $addToSet: { friends: friendRequest.receiver._id },
  });

  await User.findByIdAndUpdate(friendRequest.receiver._id, {
    $addToSet: { friends: friendRequest.sender._id },
  });

  // Create system message
  const systemMessage = await Message.create({
    sender: userId,
    room: room._id,
    content: `🎉 Your journey with ${friendRequest.sender.username} begins here! Say hello and start chatting.`,
    messageType: 'system',
  });

  // Emit socket events
  const io = req.app.get('io');
  const senderUser = await User.findById(friendRequest.sender._id);

  // Notify the sender (request was accepted)
  if (senderUser.socketId) {
    io.to(senderUser.socketId).emit('friend_request_accepted', {
      requestId: friendRequest._id,
      acceptedBy: {
        _id: userId,
        username: req.user.username,
        avatar: req.user.avatar,
        email: req.user.email,
      },
      conversationId: room._id,
    });

    // Notify both users about new friendship
    io.to(senderUser.socketId).emit('friendship_created', {
      friendshipId: friendship._id,
      friend: {
        _id: userId,
        username: req.user.username,
        avatar: req.user.avatar,
        status: req.user.status,
      },
      conversationId: room._id,
      room: {
        _id: room._id,
        name: room.name,
        roomType: room.roomType,
      },
    });
  }

  // Notify current user (receiver) about new friendship
  if (req.user.socketId) {
    io.to(req.user.socketId).emit('friendship_created', {
      friendshipId: friendship._id,
      friend: {
        _id: senderUser._id,
        username: senderUser.username,
        avatar: senderUser.avatar,
        status: senderUser.status,
      },
      conversationId: room._id,
      room: {
        _id: room._id,
        name: room.name,
        roomType: room.roomType,
      },
    });
  }

  res.json({
    success: true,
    message: 'Friend request accepted',
    data: {
      friendship,
      conversationId: room._id,
      room: {
        _id: room._id,
        name: room.name,
        roomType: room.roomType,
        members: room.members,
      },
    },
  });
});

// @desc    Decline friend request
// @route   POST /api/friends/decline/:requestId
// @access  Private
exports.declineFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  const friendRequest = await FriendRequest.findById(requestId).populate(
    'sender',
    'username avatar socketId'
  );

  if (!friendRequest) {
    return res.status(404).json({ error: 'Friend request not found' });
  }

  // Only receiver can decline the request
  if (friendRequest.receiver.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'You are not authorized to decline this request' });
  }

  if (friendRequest.status !== 'pending') {
    return res.status(400).json({ error: 'This request has already been processed' });
  }

  // Update status to declined
  friendRequest.status = 'declined';
  await friendRequest.save();

  // Emit socket event to sender
  const io = req.app.get('io');
  if (friendRequest.sender.socketId) {
    io.to(friendRequest.sender.socketId).emit('friend_request_declined', {
      requestId: friendRequest._id,
      declinedBy: {
        _id: userId,
        username: req.user.username,
        avatar: req.user.avatar,
      },
    });
  }

  res.json({
    success: true,
    message: 'Friend request declined',
  });
});

// @desc    Get pending friend requests
// @route   GET /api/friends/requests
// @access  Private
exports.getPendingRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const pendingRequests = await FriendRequest.find({
    receiver: userId,
    status: 'pending',
  })
    .populate('sender', 'username email avatar status')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: pendingRequests.length,
    data: pendingRequests,
  });
});

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
exports.getFriends = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const friendships = await Friendship.find({
    $or: [{ user1: userId }, { user2: userId }],
  })
    .populate('user1', 'username email avatar status lastSeen')
    .populate('user2', 'username email avatar status lastSeen')
    .populate('conversationRoom', 'name lastMessage')
    .sort({ createdAt: -1 });

  // Map friendships to return only the friend data (not current user)
  const friends = friendships.map((friendship) => {
    const friend =
      friendship.user1._id.toString() === userId.toString()
        ? friendship.user2
        : friendship.user1;

    return {
      _id: friend._id,
      username: friend.username,
      email: friend.email,
      avatar: friend.avatar,
      status: friend.status,
      lastSeen: friend.lastSeen,
      conversationId: friendship.conversationRoom._id,
      friendshipId: friendship._id,
      friendsSince: friendship.createdAt,
    };
  });

  res.json({
    success: true,
    count: friends.length,
    data: friends,
  });
});

// @desc    Remove friend
// @route   DELETE /api/friends/:userId
// @access  Private
exports.removeFriend = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Find and delete friendship
  const friendship = await Friendship.findOneAndDelete({
    $or: [
      { user1: currentUserId, user2: userId },
      { user1: userId, user2: currentUserId },
    ],
  });

  if (!friendship) {
    return res.status(404).json({ error: 'Friendship not found' });
  }

  // Remove from friends arrays
  await User.findByIdAndUpdate(currentUserId, {
    $pull: { friends: userId },
  });

  await User.findByIdAndUpdate(userId, {
    $pull: { friends: currentUserId },
  });

  // Optionally delete the DM room
  // await Room.findByIdAndDelete(friendship.conversationRoom);

  // Emit socket event
  const io = req.app.get('io');
  const otherUser = await User.findById(userId);

  if (otherUser?.socketId) {
    io.to(otherUser.socketId).emit('friendship_removed', {
      removedBy: {
        _id: currentUserId,
        username: req.user.username,
      },
      friendshipId: friendship._id,
    });
  }

  res.json({
    success: true,
    message: 'Friend removed successfully',
  });
});
