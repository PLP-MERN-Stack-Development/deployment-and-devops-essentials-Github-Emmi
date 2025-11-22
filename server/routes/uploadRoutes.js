const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/helpers');
const { formatFileSize } = require('../utils/fileUtils');

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No file uploaded', 400));
    }

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      formattedSize: formatFileSize(req.file.size),
      url: `/uploads/${req.file.filename}`,
    };

    res.json(successResponse(fileData, 'File uploaded successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
});

module.exports = router;
