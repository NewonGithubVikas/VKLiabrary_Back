// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');
// const path = require('path');

// const errorHandler = require('./middlewares/errorHandler');
// const authRoutes = require('./routes/authRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes');
// const memberRoutes = require('./routes/memberRoutes');
// const planRoutes = require('./routes/planRoutes');
// const billingRoutes = require('./routes/billingRoutes');
// const seatRoutes = require('./routes/seatRoutes');
// const floorRoutes = require('./routes/floorRoutes');
// const attendanceRoutes = require('./routes/attendanceRoutes');
// const smsRoutes = require('./routes/smsRoutes');
// const reportRoutes = require('./routes/reportRoutes');
// const earningRoutes = require('./routes/earningRoutes');
// const uploadRoutes = require('./routes/uploadRoutes');
// const subadminRoutes = require('./routes/subadminRoutes');
// const addressRoutes = require('./routes/addressRoutes');
// const app = express();

// // Security & Logging
// app.use(helmet());
// app.use(morgan('dev'));
// app.use(cors());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // ──────────────────────────────────────────────
// // Rate Limiting - All values loaded from .env
// // ──────────────────────────────────────────────

// // General API limit (most routes)
// const generalLimiter = rateLimit({
//   windowMs: (parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MIN) || 1) * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX) || 150,
//   message: {
//     success: false,
//     message: 'Too many requests from this IP. Please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // Stricter limit for authentication routes (login, register, OTP, etc.)
// const authLimiter = rateLimit({
//   windowMs: (parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MIN) || 15) * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
//   message: {
//     success: false,
//     message: 'Too many authentication attempts. Try again later or reset password.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // Optional: stricter limit for file uploads (if needed)
// const uploadLimiter = rateLimit({
//   windowMs: (parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MIN) || 1) * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 30,
//   message: 'Too many uploads. Please try again in a minute.',
// });

// // Apply rate limiters
// app.use('/api/auth', authLimiter);
// app.use('/api/upload', uploadLimiter);       // optional - protect uploads
// app.use('/api', generalLimiter);             // catch-all for other API routes

// // Serve uploaded images (no rate limit here)
// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// // Routes
// app.use('/api/addresses', addressRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/subadmins', subadminRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/members', memberRoutes);
// app.use('/api/plans', planRoutes);
// app.use('/api/billings', billingRoutes);
// app.use('/api/seats', seatRoutes);
// app.use('/api/floors', floorRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/sms', smsRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/earn', earningRoutes);
// app.use('/api/upload', uploadRoutes);

// // Error Handler (last middleware)
// app.use(errorHandler);

// // Database Connection
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected successfully'))
//   .catch(err => {
//     console.error('MongoDB connection error:', err);
//     process.exit(1);
//   });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Images accessible at: http://localhost:${PORT}/uploads/...`);
//   console.log(`Rate limits active:`);
//   console.log(`  - General: ${process.env.RATE_LIMIT_GENERAL_MAX || 150} req / ${process.env.RATE_LIMIT_GENERAL_WINDOW_MIN || 1} min`);
//   console.log(`  - Auth: ${process.env.RATE_LIMIT_AUTH_MAX || 10} req / ${process.env.RATE_LIMIT_AUTH_WINDOW_MIN || 15} min`);
// });



// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');
// const path = require('path');

// const errorHandler = require('./middlewares/errorHandler');
// const authRoutes = require('./routes/authRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes');
// const memberRoutes = require('./routes/memberRoutes');
// const planRoutes = require('./routes/planRoutes');
// const billingRoutes = require('./routes/billingRoutes');
// const seatRoutes = require('./routes/seatRoutes');
// const floorRoutes = require('./routes/floorRoutes');
// const attendanceRoutes = require('./routes/attendanceRoutes');
// const smsRoutes = require('./routes/smsRoutes');
// const reportRoutes = require('./routes/reportRoutes');
// const earningRoutes = require('./routes/earningRoutes');
// const uploadRoutes = require('./routes/uploadRoutes');
// const subadminRoutes = require('./routes/subadminRoutes');
// const addressRoutes = require('./routes/addressRoutes');

// const app = express();

// // Security & Logging
// app.use(helmet());
// app.use(morgan('dev'));
// app.use(cors());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Rate Limiting
// const generalLimiter = rateLimit({
//   windowMs: (parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MIN) || 1) * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX) || 150,
//   message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const authLimiter = rateLimit({
//   windowMs: (parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MIN) || 15) * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
//   message: { success: false, message: 'Too many authentication attempts. Try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const uploadLimiter = rateLimit({
//   windowMs: (parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MIN) || 1) * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 30,
//   message: 'Too many uploads. Please try again in a minute.',
// });

// app.use('/api/auth', authLimiter);
// app.use('/api/upload', uploadLimiter);
// app.use('/api', generalLimiter);

// // Serve uploads
// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// // ====================== PING / HEALTH ENDPOINT FOR CRON-JOB.ORG ======================
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Server is alive',
//     timestamp: new Date().toISOString()
//   });
// });

// // Also allow root ping (optional but useful)
// app.get('/', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Welcome to the API - Server is running'
//   });
// });

// // ====================== ROUTES ======================
// app.use('/api/addresses', addressRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/subadmins', subadminRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/members', memberRoutes);
// app.use('/api/plans', planRoutes);
// app.use('/api/billings', billingRoutes);
// app.use('/api/seats', seatRoutes);
// app.use('/api/floors', floorRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/sms', smsRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/earn', earningRoutes);
// app.use('/api/upload', uploadRoutes);

// // Error Handler
// app.use(errorHandler);

// // Database Connection
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected successfully'))
//   .catch(err => {
//     console.error('MongoDB connection error:', err);
//     process.exit(1);
//   });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📍 Health endpoint: https://your-app.onrender.com/health`);
//   console.log(`✅ Ready for cron-job.org pings`);
// });



require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const memberRoutes = require('./routes/memberRoutes');
const planRoutes = require('./routes/planRoutes');
const billingRoutes = require('./routes/billingRoutes');
const seatRoutes = require('./routes/seatRoutes');
const floorRoutes = require('./routes/floorRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const smsRoutes = require('./routes/smsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const earningRoutes = require('./routes/earningRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const subadminRoutes = require('./routes/subadminRoutes');
const addressRoutes = require('./routes/addressRoutes');

const app = express();

// ====================== SECURITY & MIDDLEWARE ======================
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====================== RATE LIMITERS ======================
const generalLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MIN) || 1) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX) || 150,
  message: { 
    success: false, 
    message: 'Too many requests from this IP. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MIN) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  message: { 
    success: false, 
    message: 'Too many authentication attempts. Try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MIN) || 1) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 30,
  message: { 
    success: false, 
    message: 'Too many uploads. Please try again in a minute.' 
  },
});

// Skip rate limiting for health checks (Important for cron-job.org)
const skipHealthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/' || req.path === '/ping') {
    return next();
  }
  return generalLimiter(req, res, next);
};

// ====================== HEALTH CHECK (Must be before rate limiters & routes) ======================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is alive and healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's'
  });
});

app.get('/ping', (req, res) => {   // Extra endpoint for cron-job
  res.status(200).send('pong');
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Server is running'
  });
});

// ====================== APPLY RATE LIMITERS ======================
app.use('/api/auth', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use(skipHealthCheck);           // Protects /health, /ping, and / from general limiter

// ====================== ROUTES ======================
app.use('/api/addresses', addressRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subadmins', subadminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/billings', billingRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/earn', earningRoutes);
app.use('/api/upload', uploadRoutes);

// ====================== ERROR HANDLER ======================
app.use(errorHandler);

// ====================== DATABASE CONNECTION ======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ====================== START SERVER ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health Check: https://your-app.onrender.com/health`);
  console.log(`🔄 Cron-job.org is safe to ping /health every 5 minutes`);
  console.log(`📊 Rate limiting active (except health endpoints)`);
});