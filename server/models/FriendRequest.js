const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries
friendRequestSchema.index({ sender: 1, receiver: 1 });
friendRequestSchema.index({ receiver: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });

// Prevent duplicate friend requests
friendRequestSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  { unique: true }
);

// Instance method to check if request is still pending
friendRequestSchema.methods.isPending = function () {
  return this.status === 'pending';
};

// Static method to find pending requests for a user
friendRequestSchema.statics.findPendingForUser = function (userId) {
  return this.find({
    receiver: userId,
    status: 'pending',
  }).populate('sender', 'username email avatar');
};

// Static method to find sent requests by a user
friendRequestSchema.statics.findSentByUser = function (userId) {
  return this.find({
    sender: userId,
    status: 'pending',
  }).populate('receiver', 'username email avatar');
};

// Static method to check if request exists between two users
friendRequestSchema.statics.findBetweenUsers = function (userId1, userId2) {
  return this.findOne({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 },
    ],
    status: 'pending',
  });
};

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;
