const express = require('express');
const {
  getRoomMessages,
  getPrivateMessages,
  createMessage,
  addReaction,
  markAsRead,
  searchMessages,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/room/:roomId', protect, getRoomMessages);
router.get('/private/:userId', protect, getPrivateMessages);
router.post('/', protect, createMessage);
router.post('/:messageId/reaction', protect, addReaction);
router.post('/:messageId/read', protect, markAsRead);
router.get('/search', protect, searchMessages);

module.exports = router;
