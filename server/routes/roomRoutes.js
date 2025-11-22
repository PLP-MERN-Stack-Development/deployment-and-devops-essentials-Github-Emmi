const express = require('express');
const {
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
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getRooms);
router.get('/my-rooms', protect, getUserRooms);
router.post('/direct', protect, getOrCreateDirectRoom);
router.get('/:roomId', protect, getRoomById);
router.post('/', protect, createRoom);
router.put('/:roomId', protect, updateRoom);
router.post('/:roomId/join', protect, joinRoom);
router.post('/:roomId/leave', protect, leaveRoom);
router.delete('/:roomId', protect, deleteRoom);
router.put('/:roomId/admins', protect, addAdmin);
router.delete('/:roomId/admins/:userId', protect, removeAdmin);
router.delete('/:roomId/members/:userId', protect, removeMember);

module.exports = router;
