const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  avatarEmoji: { type: String },
  text: { type: String, required: true, maxlength: 500 },
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// 辯論留言：支持正方/反方立場
const debateCommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  avatarEmoji: { type: String },
  side: { type: String, enum: ['for', 'against'], required: true },
  text: { type: String, required: true, maxlength: 500 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const quoteSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 1000 },
  author: { type: String, default: '匿名' },
  tags: [{ type: String, trim: true, lowercase: true }],
  source: { type: String, enum: ['user', 'ai'], default: 'user' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  debateComments: [debateCommentSchema],
  bgColor: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

quoteSchema.index({ tags: 1, status: 1 });
quoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quote', quoteSchema);
