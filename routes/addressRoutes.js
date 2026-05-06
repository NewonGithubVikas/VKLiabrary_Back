// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController');
const auth = require('../middlewares/auth');// Your JWT middleware

router.use(auth); // Protect all routes

router.route('/',)
  .get(getAddresses)
  .post(addAddress);

router.route('/:id')
  .put(updateAddress)
  .delete(deleteAddress);
  

module.exports = router;