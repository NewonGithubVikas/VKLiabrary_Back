// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - auto delete after expiry
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for faster lookup
otpSchema.index({ email: 1, otp: 1 });

module.exports = mongoose.model('Otp', otpSchema);