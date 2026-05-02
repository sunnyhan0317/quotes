const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

// 取得個人資料（我的投稿、收藏、按讚）
router.get('/profile', protect, async (req, res) => {
  try {
    const [myQuotes, savedQuotes, likedQuotes] = await Promise.all([
      Quote.find({ submittedBy: req.user._id }).sort({ createdAt: -1 }),
      Quote.find({ saves: req.user._id, status: 'approved' }).sort({ createdAt: -1 }),
      Quote.find({ likes: req.user._id, status: 'approved' }).sort({ createdAt: -1 }),
    ]);
    res.json({ myQuotes, savedQuotes, likedQuotes });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 更新個人資料
router.patch('/profile', protect, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updates = {};
    if (username) {
      const t = username.trim();
      if (t.length < 2) return res.status(400).json({ message: '用戶名至少需要 2 個字元' });
      const exists = await User.findOne({ username: t, _id: { $ne: req.user._id } });
      if (exists) return res.status(400).json({ message: '此用戶名已被使用' });
      updates.username = t;
    }
    if (email) {
      const t = email.trim().toLowerCase();
      const exists = await User.findOne({ email: t, _id: { $ne: req.user._id } });
      if (exists) return res.status(400).json({ message: '此電子郵件已被使用' });
      updates.email = t;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user, message: '個人資料已更新' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 修改密碼
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: '新密碼至少需要 6 個字元' });
    const user = await User.findById(req.user._id);
    if (!user.password) return res.status(400).json({ message: 'Google 帳號無法設定密碼' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: '目前密碼不正確' });
    user.password = newPassword;
    await user.save();
    res.json({ message: '密碼已更新' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 更新頭像 emoji ← 這個必須在 module.exports 之前
router.patch('/avatar', protect, async (req, res) => {
  try {
    const { avatarEmoji } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, { avatarEmoji }, { new: true }
    ).select('-password');
    res.json({ user, message: '頭像已更新' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 撤回自己的投稿
router.delete('/quotes/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findOne({ _id: req.params.id, submittedBy: req.user._id });
    if (!quote) return res.status(404).json({ message: '找不到語錄或無權限' });
    if (quote.status === 'approved')
      return res.status(403).json({ message: '已通過審核的語錄無法自行刪除，請聯絡管理員' });
    await quote.deleteOne();
    res.json({ message: '已撤回' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

module.exports = router; // ← 必須在所有路由之後
