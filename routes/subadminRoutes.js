const express = require('express');
const auth = require('../middlewares/auth');
const { addSubadmin, getMySubadmins,deleteSubadmin, } = require('../controllers/subadminController');

const router = express.Router();

router.post('/', auth, addSubadmin);
router.get('/', auth, getMySubadmins);
// NEW: Delete route
router.delete('/:subadminId', auth, deleteSubadmin);

module.exports = router;