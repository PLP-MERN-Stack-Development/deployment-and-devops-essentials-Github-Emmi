const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');
const { errorResponse, successResponse } = require('../utils/helpers');
const asyncHandler = require('../middleware/asyncHandler');

// Register new user
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userExists) {
    return res.status(400).json(
      errorResponse(
        userExists.email === email
          ? 'Email already registered'
          : 'Username already taken',
        400
      )
    );
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json(
      successResponse(
        {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          token: generateToken(user._id),
        },
        'User registered successfully'
      )
    );
  } else {
    res.status(400).json(errorResponse('Invalid user data', 400));
  }
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    // Update user status
    user.status = 'online';
    await user.save();

    res.json(
      successResponse(
        {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          token: generateToken(user._id),
        },
        'Login successful'
      )
    );
  } else {
    res.status(401).json(errorResponse('Invalid email or password', 401));
  }
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json(
      successResponse({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        lastSeen: user.lastSeen,
      })
    );
  } else {
    res.status(404).json(errorResponse('User not found', 404));
  }
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

    const updatedUser = await user.save();

    res.json(
      successResponse(
        {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
        },
        'Profile updated successfully'
      )
    );
  } else {
    res.status(404).json(errorResponse('User not found', 404));
  }
});

// Get all users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('-password')
    .sort({ status: -1, username: 1 });

  res.json(successResponse(users));
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getUsers,
};
