import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── Icons ── */
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
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

/* ── 編輯 Modal ── */
function EditModal({ quote, onClose, onSaved }) {
  const [form, setForm] = useState({
    content: quote.content,
    author: quote.author,
    tags: quote.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const { API } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) { addToast('語錄內容不能為空', 'error'); return; }
    setLoading(true);
    try {
      const tags = form.tags
        .split(/[,，\s]+/)
        .filter(Boolean)
        .map(t => t.toLowerCase().replace('#', ''));
      const r = await API.patch(`/quotes/${quote._id}`, {
        content: form.content.trim(),
        author: form.author.trim(),
        tags,
      });
      addToast(r.data.message, 'success');
      onSaved(r.data.quote);
      onClose();
    } catch (e) {
      addToast(e.response?.data?.message || '更新失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: '0.3rem' }}>編輯語錄</h2>
        <p style={{ marginBottom: '1.4rem' }}>
          {quote.status === 'approved'
            ? '修改後將重新進入審核，通過後才會再次公開顯示'
            : '修改後仍需等待管理員審核'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">語錄內容 *</label>
            <textarea
              className="form-textarea"
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              required
              rows={4}
            />
          </div>
          <div className="form-group">
            <label className="form-label">出處 / 作者</label>
            <input
              className="form-input"
              value={form.author}
              onChange={e => setForm({ ...form, author: e.target.value })}
              placeholder="書名、作者名"
            />
          </div>
          <div className="form-group">
            <label className="form-label">標籤（逗號分隔）</label>
            <input
              className="form-input"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="例：人生, 成長, 勇氣"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? '更新中...' : '確認更新'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: '0.68rem',
                padding: '0.78rem 1rem', background: 'none',
                border: '1px solid var(--border)', borderRadius: '2px',
                cursor: 'pointer', color: 'var(--text-muted)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'border-color 0.2s',
              }}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── 主卡片 ── */
// 統一深藍色背景
const CARD_BG = '#0f1f3d';
const CARD_BG_HOVER = '#122347';

export default function QuoteCard({ quote: initial, onAuthRequired, onTagClick }) {
  const [quote, setQuote] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { user, API } = useAuth();
  const { addToast } = useToast();

  const isOwner = user && String(quote.submittedBy?._id || quote.submittedBy) === String(user.id);
  const isLiked  = user && quote.likes?.includes(user.id);
  const isSaved  = user && quote.saves?.includes(user.id);

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
    <>
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
          boxShadow: hovered
            ? '0 12px 40px rgba(0,0,0,0.55)'
            : '0 4px 20px rgba(0,0,0,0.35)',
          transform: hovered ? 'translateY(-3px)' : 'none',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 裝飾引號 */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '6rem', lineHeight: 1,
          color: 'rgba(255,255,255,0.05)',
          position: 'absolute', top: 0, right: '1rem',
          pointerEvents: 'none', userSelect: 'none',
        }}>"</div>

        {/* 頂部列：來源 + 編輯按鈕 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.56rem', letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(200,169,110,0.5)',
          }}>
            {quote.source === 'ai' ? '✦ AI 生成' : '用戶投稿'}
          </span>

          {/* 編輯按鈕（只有發布者可見） */}
          {isOwner && (
            <button
              onClick={e => { e.stopPropagation(); setShowEdit(true); }}
              title="編輯語錄"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '3px', padding: '0.22rem 0.55rem',
                color: 'rgba(200,169,110,0.6)', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace", fontSize: '0.55rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)';
                e.currentTarget.style.color = 'rgba(200,169,110,0.9)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'rgba(200,169,110,0.6)';
              }}
            >
              <EditIcon style={{ width: '11px', height: '11px' }} />
              編輯
            </button>
          )}
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
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.2rem',
          paddingTop: '0.9rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          marginTop: 'auto',
        }}>
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

          {/* 發布者名稱 */}
          {quote.submittedBy?.username && (
            <span style={{
              marginLeft: 'auto',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.56rem', letterSpacing: '0.06em',
              color: 'rgba(232,228,220,0.25)',
            }}>
              {quote.submittedBy.username}
            </span>
          )}
        </div>

        {/* 留言區 */}
        {showComments && (
          <div style={{ marginTop: '0.9rem' }} onClick={e => e.stopPropagation()}>
            {quote.comments?.length === 0 && (
              <div style={{
                padding: '0.6rem 0', color: 'rgba(232,228,220,0.3)',
                fontSize: '0.68rem', fontFamily: "'Space Mono', monospace",
              }}>
                還沒有留言
              </div>
            )}
            {quote.comments?.map((c, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.6rem',
                padding: '0.6rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
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
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.56rem', color: 'rgba(232,228,220,0.3)', marginBottom: '0.15rem' }}>{c.username}</div>
                  <div style={{ color: 'rgba(232,228,220,0.65)', fontSize: '0.78rem', lineHeight: 1.6 }}>{c.text}</div>
                </div>
              </div>
            ))}
            {user ? (
              <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
                <input
                  className="form-input"
                  style={{
                    flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.78rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text)',
                  }}
                  placeholder="留下你的想法..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <button
                  className="submit-btn"
                  style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.6rem' }}
                  type="submit" disabled={submittingComment}
                >
                  送出
                </button>
              </form>
            ) : (
              <button className="quote-action-btn" style={{ marginTop: '0.5rem' }} onClick={onAuthRequired}>
                登入後留言
              </button>
            )}
          </div>
        )}
      </div>

      {/* 編輯 Modal */}
      {showEdit && (
        <EditModal
          quote={quote}
          onClose={() => setShowEdit(false)}
          onSaved={updated => setQuote(prev => ({ ...prev, ...updated }))}
        />
      )}
    </>
  );
}
