// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validate = require('../middlewares/validation');
const Joi = require('joi');

// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────

const registerSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[6-9]\d{9}$/)           // Indian 10-digit mobile starting with 6-9
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be a valid 10-digit Indian number',
      'any.required': 'Mobile number is required',
    }),
  username: Joi.string().optional(),   // username is now optional
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit mobile number',
      'any.required': 'Mobile number is required',
    }),
  password: Joi.string().required(),
});

// ──────────────────────────────────────────────
// Register new user (mobile + password)
// ──────────────────────────────────────────────

exports.register = [
  validate(registerSchema),
  async (req, res) => {
    const { mobile, username, password } = req.body;

    console.log('Register attempt:', { mobile, username });

    try {
      // Check if mobile already exists
      let user = await User.findOne({ mobile });
      if (user) {
        return res.status(400).json({ success: false, msg: 'Mobile number already registered' });
      }

      // Create new user
      user = new User({
        mobile,
        username: username || `user_${mobile.slice(-4)}`, // auto-generate username if not provided
        password,
        role: 'admin', // default role (change as needed)
      });

      console.log("Till here safe")
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, mobile: user.mobile, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(201).json({
        success: true,
        msg: 'User registered successfully',
        token,
        user: {
          id: user._id,
          mobile: user.mobile,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('REGISTER ERROR:', err);
      res.status(500).json({
        success: false,
        msg: 'Server error during registration',
        error: err.message,
      });
    }
  },
];

// ──────────────────────────────────────────────
// Login with mobile + password
// ──────────────────────────────────────────────

exports.login = [
  validate(loginSchema),
  async (req, res) => {
    const { mobile, password } = req.body;

    console.log('Login attempt with mobile:', mobile);

    try {
      // Find user by mobile
      const user = await User.findOne({ mobile });
      if (!user) {
        return res.status(401).json({ success: false, msg: 'Invalid mobile number or password' });
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, msg: 'Invalid mobile number or password' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, mobile: user.mobile, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        success: true,
        msg: 'Login successful',
        token,
        user: {
          id: user._id,
          mobile: user.mobile,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      res.status(500).json({
        success: false,
        msg: 'Server error during login',
        error: err.message,
      });
    }
  },
];

// ──────────────────────────────────────────────
// Get current authenticated user
// ──────────────────────────────────────────────

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        mobile: user.mobile,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('GET ME ERROR:', err);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};