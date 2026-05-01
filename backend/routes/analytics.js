const express = require('express');
const router = express.Router();
const { MoodDiary } = require('../models/Diary');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

/* ══════════════════════════════════════
   情緒地圖 — 公開統計（匿名）
══════════════════════════════════════ */
router.get('/mood-map', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    const sinceStr = since.toISOString().slice(0, 10);

    // 按日期+心情分組統計
    const raw = await MoodDiary.aggregate([
      { $match: { date: { $gte: sinceStr } } },
      { $group: { _id: { date: '$date', mood: '$mood' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } }
    ]);

    // 整理成 { date: { mood: count } }
    const byDate = {};
    raw.forEach(({ _id: { date, mood }, count }) => {
      if (!byDate[date]) byDate[date] = {};
      byDate[date][mood] = (byDate[date][mood] || 0) + count;
    });

    // 今日統計
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRaw = await MoodDiary.aggregate([
      { $match: { date: todayStr } },
      { $group: { _id: '$mood', count: { $sum: 1 } } }
    ]);
    const todayTotal = todayRaw.reduce((a, b) => a + b.count, 0);
    const todayMoods = {};
    todayRaw.forEach(({ _id, count }) => { todayMoods[_id] = count; });

    // 近 days 天總人數
    const totalUsers = await MoodDiary.distinct('user', { date: { $gte: sinceStr } });

    res.json({
      byDate,
      todayMoods,
      todayTotal,
      totalParticipants: totalUsers.length,
    });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

/* ══════════════════════════════════════
   語錄 DNA — 需要登入
══════════════════════════════════════ */
router.get('/dna', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 取得收藏 + 按讚的語錄
    const [saved, liked, myQuotes] = await Promise.all([
      Quote.find({ saves: userId, status: 'approved' }),
      Quote.find({ likes: userId, status: 'approved' }),
      Quote.find({ submittedBy: userId }),
    ]);

    const allEngaged = [...saved, ...liked];
    const uniqueMap = {};
    allEngaged.forEach(q => { uniqueMap[q._id] = q; });
    const unique = Object.values(uniqueMap);

    if (unique.length < 3) {
      return res.json({ insufficient: true, count: unique.length });
    }

    // 標籤頻率
    const tagFreq = {};
    unique.forEach(q => {
      (q.tags || []).forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; });
    });
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));

    // 作者偏好
    const authorFreq = {};
    unique.forEach(q => {
      if (q.author && q.author !== '匿名' && q.author !== 'AI 生成') {
        authorFreq[q.author] = (authorFreq[q.author] || 0) + 1;
      }
    });
    const topAuthors = Object.entries(authorFreq)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([author, count]) => ({ author, count }));

    // 來源偏好
    const aiCount = unique.filter(q => q.source === 'ai').length;
    const userCount = unique.filter(q => q.source === 'user').length;

    // 語錄長度偏好
    const avgLen = unique.reduce((a, q) => a + q.content.length, 0) / unique.length;
    const lengthPref = avgLen < 30 ? '精煉簡短' : avgLen < 60 ? '適中平衡' : '深邃悠長';

    // 活躍時段（根據 createdAt）
    // 分析互動的語錄，找用戶最常互動的標籤群組來定義性格
    const personalityMap = {
      '人生': '人生哲學家', '成長': '成長探索者', '愛情': '浪漫主義者',
      '孤獨': '深思者', '夢想': '理想追求者', '自由': '靈魂流浪者',
      '時間': '時間感知者', '死亡': '存在主義者', '勇氣': '勇者',
      '智慧': '智慧探索者', '自然': '自然崇拜者', '藝術': '藝術靈魂',
      '文學': '文字魔法師', '哲學': '哲學思考者', '療癒': '溫柔療癒者',
    };

    let personality = '獨特的語錄收藏家';
    for (const { tag } of topTags) {
      if (personalityMap[tag]) { personality = personalityMap[tag]; break; }
    }

    // 計算稀有度分數（收藏越多、偏好越特別越高）
    const rarityScore = Math.min(100, Math.floor(
      (unique.length * 3) +
      (topTags.length * 5) +
      (topAuthors.length * 8) +
      (aiCount > userCount ? 10 : 0)
    ));

    res.json({
      insufficient: false,
      stats: {
        totalEngaged: unique.length,
        savedCount: saved.length,
        likedCount: liked.length,
        myQuotesCount: myQuotes.length,
        approvedCount: myQuotes.filter(q => q.status === 'approved').length,
      },
      topTags,
      topAuthors,
      preferences: {
        aiVsUser: { ai: aiCount, user: userCount },
        lengthPref,
        avgLength: Math.round(avgLen),
      },
      personality,
      rarityScore,
    });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
