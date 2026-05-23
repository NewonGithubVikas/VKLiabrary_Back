const Billing = require("../models/Billing");
const Member = require("../models/Member"); // needed for total due calculation

exports.getEarnDetailsRecord = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const rootAdminId = getRootAdminId(user);
    const range = (req.query.range || "all").toLowerCase(); // default: all time

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = null;
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    // ====================== DATE RANGE LOGIC ======================
    switch (range) {
      case "today":
        startDate = new Date(today);
        break;

      case "yesterday":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Sunday start
        break;

      case "thismonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;

      case "lastmonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last3months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "all":
      default:
        startDate = null; // No date filter
        break;
    }

    // ====================== QUERY BUILD ======================
    const query = {
      rootAdmin: rootAdminId,
      status: { $in: ["paid", "partial"] },
    };

    if (startDate) {
      query.billDate = { $gte: startDate, $lte: endDate };
    }

    // Fetch billings with range filter
    const billings = await Billing.find(query)
      .populate({
        path: "member",
        select: "memberId name mobile status lastDueAmount",
        match: { status: { $ne: "delete" } },
      })
      .populate({
        path: "plan",
        select: "name amount duration",
      })
      .sort({ billDate: -1 })
      .lean();

    // ====================== GROUP BY MEMBER ======================
    const membersMap = new Map();

    billings.forEach((billing) => {
      const member = billing.member;
      if (!member) return;

      const memberId = member._id.toString();

      if (!membersMap.has(memberId)) {
        membersMap.set(memberId, {
          _id: member._id,
          memberId: member.memberId,
          name: member.name,
          mobile: member.mobile,
          status: member.status,
          totalEarn: 0,
          billings: [],
        });
      }

      const memberEntry = membersMap.get(memberId);

      memberEntry.billings.push({
        _id: billing._id,
        planName: billing.plan?.name || "Unknown Plan",
        paidAmount: billing.paidAmount || 0,
        billDate: billing.billDate,
        status: billing.status,
        remarks: billing.remarks || "",
      });

      memberEntry.totalEarn += billing.paidAmount || 0;
    });

    // Convert to array and sort by earnings (highest first)
    const earnMembers = Array.from(membersMap.values()).sort(
      (a, b) => b.totalEarn - a.totalEarn
    );

    const totalEarnings = earnMembers.reduce((sum, m) => sum + m.totalEarn, 0);

    res.json({
      success: true,
      range,
      count: earnMembers.length,
      totalEarnings,
      formattedTotal: `₹${totalEarnings.toLocaleString("en-IN")}`,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      members: earnMembers,
    });
  } catch (err) {
    console.error("Get Earn Details Record Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Helper to get rootAdminId from authenticated user
const getRootAdminId = (user) => {
  return user.role === "admin" ? user._id : user.adminId;
};

// exports.getEarningSummary = async (req, res) => {
//   try {
//     const user = req.user;
//     if (!user) return res.status(401).json({ message: "Unauthorized" });

//     const rootAdminId = getRootAdminId(user);

//     // Get requested range from query param (default = week)
//     const range = (req.query.range || "week").toLowerCase();

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     let startDate;
//     let endDate = new Date(today);
//     endDate.setHours(23, 59, 59, 999);

//     switch (range) {
//       case "today":
//         startDate = new Date(today);
//         break;

//       case "yesterday":
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - 1);

//         endDate = new Date(startDate);
//         endDate.setHours(23, 59, 59, 999);
//         break;

//       case "week":
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - today.getDay()); // Sunday start
//         break;

//       case "thismonth":
//         startDate = new Date(today.getFullYear(), today.getMonth(), 1);
//         break;

//       case "lastmonth":
//         startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//         endDate = new Date(today.getFullYear(), today.getMonth(), 0);
//         endDate.setHours(23, 59, 59, 999);
//         break;

//       case "last3months":
//         startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
//         endDate = new Date(today.getFullYear(), today.getMonth(), 0);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case "due":
//         // Special case: total outstanding due
//         const dueResult = await Member.aggregate([
//           {
//             $match: {
//               rootAdmin: rootAdminId,
//               status: { $ne: "delete" },
//               lastDueAmount: { $gt: 0 },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               totalDue: { $sum: "$lastDueAmount" },
//             },
//           },
//         ]);

//         const totalDue = dueResult.length > 0 ? dueResult[0].totalDue : 0;
//         console.log("total due", dueResult);
//         return res.json({
//           success: true,
//           range: "total_due",
//           totalDue,
//           formattedDue: `₹${totalDue.toLocaleString("en-IN")}`,
//         });

//       default:
//         return res.status(400).json({
//           message:
//             "Invalid range. Use: today, yesterday, Week, thisMonth, lastMonth, last3Months",
//         });
//     }

//     // Common earnings query for date-based ranges
//     const earningsResult = await Billing.aggregate([
//       {
//         $match: {
//           rootAdmin: rootAdminId,
//           billDate: { $gte: startDate, $lte: endDate },
//           status: { $in: ["paid", "partial"] },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalEarnings: { $sum: "$paidAmount" },
//         },
//       },
//     ]);

//     const totalEarnings =
//       earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;
//     console.log("total earning ", earningsResult);
//     res.json({
//       success: true,
//       range,
//       startDate: startDate.toISOString(),
//       endDate: endDate.toISOString(),
//       totalEarnings,
//       formatted: `₹${totalEarnings.toLocaleString("en-IN")}`,
//     });
//   } catch (err) {
//     console.error("Get Earning Summary Error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

exports.getEarningSummary = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const rootAdminId = getRootAdminId(user);
    const range = (req.query.range || "week").toLowerCase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate;
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (range) {
      case "today":
        startDate = new Date(today);
        break;

      case "yesterday":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;

      case "thismonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;

      case "lastmonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last3months":
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "due":
        // Special case: total outstanding due
        const dueResult = await Member.aggregate([
          {
            $match: {
              rootAdmin: rootAdminId,
              status: { $ne: "delete" },
              lastDueAmount: { $gt: 0 },
            },
          },
          {
            $group: {
              _id: null,
              totalDue: { $sum: "$lastDueAmount" },
            },
          },
        ]);

        const totalDue = dueResult.length > 0 ? dueResult[0].totalDue : 0;
        console.log("total due", dueResult);
        return res.json({
          success: true,
          range: "total_due",
          totalDue,
          formattedDue: `₹${totalDue.toLocaleString("en-IN")}`,
        });

      default:
        return res.status(400).json({ message: "Invalid range" });
    }

    // === FIXED: Consistent filtering with detailed endpoint ===
    const earningsResult = await Billing.aggregate([
      {
        $match: {
          rootAdmin: rootAdminId,
          billDate: { $gte: startDate, $lte: endDate },
          status: { $in: ["paid", "partial"] },
        },
      },
      {
        $lookup: {
          from: "members",
          localField: "member",
          foreignField: "_id",
          as: "memberInfo",
        },
      },
      { $unwind: "$memberInfo" },
      {
        $match: {
          "memberInfo.status": { $ne: "delete" },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$paidAmount" },
        },
      },
    ]);

    const totalEarnings = earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;

    res.json({
      success: true,
      range,
      totalEarnings,
      formatted: `₹${totalEarnings.toLocaleString("en-IN")}`,
    });
  } catch (err) {
    console.error("Get Earning Summary Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};