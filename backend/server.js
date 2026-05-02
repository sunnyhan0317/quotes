require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes  = require('./routes/auth');
const quoteRoutes = require('./routes/quotes');
const adminRoutes = require('./routes/admin');
const aiRoutes    = require('./routes/ai');
const userRoutes  = require('./routes/user');
const diaryRoutes = require('./routes/diary');

const app = express();

//add
app.use(express.static("./frontend/dist"));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.use('/api/auth',   authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/ai',     aiRoutes);
app.use('/api/user',   userRoutes);
app.use('/api/diary',  diaryRoutes);


//add
const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected to quotes database'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
