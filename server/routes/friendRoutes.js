const express = require('express');
const router = express.Router();
const {
  searchUserByEmail,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Search user by email
router.post('/search', searchUserByEmail);

// Send friend request
router.post('/request', sendFriendRequest);

// Accept friend request
router.post('/accept/:requestId', acceptFriendRequest);

// Decline friend request
router.post('/decline/:requestId', declineFriendRequest);

// Get pending friend requests
router.get('/requests', getPendingRequests);

// Get friends list
router.get('/', getFriends);

// Remove friend
router.delete('/:userId', removeFriend);

module.exports = router;
