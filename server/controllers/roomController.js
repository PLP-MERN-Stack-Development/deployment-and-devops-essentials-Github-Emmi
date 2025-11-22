const Room = require('../models/Room');
const { errorResponse, successResponse } = require('../utils/helpers');
const asyncHandler = require('../middleware/asyncHandler');

// Get all rooms
const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ isActive: true })
    .populate('creator', 'username avatar')
    .populate('members', 'username avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  res.json(successResponse(rooms));
});

// Get user's rooms
const getUserRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({
    members: req.user._id,
    isActive: true,
  })
    .populate('creator', 'username avatar')
    .populate('lastMessage')
    .populate('members', 'username avatar status')
    .sort({ updatedAt: -1 });

  res.json(successResponse(rooms));
});

// Get room by ID
const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId)
    .populate('creator', 'username avatar')
    .populate('members', 'username avatar status')
    .populate('admins', 'username avatar');

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  res.json(successResponse(room));
});

// Create new room
const createRoom = asyncHandler(async (req, res) => {
  const { name, description, roomType } = req.body;

  const room = await Room.create({
    name,
    description,
    roomType: roomType || 'public',
    creator: req.user._id,
  });

  const populatedRoom = await Room.findById(room._id)
    .populate('creator', 'username avatar')
    .populate('members', 'username avatar');

  res.status(201).json(successResponse(populatedRoom, 'Room created'));
});

// Update room
const updateRoom = asyncHandler(async (req, res) => {
  const { name, description, avatar } = req.body;
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  // Check if user is admin
  if (!room.admins.includes(req.user._id)) {
    return res.status(403).json(errorResponse('Not authorized', 403));
  }

  room.name = name || room.name;
  room.description = description || room.description;
  room.avatar = avatar || room.avatar;

  const updatedRoom = await room.save();

  res.json(successResponse(updatedRoom, 'Room updated'));
});

// Join room
const joinRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  if (room.members.includes(req.user._id)) {
    return res.status(400).json(errorResponse('Already a member', 400));
  }

  room.members.push(req.user._id);
  await room.save();

  const updatedRoom = await Room.findById(room._id)
    .populate('members', 'username avatar');

  res.json(successResponse(updatedRoom, 'Joined room successfully'));
});

// Leave room
const leaveRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  room.members = room.members.filter(
    (member) => member.toString() !== req.user._id.toString()
  );

  await room.save();

  res.json(successResponse(null, 'Left room successfully'));
});

// Delete room
const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  // For direct messages, allow any member to delete
  if (room.roomType === 'direct') {
    const isMember = room.members.some(
      (member) => member.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json(errorResponse('Not authorized', 403));
    }
    
    // Mark room as inactive
    room.isActive = false;
    await room.save();
    
    return res.json(successResponse(null, 'Conversation deleted successfully'));
  }

  // For group rooms, only creator can delete
  if (room.creator.toString() !== req.user._id.toString()) {
    return res.status(403).json(errorResponse('Not authorized', 403));
  }

  room.isActive = false;
  await room.save();

  res.json(successResponse(null, 'Room deleted successfully'));
});

// Get or create direct chat room
const getOrCreateDirectRoom = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json(errorResponse('Recipient ID is required', 400));
  }

  if (recipientId === req.user._id.toString()) {
    return res.status(400).json(errorResponse('Cannot chat with yourself', 400));
  }

  // Check if direct room already exists
  const existingRoom = await Room.findOne({
    roomType: 'direct',
    isActive: true,
    members: { $all: [req.user._id, recipientId], $size: 2 },
  })
    .populate('members', 'username avatar status')
    .populate('lastMessage');

  if (existingRoom) {
    return res.json(successResponse(existingRoom, 'Direct chat found'));
  }

  // Create new direct room
  const User = require('../models/User');
  const recipient = await User.findById(recipientId);

  if (!recipient) {
    return res.status(404).json(errorResponse('User not found', 404));
  }

  const directRoom = await Room.create({
    name: `${req.user.username} & ${recipient.username}`,
    roomType: 'direct',
    creator: req.user._id,
    members: [req.user._id, recipientId],
    admins: [req.user._id, recipientId],
  });

  const populatedRoom = await Room.findById(directRoom._id)
    .populate('members', 'username avatar status')
    .populate('lastMessage');

  res.status(201).json(successResponse(populatedRoom, 'Direct chat created'));
});

// Add admin to room
const addAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  // Check if current user is admin
  if (!room.admins.includes(req.user._id)) {
    return res.status(403).json(errorResponse('Not authorized', 403));
  }

  // Check if user is already admin
  if (room.admins.includes(userId)) {
    return res.status(400).json(errorResponse('User is already an admin', 400));
  }

  // Check if user is a member
  if (!room.members.includes(userId)) {
    return res.status(400).json(errorResponse('User must be a member first', 400));
  }

  room.admins.push(userId);
  await room.save();

  const updatedRoom = await Room.findById(room._id)
    .populate('admins', 'username avatar');

  res.json(successResponse(updatedRoom, 'Admin added successfully'));
});

// Remove admin from room
const removeAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  // Check if current user is admin
  if (!room.admins.includes(req.user._id)) {
    return res.status(403).json(errorResponse('Not authorized', 403));
  }

  // Cannot remove creator as admin
  if (room.creator.toString() === userId) {
    return res.status(400).json(errorResponse('Cannot remove creator as admin', 400));
  }

  room.admins = room.admins.filter((id) => id.toString() !== userId);
  await room.save();

  const updatedRoom = await Room.findById(room._id)
    .populate('admins', 'username avatar');

  res.json(successResponse(updatedRoom, 'Admin removed successfully'));
});

// Remove member from room
const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return res.status(404).json(errorResponse('Room not found', 404));
  }

  // Check if current user is admin
  if (!room.admins.includes(req.user._id)) {
    return res.status(403).json(errorResponse('Not authorized', 403));
  }

  // Cannot remove creator
  if (room.creator.toString() === userId) {
    return res.status(400).json(errorResponse('Cannot remove creator', 400));
  }

  room.members = room.members.filter((id) => id.toString() !== userId);
  room.admins = room.admins.filter((id) => id.toString() !== userId);
  await room.save();

  const updatedRoom = await Room.findById(room._id)
    .populate('members', 'username avatar');

  res.json(successResponse(updatedRoom, 'Member removed successfully'));
});

module.exports = {
  getRooms,
  getUserRooms,
  getRoomById,
  createRoom,
  updateRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  getOrCreateDirectRoom,
  addAdmin,
  removeAdmin,
  removeMember,
};
