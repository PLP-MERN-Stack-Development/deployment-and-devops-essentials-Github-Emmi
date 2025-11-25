const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for fast friendship lookups
friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });
friendshipSchema.index({ user1: 1 });
friendshipSchema.index({ user2: 1 });

// Static method to check if two users are friends
friendshipSchema.statics.areFriends = async function (userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { user1: userId1, user2: userId2 },
      { user1: userId2, user2: userId1 },
    ],
  });
  return !!friendship;
};

// Static method to get friendship between two users
friendshipSchema.statics.findBetweenUsers = function (userId1, userId2) {
  return this.findOne({
    $or: [
      { user1: userId1, user2: userId2 },
      { user1: userId2, user2: userId1 },
    ],
  }).populate('conversationRoom');
};

// Static method to get all friends of a user
friendshipSchema.statics.findFriendsOf = function (userId) {
  return this.find({
    $or: [{ user1: userId }, { user2: userId }],
  })
    .populate('user1', 'username email avatar status lastSeen')
    .populate('user2', 'username email avatar status lastSeen')
    .populate('conversationRoom', 'name lastMessage');
};

// Instance method to get the friend ID (not the current user)
friendshipSchema.methods.getFriendId = function (currentUserId) {
  return this.user1.toString() === currentUserId.toString()
    ? this.user2
    : this.user1;
};

// Pre-save hook to ensure user1 < user2 (for consistent ordering)
friendshipSchema.pre('save', function () {
  if (this.user1.toString() > this.user2.toString()) {
    [this.user1, this.user2] = [this.user2, this.user1];
  }
});

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;
