const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

const COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#2d4a22', '#4a2200', '#1a3a4a'];

// Generate quote via Anthropic API
router.post('/generate', protect, async (req, res) => {
  try {
    const { theme, mood, style, language = 'zh' } = req.body;

    const prompt = `請生成一句原創的語錄/名言。
主題：${theme || '人生、成長、智慧'}
風格：${style || '哲理、啟發'}
情緒：${mood || '正向、激勵'}
語言：${language === 'zh' ? '中文（繁體）' : '英文'}

要求：
1. 語錄要有深度和原創性，不要使用已知名言
2. 長度適中（20-80個中文字或10-40個英文單字）
3. 要有詩意或哲理感
4. 回傳 JSON 格式：
{
  "content": "語錄內容",
  "author": "作者（可以是"AI生成"或創意筆名）",
  "tags": ["標籤1", "標籤2", "標籤3"]
}

只回傳 JSON，不要其他文字。`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Auto-save to DB as approved (AI-generated)
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const quote = await Quote.create({
      content: generated.content,
      author: generated.author || 'AI 生成',
      tags: generated.tags || [],
      source: 'ai',
      submittedBy: req.user._id,
      submittedByName: req.user.username,
      bgColor: color,
      status: 'approved'
    });

    res.json({ quote, message: 'AI 語錄已生成並加入語錄庫' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤', error: err.message });
  }
});

module.exports = router;
