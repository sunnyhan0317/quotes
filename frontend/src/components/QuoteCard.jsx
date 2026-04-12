import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// 深色背景卡片的顏色清單（與 backend 一致）
const CARD_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2d4a22', '#4a2200', '#1a3a4a', '#2a1a2e'
];

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function QuoteCard({ quote: initial, onAuthRequired, onTagClick }) {
  const [quote, setQuote] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user, API } = useAuth();
  const { addToast } = useToast();

  // 有 bgColor 就用深色卡，否則用預設深色表面
  const hasBg = !!quote.bgColor && quote.bgColor !== '';
  const bgStyle = hasBg
    ? { backgroundColor: quote.bgColor }
    : { backgroundColor: 'var(--surface)' };

  const isLiked = user && quote.likes?.includes(user.id);
  const isSaved = user && quote.saves?.includes(user.id);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { onAuthRequired(); return; }
    try {
      const r = await API.post(`/quotes/${quote._id}/like`);
      setQuote(prev => ({
        ...prev,
        likes: r.data.liked
          ? [...(prev.likes || []), user.id]
          : (prev.likes || []).filter(id => id !== user.id)
      }));
    } catch { addToast('操作失敗', 'error'); }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) { onAuthRequired(); return; }
    try {
      const r = await API.post(`/quotes/${quote._id}/save`);
      setQuote(prev => ({
        ...prev,
        saves: r.data.saved
          ? [...(prev.saves || []), user.id]
          : (prev.saves || []).filter(id => id !== user.id)
      }));
      addToast(r.data.saved ? '已收藏' : '已取消收藏', 'success');
    } catch { addToast('操作失敗', 'error'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const r = await API.post(`/quotes/${quote._id}/comment`, { text: commentText });
      setQuote(prev => ({ ...prev, comments: r.data.comments }));
      setCommentText('');
    } catch { addToast('留言失敗', 'error'); }
    finally { setSubmittingComment(false); }
  };

  return (
    <div className="quote-card" style={bgStyle}>

      {/* 裝飾引號 */}
      <div className="quote-deco">"</div>

      {/* 內容 */}
      <div className="quote-content">{quote.content}</div>

      {/* 作者 */}
      <div className="quote-author">— {quote.author}</div>

      {/* 標籤 */}
      {quote.tags?.length > 0 && (
        <div className="quote-tags">
          {quote.tags.map(tag => (
            <span
              key={tag}
              className="tag dark"
              onClick={e => { e.stopPropagation(); onTagClick?.(tag); }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 動作列 */}
      <div className="quote-actions">
        <button className={`quote-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
          <HeartIcon filled={isLiked} />
          {quote.likes?.length || 0}
        </button>
        <button className={`quote-action-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
          <BookmarkIcon filled={isSaved} />
          {quote.saves?.length || 0}
        </button>
        <button
          className="quote-action-btn"
          onClick={e => { e.stopPropagation(); setShowComments(s => !s); }}
        >
          <ChatIcon />
          {quote.comments?.length || 0}
        </button>

        {/* 來源小標 */}
        <span className="quote-source-badge" style={{ marginLeft: 'auto' }}>
          {quote.source === 'ai' ? '✦ AI' : '投稿'}
        </span>
      </div>

      {/* 留言區 */}
      {showComments && (
        <div className="comments-section" onClick={e => e.stopPropagation()}>
          {quote.comments?.length === 0 && (
            <div style={{
              padding: '0.7rem 0',
              color: 'rgba(232,228,220,0.35)',
              fontSize: '0.7rem',
              fontFamily: "'Space Mono', monospace"
            }}>
              還沒有留言
            </div>
          )}
          {quote.comments?.map((c, i) => (
            <div key={i} className="comment-item">
              <div className="comment-avatar">
                {c.avatar ? <img src={c.avatar} alt={c.username} /> : c.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="comment-meta">{c.username}</div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}
          {user ? (
            <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
              <input
                className="form-input"
                style={{
                  flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.78rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text)'
                }}
                placeholder="留下你的想法..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button
                className="submit-btn"
                style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.6rem' }}
                type="submit"
                disabled={submittingComment}
              >
                送出
              </button>
            </form>
          ) : (
            <button
              className="quote-action-btn"
              style={{ marginTop: '0.6rem' }}
              onClick={onAuthRequired}
            >
              登入後留言
            </button>
          )}
        </div>
      )}
    </div>
  );
}
