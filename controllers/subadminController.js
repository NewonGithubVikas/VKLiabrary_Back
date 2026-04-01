// controllers/subadminController.js
const User = require("../models/User");
const validate = require("../middlewares/validation");
const Joi = require("joi");

// Validation Schema
const addSubadminSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Mobile number must be a valid 10-digit Indian number",
      "any.required": "Mobile number is required",
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  username: Joi.string().optional().trim().allow(""),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

// Add Subadmin
exports.addSubadmin = [
  validate(addSubadminSchema),
  async (req, res) => {
    const admin = req.user;

    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        msg: "Only main admins can create subadmins",
      });
    }

    const { mobile, email, username, password } = req.body;

    try {
      // Check for existing user (mobile or email)
      const existingUser = await User.findOne({
        $or: [{ mobile }, { email: email.toLowerCase() }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          msg: "User already exists with this mobile or email",
        });
      }

      // Check username if provided
      if (username) {
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          return res.status(400).json({
            success: false,
            msg: "Username already taken",
          });
        }
      }

      // Create new subadmin
      const subadmin = new User({
        mobile,
        email: email.toLowerCase(),
        username: username || `sub_${mobile.slice(-4)}`,
        password,                    // ← Will be hashed in User pre-save middleware (recommended)
        role: "subadmin",
        adminId: admin._id,
      });

      await subadmin.save();

      res.status(201).json({
        success: true,
        msg: "Subadmin created successfully",
        subadmin: {
          id: subadmin._id,
          mobile: subadmin.mobile,
          email: subadmin.email,
          username: subadmin.username,
          role: subadmin.role,
        },
      });
    } catch (err) {
      console.error("ADD SUBADMIN ERROR:", err);
      res.status(500).json({
        success: false,
        msg: "Server error while creating subadmin",
      });
    }
  },
];

// Get My Subadmins
exports.getMySubadmins = async (req, res) => {
  const admin = req.user;
  if (admin.role !== "admin") {
    return res.status(403).json({
      success: false,
      msg: "Only main admins can view their subadmins",
    });
  }

  try {
    const subadmins = await User.find({
      role: "subadmin",
      adminId: admin._id,
    }).select("-password");

    res.json({
      success: true,
      count: subadmins.length,
      subadmins,
    });
  } catch (err) {
    console.error("GET MY SUBADMINS ERROR:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while fetching subadmins",
    });
  }
};

// Delete Subadmin
exports.deleteSubadmin = async (req, res) => {
  const admin = req.user;
  const { subadminId } = req.params;

  if (admin.role !== "admin") {
    return res.status(403).json({
      success: false,
      msg: "Only main admins can delete subadmins",
    });
  }

  try {
    const subadmin = await User.findById(subadminId);
    if (!subadmin) {
      return res.status(404).json({
        success: false,
        msg: "Subadmin not found",
      });
    }

    if (subadmin.adminId?.toString() !== admin._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "You do not have permission to delete this subadmin",
      });
    }

    if (subadmin.role !== "subadmin") {
      return res.status(400).json({
        success: false,
        msg: "Only subadmin accounts can be deleted",
      });
    }

    await User.findByIdAndDelete(subadminId);

    res.json({
      success: true,
      msg: `Subadmin ${subadmin.username || subadmin.mobile} deleted successfully`,
    });
  } catch (err) {
    console.error("DELETE SUBADMIN ERROR:", err);
    res.status(500).json({
      success: false,
      msg: "Server error while deleting subadmin",
    });
  }
};


// // controllers/subadminController.js (or inside your routes file)
// const User = require("../models/User");
// const validate = require("../middlewares/validation");
// const Joi = require("joi");

// // ──────────────────────────────────────────────
// // Validation Schema for Subadmin Creation
// // ──────────────────────────────────────────────
// const addSubadminSchema = Joi.object({
//   mobile: Joi.string()
//     .pattern(/^[6-9]\d{9}$/)
//     .required()
//     .messages({
//       "string.pattern.base":
//         "Mobile number must be a valid 10-digit Indian number",
//       "any.required": "Mobile number is required",
//     }),
//   username: Joi.string().optional().trim(),
//   password: Joi.string().min(6).required().messages({
//     "string.min": "Password must be at least 6 characters",
//     "any.required": "Password is required",
//   }),
// });

// // ──────────────────────────────────────────────
// // Add Subadmin (Admin only)
// // ──────────────────────────────────────────────
// exports.addSubadmin = [
//   validate(addSubadminSchema),
//   async (req, res) => {
//     const admin = req.user;

//     // Only main admin can create subadmins
//     if (admin.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         msg: "Only main admins can create subadmins",
//       });
//     }

//     const { mobile, email, username, password } = req.body;

//     try {
//       // Check if mobile already exists (unique)
//       let existingUser = await User.findOne({
//         $or: [{ mobile: mobile }, { email: email }],
//       });
//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           msg: "User already exists with this mobile or email",
//         });
//       }

//       // Optional: check username if provided
//       if (username) {
//         existingUser = await User.findOne({ username });
//         if (existingUser) {
//           return res.status(400).json({
//             success: false,
//             msg: "Username already taken",
//           });
//         }
//       }

//       // Create subadmin
//       const subadmin = new User({
//         mobile,
//         email,
//         username: username || `sub_${mobile.slice(-4)}`, // auto-generate if not given
//         password,
//         role: "subadmin",
//         adminId: admin._id, // link to parent admin
//       });

//       await subadmin.save();

//       res.status(201).json({
//         success: true,
//         msg: "Subadmin created successfully",
//         subadmin: {
//           id: subadmin._id,
//           mobile: subadmin.mobile,
//           username: subadmin.username,
//           role: subadmin.role,
//           createdAt: subadmin.createdAt,
//         },
//       });
//     } catch (err) {
//       console.error("ADD SUBADMIN ERROR:", err);
//       res.status(500).json({
//         success: false,
//         msg: "Server error while creating subadmin",
//         error: err.message,
//       });
//     }
//   },
// ];

// // ──────────────────────────────────────────────
// // Get all subadmins created by this admin
// // ──────────────────────────────────────────────
// exports.getMySubadmins = async (req, res) => {
//   const admin = req.user;

//   if (admin.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       msg: "Only main admins can view their subadmins",
//     });
//   }

//   try {
//     const subadmins = await User.find({
//       role: "subadmin",
//       adminId: admin._id,
//     }).select("-password"); // never return password

//     res.json({
//       success: true,
//       count: subadmins.length,
//       subadmins,
//     });
//   } catch (err) {
//     console.error("GET MY SUBADMINS ERROR:", err);
//     res.status(500).json({
//       success: false,
//       msg: "Server error while fetching subadmins",
//     });
//   }
// };

// // controllers/subadminController.js (add this at the bottom)

// // ──────────────────────────────────────────────
// // Delete a subadmin (only by the parent admin who created it)
// // ──────────────────────────────────────────────
// exports.deleteSubadmin = async (req, res) => {
//   const admin = req.user;
//   const { subadminId } = req.params;

//   // Only admins can delete subadmins
//   if (admin.role !== "admin") {
//     return res.status(403).json({
//       success: false,
//       msg: "Only main admins can delete subadmins",
//     });
//   }

//   try {
//     // Find the subadmin
//     const subadmin = await User.findById(subadminId);

//     if (!subadmin) {
//       return res.status(404).json({
//         success: false,
//         msg: "Subadmin not found",
//       });
//     }

//     // Check if this subadmin belongs to the requesting admin
//     if (subadmin.adminId?.toString() !== admin._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         msg: "You do not have permission to delete this subadmin",
//       });
//     }

//     // Prevent deletion if role is not subadmin (safety check)
//     if (subadmin.role !== "subadmin") {
//       return res.status(400).json({
//         success: false,
//         msg: "Only subadmin accounts can be deleted via this endpoint",
//       });
//     }

//     // Delete the subadmin
//     await User.findByIdAndDelete(subadminId);

//     res.json({
//       success: true,
//       msg: `Subadmin "${subadmin.username || subadmin.mobile}" deleted successfully`,
//     });
//   } catch (err) {
//     console.error("DELETE SUBADMIN ERROR:", err);
//     res.status(500).json({
//       success: false,
//       msg: "Server error while deleting subadmin",
//       error: err.message,
//     });
//   }
// };
