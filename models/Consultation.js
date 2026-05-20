const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const authMiddleware = require('../middleware/auth');

// @route  POST /api/consultations
// @desc   Book a new consultation
// @access Private
router.post('/', authMiddleware, async (req, res) => {
  const { name, phone, email, message } = req.body;

  try {
    const consultation = new Consultation({
      user: req.user.id,
      name,
      phone,
      email,
      message,
    });

    await consultation.save();
    res.status(201).json({ message: 'Consultation booked successfully', consultation });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/consultations
// @desc   Get all consultations for logged in user
// @access Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const consultations = await Consultation.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/consultations/all
// @desc   Get all consultations (admin only)
// @access Private/Admin
router.get('/all', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const consultations = await Consultation.find().populate('user', 'name email phone').sort({ createdAt: -1 });
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  PUT /api/consultations/:id
// @desc   Update consultation status
// @access Private/Admin
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    res.json(consultation);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/consultations/:id
// @desc   Delete a consultation
// @access Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Consultation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Consultation deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;