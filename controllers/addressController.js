// controllers/addressController.js
const Address = require('../models/Address');
const User = require('../models/User');
// Helper to determine root admin
const getRootAdminId = (user) => {
  return user.role === 'admin' ? user._id : user.adminId; // Adjust if your field name is different
};

// Get Address (Only one per rootAdmin)
exports.getAddresses = async (req, res) => {
  try {
    const rootAdminId = getRootAdminId(req.user);

    const address = await Address.findOne({ 
      rootAdmin: rootAdminId 
    });

    let email = null;
    console.log("id",rootAdminId);
    if (address) {
      const user = await User.findById(rootAdminId).select('email');
      email = user?.email || null;
    }
console.log("email data",email);
    res.status(200).json({
      success: true,
      data: address || null,
      email: email,
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
// Add New Address
exports.addAddress = async (req, res) => {
  try {
    const rootAdminId = getRootAdminId(req.user);

    // Check if address already exists for this rootAdmin
    const existingAddress = await Address.findOne({ rootAdmin: rootAdminId });
    if (existingAddress) {
      return res.status(400).json({
        success: false,
        message: "Only one address is allowed per Root Admin",
      });
    }

    const addressData = {
      ...req.body,
      createdBy: req.user.id,
      rootAdmin: rootAdminId,
    };

    const address = await Address.create(addressData);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update Address
exports.updateAddress = async (req, res) => {
  try {
    const rootAdminId = getRootAdminId(req.user);

    let address = await Address.findOne({
      rootAdmin: rootAdminId,
    });

    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    // Prevent changing ownership fields
    const { createdBy, rootAdmin, ...updateData } = req.body;

    address = await Address.findByIdAndUpdate(
      address._id, 
      updateData, 
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
  try {
    const rootAdminId = getRootAdminId(req.user);

    const address = await Address.findOne({
      rootAdmin: rootAdminId,
    });

    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    await address.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};