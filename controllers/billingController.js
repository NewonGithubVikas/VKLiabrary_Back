const Billing = require('../models/Billing');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Joi = require('joi');
const { isValidObjectId } = require('mongoose');

// Helper to determine root admin
const getRootAdminId = (user) => {
  return user.role === 'admin' ? user._id : user.adminId;
};

const billingSchema = Joi.object({
  member: Joi.string().required(),
  plan: Joi.string().required(),
  startDate: Joi.date().required(),
  paymentMethod: Joi.string().valid('cash', 'upi', 'card', 'bank'),
  paidAmount: Joi.number().min(0).default(0),
  discountType: Joi.string().valid('percentage', 'flat').allow(null),
  discountValue: Joi.number().min(0).default(0),
  taxApplicable: Joi.boolean().default(false),
  taxAmount: Joi.number().min(0).default(0),
  remarks: Joi.string().allow(''),
});

exports.createBilling = async (req, res) => {
  console.log("billing controller hit success");
  const { error } = billingSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const rootAdminId = getRootAdminId(user);

    const { 
      member, plan, startDate, paidAmount = 0, 
      discountType, discountValue = 0, 
      taxApplicable = false, taxAmount = 0, remarks,
      paymentMethod 
    } = req.body;

    // Validate member & plan exist + belong to this rootAdmin
    const memberDoc = await Member.findOne({ 
      _id: member, 
      rootAdmin: rootAdminId 
    });
    if (!memberDoc) return res.status(404).json({ message: 'Member not found or unauthorized' });

    const planDoc = await Plan.findOne({ 
      _id: plan, 
      rootAdmin: rootAdminId 
    });
    if (!planDoc) return res.status(404).json({ message: 'Plan not found or unauthorized' });
    if (!planDoc.enabled) return res.status(400).json({ message: 'This plan is currently disabled' });

    // Calculate endDate
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + planDoc.duration);

    // Calculate totals
    const baseAmount = planDoc.amount;
    const enrollment = planDoc.enrollmentFee || 0;
    const totalBeforeDiscount = baseAmount + enrollment;

    let discount = 0;
    if (discountType === 'percentage') {
      discount = (totalBeforeDiscount * discountValue) / 100;
    } else if (discountType === 'flat') {
      discount = discountValue;
    }

    const finalTax = taxApplicable ? (taxAmount || 0) : 0;
    const totalPayable = totalBeforeDiscount - discount + finalTax;
    const due = totalPayable - paidAmount;

    const billing = new Billing({
      member,
      plan,
      startDate,
      endDate: end,
      paymentMethod: paymentMethod || 'cash',
      paidAmount: Number(paidAmount),
      discountType,
      discountValue,
      taxApplicable,
      taxAmount: finalTax,
      dueAmount: due,
      remarks,
      status: due > 0 ? (paidAmount > 0 ? 'partial' : 'pending') : 'paid',

      // ── IMPORTANT: Ownership fields ──
      createdBy: user._id,
      rootAdmin: rootAdminId,
    });

    await billing.save();

    // Update member fields
    const updatedMember = await Member.findByIdAndUpdate(
      member,
      {
        status: 'active',
        currentPlan: plan,
        planStartDate: startDate,
        planExpiryDate: end,
        membershipStatus: 'active',
        lastPaidAmount: Number(paidAmount),
        lastDueAmount: due,
        lastPlanAmount: baseAmount,
        lastEnrollmentFee: enrollment,
      },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(500).json({ message: 'Failed to update member status' });
    }

    res.status(201).json({
      success: true,
      data: await billing.populate('member plan'),
      member: updatedMember,
    });
  } catch (err) {
    console.error('Create Billing Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getBillings = async (req, res) => {
  try {
    const user = req.user;
    const rootAdminId = getRootAdminId(user);

    const { member, plan } = req.query;

    const filter = { rootAdmin: rootAdminId };
    if (member) filter.member = member;
    if (plan) filter.plan = plan;

    const billings = await Billing.find(filter)
      .populate('member', 'name mobile memberId')
      .populate('plan', 'name amount duration')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: billings.length,
      data: billings,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBillingById = async (req, res) => {
  try {
    const user = req.user;
    const rootAdminId = getRootAdminId(user);

    const billing = await Billing.findOne({ 
      _id: req.params.id,
      rootAdmin: rootAdminId 
    })
      .populate('member', 'name mobile memberId')
      .populate('plan', 'name amount duration');

    if (!billing) return res.status(404).json({ message: 'Billing record not found or unauthorized' });

    res.json({ success: true, data: billing });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMemberBillHistory = async (req, res) => {
  try {
    const user = req.user;
    const rootAdminId = getRootAdminId(user);

    const { memberId } = req.params;

    const history = await Billing.find({ 
      member: memberId,
      rootAdmin: rootAdminId 
    })
      .populate('plan', 'name amount duration')
      .sort({ createdAt: -1 });

      console.log(history);
    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
exports.totalDue = async (req, res) => {
  try {
    const user = req.user;
    const rootAdminId = getRootAdminId(user);

    
    const billing = await Billing.findOne({
      _id: req.params.id,
      rootAdmin: rootAdminId
    }).select('dueAmount');

    if (!billing) {
      return res.status(404).json({ message: 'Billing not found' });
    }

    return res.json({
      success: true,
      dueAmount: billing.dueAmount,
    });

  } catch (error) {
    console.error('Total Due Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// ──────────────────────────────────────────────
// REPAY MEMBER DUE AMOUNT
// ──────────────────────────────────────────────
exports.repayDueAmount = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const rootAdminId = getRootAdminId(user);
    const { id: billingId } = req.params; // billing record ID
    const { amount, paymentMethod, remarks } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount required' });
    }
    if (!['cash', 'upi', 'card', 'bank'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Find the billing record
    const billing = await Billing.findOne({
      _id: billingId,
      rootAdmin: rootAdminId,
    });

    if (!billing) {
      return res.status(404).json({ message: 'Billing record not found' });
    }

    if (billing.dueAmount <= 0) {
      return res.status(400).json({ message: 'No due amount to repay' });
    }

    if (amount > billing.dueAmount) {
      return res.status(400).json({ message: 'Payment amount cannot exceed due amount' });
    }

    // Update billing record
    billing.paidAmount += Number(amount);
    billing.dueAmount -= Number(amount);

    // Update status
    if (billing.dueAmount <= 0) {
      billing.status = 'paid';
    } else {
      billing.status = 'partial';
    }

    billing.remarks = remarks ? `${billing.remarks ? billing.remarks + ' | ' : ''}${remarks}` : billing.remarks;
    billing.paymentMethod = paymentMethod; // last payment method

    await billing.save();

    // Update member lastDueAmount
    await Member.findByIdAndUpdate(
      billing.member,
      { $set: { lastDueAmount: billing.dueAmount } },
      { new: true }
    );

    res.json({
      success: true,
      message: `₹${amount} repaid successfully. Remaining due: ₹${billing.dueAmount}`,
      billing,
    });
  } catch (err) {
    console.error('Repay Due Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ──────────────────────────────────────────────
// UPDATE / EDIT BILLING (Invoice)
// ──────────────────────────────────────────────
exports.  updateBilling = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const rootAdminId = getRootAdminId(user);
    const { id: billingId } = req.params;

    const {
      billDate,
      startDate,
      endDate,
      plan,           // plan ID (optional)
      amount,         // manual override amount
      discountType,
      discountValue,
      paidAmount,
      taxApplicable,
      taxAmount,
      remarks,
      paymentMethod
    } = req.body;

    // Find billing
    const billing = await Billing.findOne({
      _id: billingId,
      rootAdmin: rootAdminId,
    });

    if (!billing) {
      return res.status(404).json({ message: 'Billing record not found or unauthorized' });
    }

    // Check if plan is expired
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const planEndDate = new Date(billing.endDate);
    if (planEndDate < today) {
      return res.status(400).json({
        message: 'Cannot edit this invoice. The plan has already expired.'
      });
    }

    // Optional: Re-validate and fetch plan if plan ID is changed
    let planDoc = null;
    if (plan) {
      planDoc = await Plan.findOne({ _id: plan, rootAdmin: rootAdminId });
      if (!planDoc) return res.status(404).json({ message: 'Plan not found' });
    }

    // Update fields
    if (billDate) billing.billDate = billDate;
    if (startDate) billing.startDate = startDate;
    if (endDate) billing.endDate = endDate;
    if (plan) billing.plan = plan;
    if (paymentMethod) billing.paymentMethod = paymentMethod;

    // Recalculate totals
    const baseAmount = amount !== undefined ? Number(amount) : (planDoc ? planDoc.amount : billing.plan?.amount || 0);
    const enrollment = planDoc ? (planDoc.enrollmentFee || 0) : 0;

    const totalBeforeDiscount = baseAmount + enrollment;

    let discount = 0;
    if (discountType && discountValue) {
      if (discountType === 'percentage') {
        discount = (totalBeforeDiscount * Number(discountValue)) / 100;
      } else if (discountType === 'flat') {
        discount = Number(discountValue);
      }
    }

    const finalTax = taxApplicable ? Number(taxAmount || 0) : 0;
    const totalPayable = totalBeforeDiscount - discount + finalTax;

    const newPaidAmount = paidAmount !== undefined ? Number(paidAmount) : billing.paidAmount;
    const newDueAmount = totalPayable - newPaidAmount;

    // Update billing fields
    billing.paidAmount = newPaidAmount;
    billing.dueAmount = Math.max(0, newDueAmount);
    billing.discountType = discountType;
    billing.discountValue = discountValue || 0;
    billing.taxApplicable = taxApplicable !== undefined ? taxApplicable : billing.taxApplicable;
    billing.taxAmount = finalTax;
    billing.remarks = remarks !== undefined ? remarks : billing.remarks;

    // Update status
    if (billing.dueAmount <= 0) {
      billing.status = 'paid';
    } else if (billing.paidAmount > 0) {
      billing.status = 'partial';
    } else {
      billing.status = 'pending';
    }

    await billing.save();

    // Optionally update member info if this is the current plan
    if (billing.member) {
      await Member.findByIdAndUpdate(
        billing.member,
        {
          planStartDate: billing.startDate,
          planExpiryDate: billing.endDate,
          lastPaidAmount: billing.paidAmount,
          lastDueAmount: billing.dueAmount,
          lastPlanAmount: baseAmount,
        },
        { new: true }
      );
    }

    const updatedBilling = await Billing.findById(billingId)
      .populate('member', 'name mobile')
      .populate('plan', 'name amount duration');

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedBilling,
    });

  } catch (err) {
    console.error('Update Billing Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};