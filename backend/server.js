require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes      = require('./routes/auth');
const quoteRoutes     = require('./routes/quotes');
const adminRoutes     = require('./routes/admin');
const userRoutes      = require('./routes/user');
const diaryRoutes     = require('./routes/diary');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// API 路由
app.use('/api/auth',      authRoutes);
app.use('/api/quotes',    quoteRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/diary',     diaryRoutes);
app.use('/api/analytics', analyticsRoutes);

// 提供前端靜態檔案
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// 所有非 API 路由都回傳 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
