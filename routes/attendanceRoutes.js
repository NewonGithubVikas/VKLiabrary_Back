const express = require('express');
const auth = require('../middlewares/auth');
const {
  markAttendance,
  getAttendanceHistory,
} = require('../controllers/attendanceController');

const router = express.Router();

router.use(auth);

// Mark attendance (single entry)
router.post('/', markAttendance);

// Get history (for one member or filtered)
router.get('/history', getAttendanceHistory);

module.exports = router;