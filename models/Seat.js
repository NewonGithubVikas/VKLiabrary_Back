const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    // ── Numeric field for reliable sorting ─────────────────────────────
    number: {
      type: Number,
      required: true,
      min: 1,
      index: true, // faster sorting
    },

    // ── Human-readable display number (what users see) ─────────────────
    displayNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true, // prevent duplicates across the system
    },

    // Optional: store prefix separately if you want to search/group by it
    prefix: {
      type: String,
      trim: true,
      default: '',
    },

    type: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'full_day'],
      required: true,
    },

    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: [true, 'Floor is required'],
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },

    reserved: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available',
    },

    // Subadmin / multi-tenant fields (already good)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    rootAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index: unique seat per floor
seatSchema.index({ floor: 1, number: 1 }, { unique: true });

// Also index displayNumber for fast lookup/search
seatSchema.index({ displayNumber: 1 }, { unique: true });

// Virtuals for convenience
seatSchema.virtual('isOccupied').get(function () {
  return !!this.assignedTo;
});

module.exports = mongoose.model('Seat', seatSchema);