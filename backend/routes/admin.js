const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// 取得所有語錄
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [quotes, total] = await Promise.all([
      Quote.find({}).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('submittedBy', 'username email avatar avatarEmoji'),
      Quote.countDocuments()
    ]);
    res.json({ quotes, total });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 永久刪除語錄
router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    res.json({ message: '語錄已永久刪除' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 統計
router.get('/stats', async (req, res) => {
  try {
    const [total, users] = await Promise.all([
      Quote.countDocuments(),
      User.countDocuments()
    ]);
    res.json({ total, users });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 取得所有用戶
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 更改用戶角色
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: '無效的角色' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

module.exports = router;
