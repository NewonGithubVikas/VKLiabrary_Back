const express = require('express');
const { register, login,getMe,refreshToken,forgotPassword,
  verifyOTP,
  resetPassword, } = require('../controllers/authController');
const auth = require('../middlewares/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/refresh-token',refreshToken);
// Forget Password Flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
module.exports = router;