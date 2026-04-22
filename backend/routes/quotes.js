const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

const CARD_COLOR = '#0f1f3d';

router.get('/', async (req, res) => {
  try {
    const { tag, search, page = 1, limit = 12, sort = 'new' } = req.query;
    const query = { status: 'approved' };
    if (tag) query.tags = tag;
    if (search) query.$or = [
      { content: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
    const sortOption = sort === 'popular' ? { 'likes': -1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;
    const [quotes, total] = await Promise.all([
      Quote.find(query).sort(sortOption).skip(skip).limit(parseInt(limit))
        .populate('submittedBy', 'username avatar avatarEmoji'),
      Quote.countDocuments(query)
    ]);
    res.json({ quotes, total, pages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.get('/tags', async (req, res) => {
  try {
    const tags = await Quote.aggregate([
      { $match: { status: 'approved' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 20 }
    ]);
    res.json(tags);
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { content, author, tags } = req.body;
    if (!content) return res.status(400).json({ message: '語錄內容不能為空' });
    const quote = await Quote.create({
      content, author: author || req.user.username,
      tags: tags || [], submittedBy: req.user._id,
      submittedByName: req.user.username, bgColor: CARD_COLOR, status: 'pending'
    });
    res.status(201).json({ quote, message: '語錄已提交，等待審核' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    const idx = quote.likes.indexOf(req.user._id);
    if (idx > -1) quote.likes.splice(idx, 1);
    else quote.likes.push(req.user._id);
    await quote.save();
    res.json({ likes: quote.likes.length, liked: idx === -1 });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.post('/:id/save', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    const User = require('../models/User');
    const idx = quote.saves.indexOf(req.user._id);
    if (idx > -1) {
      quote.saves.splice(idx, 1);
      await User.findByIdAndUpdate(req.user._id, { $pull: { savedQuotes: quote._id } });
    } else {
      quote.saves.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedQuotes: quote._id } });
    }
    await quote.save();
    res.json({ saves: quote.saves.length, saved: idx === -1 });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 一般留言
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: '留言不能為空' });
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    quote.comments.push({
      user: req.user._id, username: req.user.username,
      avatar: req.user.avatar, avatarEmoji: req.user.avatarEmoji, text
    });
    await quote.save();
    res.json({ comments: quote.comments });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.patch('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: '留言不能為空' });
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    const comment = quote.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: '留言不存在' });
    if (String(comment.user) !== String(req.user._id)) return res.status(403).json({ message: '無權限' });
    comment.text = text;
    comment.edited = true;
    await quote.save();
    res.json({ comments: quote.comments });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    const comment = quote.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: '留言不存在' });
    if (String(comment.user) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: '無權限' });
    comment.deleteOne();
    await quote.save();
    res.json({ comments: quote.comments });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 辯論留言
router.post('/:id/debate', protect, async (req, res) => {
  try {
    const { text, side } = req.body;
    if (!text || !['for', 'against'].includes(side)) return res.status(400).json({ message: '請填寫內容和立場' });
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    quote.debateComments.push({
      user: req.user._id, username: req.user.username,
      avatar: req.user.avatar, avatarEmoji: req.user.avatarEmoji, side, text
    });
    await quote.save();
    res.json({ debateComments: quote.debateComments });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.post('/:id/debate/:debateId/like', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    const dc = quote.debateComments.id(req.params.debateId);
    if (!dc) return res.status(404).json({ message: '留言不存在' });
    const idx = dc.likes.indexOf(req.user._id);
    if (idx > -1) dc.likes.splice(idx, 1);
    else dc.likes.push(req.user._id);
    await quote.save();
    res.json({ debateComments: quote.debateComments });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.delete('/:id/debate/:debateId', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    const dc = quote.debateComments.id(req.params.debateId);
    if (!dc) return res.status(404).json({ message: '留言不存在' });
    if (String(dc.user) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: '無權限' });
    dc.deleteOne();
    await quote.save();
    res.json({ debateComments: quote.debateComments });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('submittedBy', 'username avatar avatarEmoji');
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    res.json(quote);
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    if (String(quote.submittedBy) !== String(req.user._id))
      return res.status(403).json({ message: '只有發布者可以編輯' });
    const { content, author, tags } = req.body;
    if (content) quote.content = content;
    if (author !== undefined) quote.author = author;
    if (tags !== undefined) quote.tags = tags;
    if (quote.status === 'approved') quote.status = 'pending';
    quote.updatedAt = Date.now();
    await quote.save();
    res.json({ quote, message: quote.status === 'pending' ? '已更新，重新進入審核' : '已更新' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

module.exports = router;
