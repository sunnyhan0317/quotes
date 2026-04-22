const mongoose = require('mongoose');

// 本日心情日記
const moodDiarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  mood: { type: String, enum: ['😄', '😊', '😐', '😔', '😢', '😡', '😴', '🤔', '✨', '💪'], required: true },
  moodScore: { type: Number, min: 1, max: 5 },
  content: { type: String, maxlength: 2000 },
  tags: [{ type: String }],
  weather: { type: String, enum: ['☀️', '⛅', '🌧️', '⛈️', '❄️', '🌫️', ''], default: '' },
  isPrivate: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
moodDiarySchema.index({ user: 1, date: -1 });

// 寫給未來的信
const futureDiarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 5000 },
  openDate: { type: Date, required: true }, // 預計開封日期
  opened: { type: Boolean, default: false },
  openedAt: { type: Date },
  mood: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
futureDiarySchema.index({ user: 1, openDate: 1 });

const MoodDiary = mongoose.model('MoodDiary', moodDiarySchema);
const FutureDiary = mongoose.model('FutureDiary', futureDiarySchema);

module.exports = { MoodDiary, FutureDiary };
