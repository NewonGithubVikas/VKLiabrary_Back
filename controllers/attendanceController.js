const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Joi = require('joi');
// const { getRootAdminId } = require('./memberController'); // assuming you have this helper

// ──────────────────────────────────────────────
// Schema Validation
// ──────────────────────────────────────────────
const attendanceSchema = Joi.object({
  member: Joi.string().required(),
  date: Joi.date().required(),
  present: Joi.boolean().required(),
  remarks: Joi.string().allow('').optional(),
});
// Helper to get rootAdminId from authenticated user
const getRootAdminId = (user) => {
  return user.role === 'admin' ? user._id : user.adminId;
};
exports.markAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const rootAdminId = getRootAdminId(user);

    // Validate only the fields sent from frontend
    const { member, date, present, remarks } = req.body;

    if (!member || !date || present === undefined) {
      return res.status(400).json({ 
        message: 'member, date, and present are required' 
      });
    }

    // Validate member belongs to this root admin
    const memberDoc = await Member.findOne({
      _id: member,
      rootAdmin: rootAdminId,
      status : {$ne:'delete'}
    });

    if (!memberDoc) {
      return res.status(404).json({ 
        message: 'Member not found or unauthorized' 
      });
    }

    // Normalize date to start of day (to avoid time mismatch issues)
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check for duplicate attendance on same day
    const existing = await Attendance.findOne({
      member,
      status : {$ne:'delete'},
      date: {
        $gte: attendanceDate,
        $lte: new Date(attendanceDate).setHours(23, 59, 59, 999),
      },
    });

    if (existing) {
      // Update existing record
      existing.present = present;
      existing.remarks = remarks || existing.remarks;
      existing.markedBy = user._id;
      await existing.save();

      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        attendance: existing,
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      member,
      date: attendanceDate,
      present,
      remarks: remarks || '',
      // ── These two fields are automatically filled here ──
      createdBy: user._id,
      rootAdmin: rootAdminId,
      markedBy: user._id,      // optional: who actually marked it
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (err) {
    console.error('Mark Attendance Error:', err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(err.errors).map(e => e.message),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Attendance already marked for this member on this date',
      });
    }

    res.status(500).json({ 
      message: 'Server error while marking attendance',
      error: err.message 
    });
  }
};

// ──────────────────────────────────────────────
// GET ATTENDANCE HISTORY (for one member or all)
// ──────────────────────────────────────────────
exports.getAttendanceHistory = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const rootAdminId = getRootAdminId(user);

    const { member, startDate, endDate, limit = 30 } = req.query;

    const filter = { rootAdmin: rootAdminId,status : {$ne:'delete'} };
    if (member) filter.member = member;
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) {
      if (!filter.date) filter.date = {};
      filter.date.$lte = new Date(endDate);
    }

    const history = await Attendance.find(filter)
      .populate('member', 'memberId name mobile')
      .populate('markedBy', 'name email')
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    console.error('Get Attendance History Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};