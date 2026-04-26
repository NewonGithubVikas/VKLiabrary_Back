// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const validate = require("../middlewares/validation");
const Joi = require("joi");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
// Hash password (IMPORTANT: Use bcrypt in production)
// const bcrypt = require('bcrypt');

// ──────────────────────────────────────────────
// Token Generators
// ──────────────────────────────────────────────
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, mobile: user.mobile, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

// ──────────────────────────────────────────────
// Validation Schemas (unchanged)
// ──────────────────────────────────────────────
const registerSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),

  email: Joi.string()
    .email({ tlds: { allow: false } }) // allows all domains
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "any.required": "Email is required",
    }),
  username: Joi.string().optional(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  password: Joi.string().required(),
});

// ──────────────────────────────────────────────
// Register
// ──────────────────────────────────────────────
// Email transporter (use environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ==================== 1. Forgot Password - Send OTP ====================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    await Otp.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
    });

    // Send email
    await transporter.sendMail({
      from: `"VK Library" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset OTP - VK Library",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.username || "User"},</p>
          <p>Your OTP to reset your password is:</p>
          <h1 style="color: #2563eb; letter-spacing: 8px;">${otp}</h1>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email or contact support.</p>
          <p>Best regards,<br><strong>VK Library Team</strong></p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "OTP has been sent to your email address",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again later.",
    });
  }
};

// ==================== 2. Verify OTP ====================
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  try {
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      otp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // OTP is valid - delete it so it can't be reused
    // await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying OTP",
    });
  }
};

// ==================== 3. Reset Password ====================
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log("email", email, "otp", otp, "newPassword", newPassword);
  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email, OTP and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  try {
    // Find user
    const user = await User.findOne({ email: email.toLowerCase(),status : {$ne:'delete'} });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP again (extra safety)
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      otp,
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or has expired",
      });
    }

    // user.password = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;

    await user.save();

    // Delete OTP after successful reset
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
    });
  }
};
exports.register = [
  validate(registerSchema),
  async (req, res) => {
    const { mobile, email, username, password } = req.body;

    try {
      let user = await User.findOne({
        $or: [{ mobile: mobile }, { email: email }],
      });
      if (user) {
        return res
          .status(400)
          .json({
            success: false,
            msg: "User already exists with this mobile or email",
          });
      }

      user = new User({
        mobile,
        email,
        username: username || `user_${mobile.slice(-4)}`,
        password,
        role: "admin",
      });

      await user.save();

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken; // ← save in DB
      await user.save();

      res.status(201).json({
        success: true,
        msg: "User registered successfully",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          mobile: user.mobile,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      res
        .status(500)
        .json({ success: false, msg: "Server error", error: err.message });
    }
  },
];

// ──────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────
exports.login = [
  validate(loginSchema),
  async (req, res) => {
    const { mobile, password } = req.body;

    try {
      const user = await User.findOne({ mobile });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, msg: "Invalid mobile or password" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, msg: "Invalid mobile or password" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        success: true,
        msg: "Login successful",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          mobile: user.mobile,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      res.status(500).json({ success: false, msg: "Server error" });
    }
  },
];

// ──────────────────────────────────────────────
// NEW: Refresh Token Endpoint
// ──────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, msg: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ success: false, msg: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("REFRESH TOKEN ERROR:", err);
    res
      .status(403)
      .json({ success: false, msg: "Invalid or expired refresh token" });
  }
};

// ──────────────────────────────────────────────
// Get Me (unchanged)
// ──────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, msg: "User not found" });

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
    console.error("GET ME ERROR:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
