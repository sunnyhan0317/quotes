import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

const CARD_BG = '#0f1f3d';
const CARD_BG_HOVER = '#122347';

export default function QuoteCard({ quote: initial, onAuthRequired, onTagClick }) {
  const [quote, setQuote] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { user, API } = useAuth();
  const { addToast } = useToast();

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
          : (prev.likes || []).filter(id => id !== user.id),
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
          : (prev.saves || []).filter(id => id !== user.id),
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
    <div
      style={{
        backgroundColor: hovered ? CARD_BG_HOVER : CARD_BG,
        borderRadius: '6px',
        padding: '1.8rem 1.6rem 1.4rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.35)',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 裝飾引號 */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '6rem', lineHeight: 1,
        color: 'rgba(255,255,255,0.04)',
        position: 'absolute', top: 0, right: '1rem',
        pointerEvents: 'none', userSelect: 'none',
      }}>"</div>

      {/* 來源標籤 */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.55rem', letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(200,169,110,0.45)',
        marginBottom: '1rem',
      }}>
        {quote.source === 'ai' ? '✦ AI 生成' : '用戶投稿'}
      </div>

      {/* 語錄內容 */}
      <div style={{
        fontFamily: "'Noto Serif TC', serif",
        fontSize: '0.97rem', lineHeight: 2,
        color: 'rgba(232,228,220,0.92)',
        flex: 1, marginBottom: '1.2rem',
        position: 'relative', zIndex: 1,
      }}>
        {quote.content}
      </div>

      {/* 作者 */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.62rem', letterSpacing: '0.1em',
        color: 'rgba(200,169,110,0.65)',
        marginBottom: '0.9rem',
      }}>
        — {quote.author}
      </div>

      {/* 標籤 */}
      {quote.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
          {quote.tags.map(tag => (
            <span key={tag} className="tag dark"
              onClick={e => { e.stopPropagation(); onTagClick?.(tag); }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 動作列 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.2rem',
        paddingTop: '0.9rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        marginTop: 'auto',
      }}>
        <button className={`quote-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
          <HeartIcon filled={isLiked} />{quote.likes?.length || 0}
        </button>
        <button className={`quote-action-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
          <BookmarkIcon filled={isSaved} />{quote.saves?.length || 0}
        </button>
        <button className="quote-action-btn"
          onClick={e => { e.stopPropagation(); setShowComments(s => !s); }}>
          <ChatIcon />{quote.comments?.length || 0}
        </button>
        {quote.submittedBy?.username && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.55rem', letterSpacing: '0.05em',
            color: 'rgba(232,228,220,0.2)',
          }}>
            {quote.submittedBy.username}
          </span>
        )}
      </div>

      {/* 留言區 */}
      {showComments && (
        <div style={{ marginTop: '0.9rem' }} onClick={e => e.stopPropagation()}>
          {quote.comments?.length === 0 && (
            <div style={{ padding: '0.6rem 0', color: 'rgba(232,228,220,0.28)', fontSize: '0.68rem', fontFamily: "'Space Mono', monospace" }}>
              還沒有留言
            </div>
          )}
          {quote.comments?.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.6rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.58rem', fontFamily: "'Space Mono', monospace",
                color: 'rgba(232,228,220,0.5)', flexShrink: 0, overflow: 'hidden',
              }}>
                {c.avatar ? <img src={c.avatar} alt={c.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'rgba(232,228,220,0.28)', marginBottom: '0.15rem' }}>{c.username}</div>
                <div style={{ color: 'rgba(232,228,220,0.65)', fontSize: '0.78rem', lineHeight: 1.6 }}>{c.text}</div>
              </div>
            </div>
          ))}
          {user ? (
            <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
              <input className="form-input" style={{
                flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.78rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)',
              }} placeholder="留下你的想法..." value={commentText}
                onChange={e => setCommentText(e.target.value)} />
              <button className="submit-btn" style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.6rem' }}
                type="submit" disabled={submittingComment}>送出</button>
            </form>
          ) : (
            <button className="quote-action-btn" style={{ marginTop: '0.5rem' }} onClick={onAuthRequired}>登入後留言</button>
          )}
        </div>
      )}
    </div>
  );
}
