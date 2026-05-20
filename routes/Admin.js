const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const authMiddleware = require('../middleware/auth');

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

// @route  POST /api/admin/make-admin
// @desc   Promote a user to admin using secret key
// @access Public (protected by secret)
router.post('/make-admin', async (req, res) => {
  try {
    const { email, secret } = req.body;

    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid secret key' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: `${user.name} is now an admin`, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// @route  GET /api/admin/stats
// @desc   Get dashboard stats
// @access Private/Admin
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'mama' });
    const totalConsultations = await Consultation.countDocuments();
    const pending = await Consultation.countDocuments({ status: 'pending' });
    const confirmed = await Consultation.countDocuments({ status: 'confirmed' });
    const completed = await Consultation.countDocuments({ status: 'completed' });

    res.json({ totalUsers, totalConsultations, pending, confirmed, completed });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/admin/consultations
// @desc   Get all consultations with user info
// @access Private/Admin
router.get('/consultations', authMiddleware, isAdmin, async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  PUT /api/admin/consultations/:id
// @desc   Update consultation status
// @access Private/Admin
router.put('/consultations/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email phone');

    if (!consultation) return res.status(404).json({ message: 'Not found' });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/admin/users
// @desc   Get all users
// @access Private/Admin
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'mama' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/admin/consultations/:id
// @desc   Delete a consultation
// @access Private/Admin
router.delete('/consultations/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    await Consultation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;