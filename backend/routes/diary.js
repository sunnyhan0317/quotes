const express = require('express');
const router = express.Router();
const { MoodDiary, FutureDiary } = require('../models/Diary');
const { protect } = require('../middleware/auth');

router.use(protect);

/* ── 心情日記 ── */

// 取得單一日期日記（必須在 /mood 前面，否則 :date 會被 GET /mood 攔截）
router.get('/mood/date/:date', async (req, res) => {
  try {
    const diary = await MoodDiary.findOne({ user: req.user._id, date: req.params.date });
    res.json(diary || null);
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 取得全部心情日記
router.get('/mood', async (req, res) => {
  try {
    const query = { user: req.user._id };
    const { year, month } = req.query;
    if (year && month) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const nextMonth = month == 12
        ? `${+year + 1}-01-01`
        : `${year}-${String(+month + 1).padStart(2, '0')}-01`;
      query.date = { $gte: start, $lt: nextMonth };
    }
    const diaries = await MoodDiary.find(query).sort({ date: -1 }).limit(90);
    res.json(diaries);
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 新增或更新心情日記（每天一則，upsert）
router.post('/mood', async (req, res) => {
  try {
    const { date, mood, moodScore, content, tags, weather } = req.body;
    if (!date || !mood) return res.status(400).json({ message: '日期和心情不能為空' });

    const diary = await MoodDiary.findOneAndUpdate(
      { user: req.user._id, date },
      {
        $set: {
          mood, moodScore, weather,
          content: content || '',
          tags: Array.isArray(tags) ? tags : [],
          updatedAt: new Date(),
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ diary, message: '日記已儲存' });
  } catch (err) {
    console.error('diary post error:', err);
    res.status(500).json({ message: '伺服器錯誤', detail: err.message });
  }
});

// 刪除心情日記
router.delete('/mood/:id', async (req, res) => {
  try {
    await MoodDiary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: '已刪除' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

/* ── 未來的信 ── */

// 取得全部未來的信，同時自動標記到期
router.get('/future', async (req, res) => {
  try {
    const letters = await FutureDiary.find({ user: req.user._id }).sort({ openDate: 1 });
    const now = new Date();
    const updates = [];
    for (const l of letters) {
      if (!l.opened && new Date(l.openDate) <= now) {
        l.opened = true;
        l.openedAt = now;
        updates.push(l.save());
      }
    }
    if (updates.length) await Promise.all(updates);
    res.json(letters);
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 新增未來的信
router.post('/future', async (req, res) => {
  try {
    const { title, content, openDate, mood } = req.body;
    if (!title || !content || !openDate)
      return res.status(400).json({ message: '標題、內容和開封日期不能為空' });
    if (new Date(openDate) <= new Date())
      return res.status(400).json({ message: '開封日期必須是未來的日期' });

    const letter = await FutureDiary.create({
      user: req.user._id, title, content,
      openDate: new Date(openDate), mood: mood || '',
    });
    res.status(201).json({ letter, message: '信件已封存，等待時間到來' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

// 刪除未來的信
router.delete('/future/:id', async (req, res) => {
  try {
    await FutureDiary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: '已刪除' });
  } catch (err) { res.status(500).json({ message: '伺服器錯誤' }); }
});

module.exports = router;
