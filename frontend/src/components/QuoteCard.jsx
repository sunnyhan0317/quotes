import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PosterModal from './PosterModal';

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

/* 使用者頭像 */
function UserAvatar({ username, avatar, avatarEmoji, size = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: 'rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: avatarEmoji ? size * 0.6 : size * 0.42,
      fontFamily: "'Space Mono', monospace", color: 'rgba(232,228,220,0.5)',
    }}>
      {avatarEmoji
        ? avatarEmoji
        : avatar
          ? <img src={avatar} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : username?.[0]?.toUpperCase()}
    </div>
  );
}

/* 共用按鈕樣式 */
const tinyBtn = {
  background: 'none', border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(232,228,220,0.3)', cursor: 'pointer', borderRadius: '2px',
  padding: '0.12rem 0.4rem', fontFamily: "'Space Mono', monospace",
  fontSize: '0.5rem', flexShrink: 0, transition: 'color 0.15s',
};
const miniBtn = (color) => ({
  background: 'none', border: `1px solid ${color}40`, color,
  cursor: 'pointer', borderRadius: '2px', padding: '0.2rem 0.5rem',
  fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', flexShrink: 0,
});

/* ── 一般留言區 ── */
function CommentsSection({ quoteId, comments: initial, onAuthRequired }) {
  const [comments, setComments] = useState(initial || []);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, API } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const r = await API.post(`/quotes/${quoteId}/comment`, { text });
      setComments(r.data.comments);
      setText('');
    } catch { addToast('留言失敗', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const r = await API.patch(`/quotes/${quoteId}/comment/${commentId}`, { text: editText });
      setComments(r.data.comments);
      setEditingId(null);
    } catch { addToast('編輯失敗', 'error'); }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('確定刪除留言？')) return;
    try {
      const r = await API.delete(`/quotes/${quoteId}/comment/${commentId}`);
      setComments(r.data.comments);
    } catch { addToast('刪除失敗', 'error'); }
  };

  return (
    <div>
      {comments.length === 0 && (
        <div style={{ color: 'rgba(232,228,220,0.25)', fontSize: '0.68rem', fontFamily: "'Space Mono', monospace", padding: '0.5rem 0' }}>
          還沒有留言
        </div>
      )}
      {comments.map((c) => (
        <div key={c._id} style={{ display: 'flex', gap: '0.6rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <UserAvatar username={c.username} avatar={c.avatar} avatarEmoji={c.avatarEmoji} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'rgba(232,228,220,0.3)' }}>{c.username}</span>
              {c.edited && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: 'rgba(232,228,220,0.2)', fontStyle: 'italic' }}>已編輯</span>}
            </div>
            {editingId === c._id ? (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                <input className="form-input" value={editText} onChange={e => setEditText(e.target.value)}
                  style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />
                <button onClick={() => handleEdit(c._id)} style={miniBtn('#c8a96e')}>存</button>
                <button onClick={() => setEditingId(null)} style={miniBtn('rgba(232,228,220,0.3)')}>取</button>
              </div>
            ) : (
              <div style={{ color: 'rgba(232,228,220,0.65)', fontSize: '0.78rem', lineHeight: 1.6 }}>{c.text}</div>
            )}
          </div>
          {user && String(c.user) === String(user.id) && editingId !== c._id && (
            <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
              <button onClick={() => { setEditingId(c._id); setEditText(c.text); }} style={tinyBtn}>編</button>
              <button onClick={() => handleDelete(c._id)} style={{ ...tinyBtn, color: 'var(--rose)' }}>刪</button>
            </div>
          )}
        </div>
      ))}
      {user ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
          <input className="form-input" placeholder="留下你的想法..." value={text} onChange={e => setText(e.target.value)}
            style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.78rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />
          <button className="submit-btn" type="submit" disabled={submitting} style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.6rem' }}>送出</button>
        </form>
      ) : (
        <button className="quote-action-btn" style={{ marginTop: '0.5rem' }} onClick={onAuthRequired}>登入後留言</button>
      )}
    </div>
  );
}

/* ── 辯論區 ── */
function DebateSection({ quoteId, debateComments: initial, onAuthRequired }) {
  const [items, setItems] = useState(initial || []);
  const [text, setText] = useState('');
  const [side, setSide] = useState('for');
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const { user, API } = useAuth();
  const { addToast } = useToast();

  const forItems = items.filter(i => i.side === 'for');
  const againstItems = items.filter(i => i.side === 'against');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const r = await API.post(`/quotes/${quoteId}/debate`, { text, side });
      setItems(r.data.debateComments);
      setText('');
    } catch { addToast('發表失敗', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (debateId) => {
    if (!user) { onAuthRequired(); return; }
    try {
      const r = await API.post(`/quotes/${quoteId}/debate/${debateId}/like`);
      setItems(r.data.debateComments);
    } catch { addToast('操作失敗', 'error'); }
  };

  const handleDelete = async (debateId) => {
    if (!confirm('確定刪除？')) return;
    try {
      const r = await API.delete(`/quotes/${quoteId}/debate/${debateId}`);
      setItems(r.data.debateComments);
    } catch { addToast('刪除失敗', 'error'); }
  };

  const displayed = activeFilter === 'all' ? items : items.filter(i => i.side === activeFilter);

  return (
    <div>
      {/* 計分板 */}
      <div style={{ display: 'flex', marginBottom: '0.8rem', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ flex: 1, padding: '0.6rem', background: 'rgba(80,160,120,0.12)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'rgba(80,200,120,0.7)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>✓ 認同</div>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.2rem', color: 'rgba(80,200,120,0.9)' }}>{forItems.length}</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ flex: 1, padding: '0.6rem', background: 'rgba(155,79,92,0.12)', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'rgba(200,100,110,0.7)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>✗ 不認同</div>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.2rem', color: 'rgba(200,100,110,0.9)' }}>{againstItems.length}</div>
        </div>
      </div>

      {/* 篩選 */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
        {[['all', '全部'], ['for', '✓ 認同'], ['against', '✗ 不認同']].map(([v, l]) => (
          <button key={v} onClick={() => setActiveFilter(v)} style={{
            fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.06em',
            padding: '0.22rem 0.6rem',
            background: activeFilter === v ? 'rgba(200,169,110,0.2)' : 'none',
            border: `1px solid ${activeFilter === v ? 'var(--amber-dim)' : 'rgba(255,255,255,0.08)'}`,
            color: activeFilter === v ? 'var(--amber)' : 'rgba(232,228,220,0.4)',
            borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {displayed.length === 0 && (
        <div style={{ color: 'rgba(232,228,220,0.22)', fontSize: '0.68rem', fontFamily: "'Space Mono', monospace", padding: '0.5rem 0 0.8rem' }}>
          還沒有人發表意見，來第一個！
        </div>
      )}
      {displayed.map(d => {
        const isFor = d.side === 'for';
        const accentColor = isFor ? 'rgba(80,200,120,0.7)' : 'rgba(200,100,110,0.7)';
        const bgColor = isFor ? 'rgba(80,160,120,0.07)' : 'rgba(155,79,92,0.07)';
        const isLiked = user && d.likes?.includes(user.id);
        return (
          <div key={d._id} style={{ display: 'flex', gap: '0.6rem', padding: '0.7rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: bgColor, borderRadius: '3px', marginBottom: '0.3rem' }}>
            <UserAvatar username={d.username} avatar={d.avatar} avatarEmoji={d.avatarEmoji} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'rgba(232,228,220,0.3)' }}>{d.username}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: accentColor, letterSpacing: '0.06em' }}>
                  {isFor ? '✓ 認同' : '✗ 不認同'}
                </span>
              </div>
              <div style={{ color: 'rgba(232,228,220,0.65)', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: '0.4rem' }}>{d.text}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <button onClick={() => handleLike(d._id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                  fontFamily: "'Space Mono', monospace", fontSize: '0.58rem',
                  color: isLiked ? 'var(--amber)' : 'rgba(232,228,220,0.3)', transition: 'color 0.15s',
                }}>♡ {d.likes?.length || 0}</button>
                {user && String(d.user) === String(user.id) && (
                  <button onClick={() => handleDelete(d._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: 'rgba(200,100,110,0.4)', transition: 'color 0.15s' }}>
                    刪除
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {user ? (
        <form onSubmit={handleSubmit} style={{ marginTop: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
            {[['for', '✓ 我認同這句話'], ['against', '✗ 我不認同這句話']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setSide(v)} style={{
                flex: 1, fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.04em',
                padding: '0.4rem 0.5rem',
                background: side === v ? (v === 'for' ? 'rgba(80,160,120,0.2)' : 'rgba(155,79,92,0.2)') : 'none',
                border: `1px solid ${side === v ? (v === 'for' ? 'rgba(80,200,120,0.4)' : 'rgba(200,100,110,0.4)') : 'rgba(255,255,255,0.08)'}`,
                color: side === v ? (v === 'for' ? 'rgba(80,200,120,0.9)' : 'rgba(200,100,110,0.9)') : 'rgba(232,228,220,0.35)',
                borderRadius: '3px', cursor: 'pointer', transition: 'all 0.15s',
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="form-input" placeholder="發表你的觀點..." value={text} onChange={e => setText(e.target.value)}
              style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.78rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }} />
            <button className="submit-btn" type="submit" disabled={submitting} style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.6rem' }}>發表</button>
          </div>
        </form>
      ) : (
        <button className="quote-action-btn" style={{ marginTop: '0.5rem' }} onClick={onAuthRequired}>登入後參與辯論</button>
      )}
    </div>
  );
}

/* ── 主卡片 ── */
const CARD_BG = '#0f1f3d';
const CARD_BG_HOVER = '#122347';

export default function QuoteCard({ quote: initial, onAuthRequired, onTagClick }) {
  const [quote, setQuote] = useState(initial);
  const [activeTab, setActiveTab] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
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
        likes: r.data.liked ? [...(prev.likes || []), user.id] : (prev.likes || []).filter(id => id !== user.id),
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
        saves: r.data.saved ? [...(prev.saves || []), user.id] : (prev.saves || []).filter(id => id !== user.id),
      }));
      addToast(r.data.saved ? '已收藏' : '已取消收藏', 'success');
    } catch { addToast('操作失敗', 'error'); }
  };

  const toggleTab = (tab) => setActiveTab(prev => prev === tab ? null : tab);

  return (
    <>
      <div
        style={{
          backgroundColor: hovered ? CARD_BG_HOVER : CARD_BG,
          borderRadius: '6px', padding: '1.8rem 1.6rem 1.4rem',
          position: 'relative', overflow: 'hidden',
          transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
          display: 'flex', flexDirection: 'column',
          boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.35)',
          transform: hovered ? 'translateY(-3px)' : 'none',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 裝飾引號 */}
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '6rem', lineHeight: 1, color: 'rgba(255,255,255,0.04)', position: 'absolute', top: 0, right: '1rem', pointerEvents: 'none', userSelect: 'none' }}>"</div>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(200,169,110,0.45)', marginBottom: '1rem' }}>
          {quote.source === 'ai' ? '✦ AI 生成' : '用戶投稿'}
        </div>

        <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.97rem', lineHeight: 2, color: 'rgba(232,228,220,0.92)', flex: 1, marginBottom: '1.2rem', position: 'relative', zIndex: 1 }}>
          {quote.content}
        </div>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', color: 'rgba(200,169,110,0.65)', marginBottom: '0.9rem' }}>
          — {quote.author}
        </div>

        {quote.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
            {quote.tags.map(tag => (
              <span key={tag} className="tag dark" onClick={e => { e.stopPropagation(); onTagClick?.(tag); }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* 動作列 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 'auto', flexWrap: 'wrap' }}>
          <button className={`quote-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <HeartIcon filled={isLiked} />
          </button>
          <button className={`quote-action-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
            <BookmarkIcon filled={isSaved} />
          </button>

          <button onClick={() => toggleTab('comments')} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontFamily: "'Space Mono', monospace", fontSize: '0.62rem',
            color: activeTab === 'comments' ? 'var(--amber)' : 'rgba(232,228,220,0.4)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0', transition: 'color 0.15s',
          }}>
            <ChatIcon />
            {quote.comments?.length || 0}
          </button>

          <button onClick={() => toggleTab('debate')} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontFamily: "'Space Mono', monospace", fontSize: '0.62rem',
            color: activeTab === 'debate' ? 'var(--amber)' : 'rgba(232,228,220,0.4)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0', transition: 'color 0.15s',
            letterSpacing: '0.04em',
          }}>
            ⚖ {quote.debateComments?.length || 0}
          </button>

          {/* 海報按鈕 */}
          <button
            onClick={e => { e.stopPropagation(); setShowPoster(true); }}
            title="生成海報"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(232,228,220,0.22)', fontSize: '0.8rem',
              padding: '0.1rem 0.2rem', transition: 'color 0.15s', lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(200,169,110,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,228,220,0.22)'}
          >🖼</button>

          {quote.submittedBy?.username && (
            <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: '0.52rem', letterSpacing: '0.04em', color: 'rgba(232,228,220,0.18)' }}>
              {quote.submittedBy.username}
            </span>
          )}
        </div>

        {/* 展開區塊 */}
        {activeTab && (
          <div style={{ marginTop: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.9rem' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.8rem' }}>
              {[['comments', '💬 留言'], ['debate', '⚖ 辯論']].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0.3rem',
                  borderBottom: `1px solid ${activeTab === tab ? 'var(--amber)' : 'transparent'}`,
                  color: activeTab === tab ? 'var(--amber)' : 'rgba(232,228,220,0.3)',
                  transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>
            {activeTab === 'comments' && (
              <CommentsSection quoteId={quote._id} comments={quote.comments} onAuthRequired={onAuthRequired} />
            )}
            {activeTab === 'debate' && (
              <DebateSection quoteId={quote._id} debateComments={quote.debateComments} onAuthRequired={onAuthRequired} />
            )}
          </div>
        )}
      </div>

      {/* 海報 Modal — 在卡片 div 外面，需要 fragment 包住 */}
      {showPoster && <PosterModal quote={quote} onClose={() => setShowPoster(false)} />}
    </>
  );
}
