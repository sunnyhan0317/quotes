const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

const COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#2d4a22', '#4a2200', '#1a3a4a'];

// Get all approved quotes (public)
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
        .populate('submittedBy', 'username avatar'),
      Quote.countDocuments(query)
    ]);

    res.json({ quotes, total, pages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get popular tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await Quote.aggregate([
      { $match: { status: 'approved' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Submit a quote (requires auth)
router.post('/', protect, async (req, res) => {
  try {
    const { content, author, tags } = req.body;
    if (!content) return res.status(400).json({ message: '語錄內容不能為空' });

    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const quote = await Quote.create({
      content,
      author: author || req.user.username,
      tags: tags || [],
      submittedBy: req.user._id,
      submittedByName: req.user.username,
      bgColor: color,
      status: 'pending'
    });

    res.status(201).json({ quote, message: '語錄已提交，等待審核' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Like/Unlike a quote
router.post('/:id/like', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });

    const likedIndex = quote.likes.indexOf(req.user._id);
    if (likedIndex > -1) {
      quote.likes.splice(likedIndex, 1);
    } else {
      quote.likes.push(req.user._id);
    }
    await quote.save();
    res.json({ likes: quote.likes.length, liked: likedIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Save/Unsave a quote
router.post('/:id/save', protect, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });

    const User = require('../models/User');
    const savedIndex = quote.saves.indexOf(req.user._id);
    if (savedIndex > -1) {
      quote.saves.splice(savedIndex, 1);
      await User.findByIdAndUpdate(req.user._id, { $pull: { savedQuotes: quote._id } });
    } else {
      quote.saves.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedQuotes: quote._id } });
    }
    await quote.save();
    res.json({ saves: quote.saves.length, saved: savedIndex === -1 });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: '留言不能為空' });

    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: '語錄不存在' });

    quote.comments.push({
      user: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      text
    });
    await quote.save();
    res.json({ comments: quote.comments });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get single quote
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('submittedBy', 'username avatar');
    if (!quote) return res.status(404).json({ message: '語錄不存在' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
