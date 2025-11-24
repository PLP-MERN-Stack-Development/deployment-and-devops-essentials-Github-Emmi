const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: 'https://ui-avatars.com/api/?background=random&name=User',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [200, 'Bio cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user is friend with another user
userSchema.methods.isFriend = function (userId) {
  return this.friends.some(
    (friendId) => friendId.toString() === userId.toString()
  );
};

// Get pending friend requests received by this user
userSchema.methods.getPendingRequests = async function () {
  const FriendRequest = mongoose.model('FriendRequest');
  return await FriendRequest.find({
    receiver: this._id,
    status: 'pending',
  }).populate('sender', 'username email avatar');
};

// Get pending friend requests sent by this user
userSchema.methods.getSentRequests = async function () {
  const FriendRequest = mongoose.model('FriendRequest');
  return await FriendRequest.find({
    sender: this._id,
    status: 'pending',
  }).populate('receiver', 'username email avatar');
};

// Update avatar URL with username
userSchema.pre('save', function () {
  if (this.isNew && this.avatar.includes('ui-avatars.com')) {
    this.avatar = `https://ui-avatars.com/api/?background=random&name=${this.username}`;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
