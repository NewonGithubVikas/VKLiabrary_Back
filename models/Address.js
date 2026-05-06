// models/Address.js
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },
    addressLine: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rootAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Unique index - Only one address per rootAdmin
addressSchema.index({ rootAdmin: 1 }, { unique: true });

// Better Error Handling
addressSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Only one address is allowed per Root Admin"));
  } else {
    next(error);
  }
});

module.exports = mongoose.model("Address", addressSchema);