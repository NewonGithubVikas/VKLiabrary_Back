const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Reuse same multer config as middleware
const uploadMemberImages = require('../middlewares/upload');

router.post('/image', uploadMemberImages, (req, res) => {
  try {
    if (!req.files || (!req.files.profilePhoto && !req.files.additionalPhotos)) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const imageUrls = [];

    if (req.files.profilePhoto) {
      imageUrls.push(`/uploads/members/${req.files.profilePhoto[0].filename}`);
    }
    if (req.files.additionalPhotos) {
      req.files.additionalPhotos.forEach(file => {
        imageUrls.push(`/uploads/members/${file.filename}`);
      });
    }

    res.status(200).json({
      success: true,
      imageUrls,
      message: 'Images uploaded successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;