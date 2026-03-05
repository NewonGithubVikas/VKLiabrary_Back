const express = require('express');
const auth = require('../middlewares/auth');
const { getEarningSummary } = require('../controllers/earningController');

const router = express.Router();

// Earning Summary Route
router.get('/summary', auth, getEarningSummary);

module.exports = router;