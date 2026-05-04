require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes      = require('./routes/auth');
const quoteRoutes     = require('./routes/quotes');
const adminRoutes     = require('./routes/admin');
const aiRoutes        = require('./routes/ai');
const userRoutes      = require('./routes/user');
const diaryRoutes     = require('./routes/diary');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// CORS — 本機開發用，部署後前後端同源不需要 CORS 但保留不影響
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// API 路由（必須在靜態檔案之前）
app.use('/api/auth',      authRoutes);
app.use('/api/quotes',    quoteRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/diary',     diaryRoutes);
app.use('/api/analytics', analyticsRoutes);

// 提供前端靜態檔案
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// 所有非 API 路由都回傳 index.html（讓 React Router 處理）
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// 連接 MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected to quotes database'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
