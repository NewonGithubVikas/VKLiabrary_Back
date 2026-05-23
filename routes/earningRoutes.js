const express = require('express');
const auth = require('../middlewares/auth');
const { getEarningSummary,getEarnDetailsRecord} = require('../controllers/earningController');

const router = express.Router();

// Earning Summary Route
router.get('/summary', auth, getEarningSummary);
router.get('/details', auth, getEarnDetailsRecord);
module.exports = router;