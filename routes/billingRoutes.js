// routes/billingRoutes.js
const express = require('express');
const auth = require('../middlewares/auth');
const {
  createBilling,
  getBillings,
  getBillingById,
  getMemberBillHistory,
  totalDue,
  repayDueAmount, // ← NEW
} = require('../controllers/billingController');

const router = express.Router();

router.use(auth);

router.post('/', createBilling);
router.get('/', getBillings);
router.get('/:id', getBillingById);
router.get('/member/:memberId', getMemberBillHistory);
router.get('/due', totalDue);

// NEW repayment route
router.put('/:id/repay', repayDueAmount);

module.exports = router;