const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Get all pending quotes
router.get('/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [quotes, total] = await Promise.all([
      Quote.find({ status: 'pending' }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('submittedBy', 'username email avatar'),
      Quote.countDocuments({ status: 'pending' })
    ]);
    res.json({ quotes, total });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get all quotes (any status)
router.get('/all', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [quotes, total] = await Promise.all([
      Quote.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('submittedBy', 'username email avatar'),
      Quote.countDocuments(query)
    ]);
    res.json({ quotes, total });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Approve a quote
router.patch('/:id/approve', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', updatedAt: Date.now() },
      { new: true }
    );
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    res.json({ quote, message: '語錄已通過審核' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Reject a quote
router.patch('/:id/reject', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', updatedAt: Date.now() },
      { new: true }
    );
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    res.json({ quote, message: '語錄已拒絕' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Delete a quote permanently
router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    res.json({ message: '語錄已永久刪除' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get stats
router.get('/stats', async (req, res) => {
  try {
    const [total, pending, approved, rejected, users] = await Promise.all([
      Quote.countDocuments(),
      Quote.countDocuments({ status: 'pending' }),
      Quote.countDocuments({ status: 'approved' }),
      Quote.countDocuments({ status: 'rejected' }),
      User.countDocuments()
    ]);
    res.json({ total, pending, approved, rejected, users });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Change user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: '無效的角色' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
