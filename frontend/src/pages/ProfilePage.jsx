import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AVATAR_EMOJIS = ['🌙', '⭐', '🌊', '🔥', '🌸', '🍃', '🦋', '🐺', '🦊', '🐉', '🌺', '🍂', '🌙', '💫', '🎭', '🎨', '📚', '🎵', '🌿', '🪐', '🦁', '🐦', '🌈', '❄️', '🌻', '🎋', '🍀', '🦅', '🌄', '🌌'];

function PasswordInput({ label, placeholder, value, onChange, required }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="form-input" type={show ? 'text' : 'password'}
          placeholder={placeholder} value={value} onChange={onChange}
          required={required} minLength={6} style={{ paddingRight: '2.8rem' }} />
        <button type="button" onClick={() => setShow(s => !s)} style={{
          position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '0.7rem',
          fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em', transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color = 'var(--amber)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >{show ? '隱藏' : '顯示'}</button>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'Space Mono', monospace", fontSize: '0.63rem',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '0.7rem 0', background: 'none', border: 'none',
      borderBottom: `2px solid ${active ? 'var(--amber)' : 'transparent'}`,
      color: active ? 'var(--amber)' : 'var(--text-muted)',
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {label}
      {count !== undefined && <span style={{ marginLeft: '0.4em', opacity: 0.55, fontSize: '0.85em' }}>({count})</span>}
    </button>
  );
}

function EditQuoteModal({ quote, onClose, onSaved }) {
  const [form, setForm] = useState({ content: quote.content, author: quote.author, tags: quote.tags?.join(', ') || '' });
  const [loading, setLoading] = useState(false);
  const { API } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) { addToast('語錄內容不能為空', 'error'); return; }
    setLoading(true);
    try {
      const tags = form.tags.split(/[,，\s]+/).filter(Boolean).map(t => t.toLowerCase().replace('#', ''));
      const r = await API.patch(`/quotes/${quote._id}`, { content: form.content.trim(), author: form.author.trim(), tags });
      addToast(r.data.message, 'success');
      onSaved(r.data.quote);
      onClose();
    } catch (e) { addToast(e.response?.data?.message || '更新失敗', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: '0.3rem' }}>編輯語錄</h2>
        <p style={{ marginBottom: '1.4rem' }}>
          {quote.status === 'approved' ? '修改後將重新進入審核' : '修改後仍需等待管理員審核'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">語錄內容 *</label>
            <textarea className="form-textarea" rows={4} required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">出處 / 作者</label>
            <input className="form-input" placeholder="書名、作者名" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">標籤（逗號分隔）</label>
            <input className="form-input" placeholder="例：人生, 成長" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <button className="submit-btn" type="submit" disabled={loading}>{loading ? '更新中...' : '確認更新'}</button>
            <button type="button" onClick={onClose} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', padding: '0.78rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuoteRow({ quote: initial, onDelete, showStatus, editable }) {
  const [quote, setQuote] = useState(initial);
  const [showEdit, setShowEdit] = useState(false);
  const statusMap = { pending: { label: '審核中', color: 'var(--amber)' }, approved: { label: '已通過', color: '#6abf80' }, rejected: { label: '已拒絕', color: 'var(--rose)' } };
  const s = statusMap[quote.status] || statusMap.pending;

  return (
    <>
      <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'flex-start', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ width: '3px', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch', background: '#0f1f3d' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.8, marginBottom: '0.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {quote.content}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>— {quote.author}</span>
            {quote.tags?.length > 0 && <span>{quote.tags.map(t => `#${t}`).join(' ')}</span>}
            <span>❤ {quote.likes?.length || 0} · 🔖 {quote.saves?.length || 0}</span>
            {showStatus && <span style={{ color: s.color }}>{s.label}</span>}
            <span style={{ opacity: 0.45 }}>{new Date(quote.createdAt).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {editable && <button onClick={() => setShowEdit(true)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--amber)', cursor: 'pointer', borderRadius: '2px', padding: '0.25rem 0.6rem', fontFamily: "'Space Mono', monospace", fontSize: '0.58rem' }}>編輯</button>}
          {onDelete && quote.status === 'pending' && <button onClick={() => onDelete(quote._id)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--rose)', cursor: 'pointer', borderRadius: '2px', padding: '0.25rem 0.6rem', fontFamily: "'Space Mono', monospace", fontSize: '0.58rem' }}>撤回</button>}
        </div>
      </div>
      {showEdit && <EditQuoteModal quote={quote} onClose={() => setShowEdit(false)} onSaved={updated => setQuote(prev => ({ ...prev, ...updated }))} />}
    </>
  );
}

export default function ProfilePage() {
  const { user, API } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({ myQuotes: [], savedQuotes: [], likedQuotes: [] });
  const [dataLoading, setDataLoading] = useState(true);

  // 頭像
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(user?.avatarEmoji || '');
  const [emojiSaving, setEmojiSaving] = useState(false);

  // 個人資料
  const [profileForm, setProfileForm] = useState({ username: '', email: '' });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // 密碼
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  if (!user) return <Navigate to="/" replace />;

  const fetchProfile = useCallback(async () => {
    setDataLoading(true);
    try {
      const r = await API.get('/user/profile');
      setData(r.data);
    } catch { addToast('載入失敗', 'error'); }
    finally { setDataLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => {
    setProfileForm({ username: user.username || '', email: user.email || '' });
    setSelectedEmoji(user.avatarEmoji || '');
  }, [user]);

  const handleEmojiSave = async (emoji) => {
    setEmojiSaving(true);
    try {
      await API.patch('/user/avatar', { avatarEmoji: emoji });
      setSelectedEmoji(emoji);
      setShowEmojiPicker(false);
      addToast('頭像已更新', 'success');
    } catch { addToast('更新失敗', 'error'); }
    finally { setEmojiSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('確定要撤回這則語錄嗎？')) return;
    try {
      await API.delete(`/user/quotes/${id}`);
      addToast('已撤回', 'success');
      fetchProfile();
    } catch (e) { addToast(e.response?.data?.message || '撤回失敗', 'error'); }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await API.patch('/user/profile', { username: profileForm.username, email: profileForm.email });
      addToast('個人資料已更新', 'success');
      setProfileEditing(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) { addToast(e.response?.data?.message || '更新失敗', 'error'); }
    finally { setProfileLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { addToast('兩次輸入的新密碼不一致', 'error'); return; }
    setPwLoading(true);
    try {
      await API.patch('/user/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      addToast('密碼已成功更新', 'success');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e) { addToast(e.response?.data?.message || '修改失敗', 'error'); }
    finally { setPwLoading(false); }
  };

  const displayEmoji = selectedEmoji || user.avatarEmoji;
  const tabs = [
    { key: 'overview', label: '總覽' },
    { key: 'myQuotes', label: '投稿', count: data.myQuotes.length },
    { key: 'saved',    label: '收藏', count: data.savedQuotes.length },
    { key: 'liked',    label: '按讚', count: data.likedQuotes.length },
    { key: 'settings', label: '設定' },
    { key: 'contact',  label: '聯絡' },
  ];

  const listMap = { myQuotes: data.myQuotes, saved: data.savedQuotes, liked: data.likedQuotes };
  const emptyMap = { myQuotes: '還沒有投稿過語錄', saved: '還沒有收藏語錄', liked: '還沒有按讚任何語錄' };

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px' };
  const sectionTitle = { fontFamily: "'Noto Serif TC', serif", fontSize: '0.95rem', fontWeight: 400, color: 'var(--text)', marginBottom: '1.2rem', letterSpacing: '0.04em' };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* ── 頭部 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', marginBottom: '2.5rem' }}>

        {/* 頭像 + 點擊更換 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => setShowEmojiPicker(s => !s)}
            title="點擊更換頭像"
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0f1f3d, #1a3a6a)',
              border: `2px solid ${showEmojiPicker ? 'var(--amber)' : 'var(--border-light)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: displayEmoji ? '1.8rem' : '1.3rem',
              color: 'var(--amber)', overflow: 'hidden', cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.15s',
              transform: showEmojiPicker ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {displayEmoji
              ? displayEmoji
              : user.avatar
                ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user.username?.[0]?.toUpperCase()
            }
          </div>
          {/* 小鉛筆指示 */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '18px', height: '18px', borderRadius: '50%',
            background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.55rem', color: 'var(--bg)', border: '2px solid var(--bg)',
            cursor: 'pointer',
          }} onClick={() => setShowEmojiPicker(s => !s)}>✏</div>

          {/* Emoji 選擇器 */}
          {showEmojiPicker && (
            <div style={{
              position: 'absolute', top: '70px', left: 0, zIndex: 200,
              background: 'var(--surface-2)', border: '1px solid var(--border-light)',
              borderRadius: '8px', padding: '1rem', width: '230px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.7rem' }}>選擇頭像</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {AVATAR_EMOJIS.map((em, i) => (
                  <button key={i} onClick={() => handleEmojiSave(em)} disabled={emojiSaving} style={{
                    width: '36px', height: '36px', borderRadius: '6px', fontSize: '1.3rem',
                    background: selectedEmoji === em ? 'rgba(200,169,110,0.2)' : 'var(--bg-3)',
                    border: `2px solid ${selectedEmoji === em ? 'var(--amber)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.1s', lineHeight: 1,
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >{em}</button>
                ))}
              </div>
              <button onClick={() => handleEmojiSave('')} style={{ marginTop: '0.7rem', width: '100%', fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.06em', padding: '0.4rem', background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}>移除自訂頭像</button>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {user.username}
            {user.role === 'admin' && (
              <span style={{ color: 'var(--amber)', background: 'rgba(200,169,110,0.12)', padding: '0.1rem 0.5rem', borderRadius: '2px', fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>管理員</span>
            )}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>{user.email}</div>
          <Link to="/diary" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--amber)', textDecoration: 'none',
            border: '1px solid var(--amber-dim)', padding: '0.28rem 0.7rem', borderRadius: '2px',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,169,110,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >📓 我的日記</Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.8rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {tabs.map(t => <Tab key={t.key} {...t} active={tab === t.key} onClick={() => setTab(t.key)} />)}
      </div>

      {/* ── 總覽 ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 今日靈感 */}
          {data.savedQuotes.length > 0 && (() => {
            const q = data.savedQuotes[Math.floor(Math.random() * data.savedQuotes.length)];
            return (
              <div style={{ background: 'linear-gradient(135deg, #0f1f3d 60%, #1a2e55)', borderRadius: '6px', padding: '1.8rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-1rem', right: '1rem', fontFamily: "'Playfair Display', serif", fontSize: '8rem', color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>"</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.56rem', letterSpacing: '0.2em', color: 'rgba(200,169,110,0.5)', textTransform: 'uppercase', marginBottom: '1rem' }}>✦ 今日靈感</div>
                <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1rem', lineHeight: 2, color: 'rgba(232,228,220,0.9)', marginBottom: '0.8rem', position: 'relative', zIndex: 1 }}>{q.content}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'rgba(200,169,110,0.6)', letterSpacing: '0.08em' }}>— {q.author}</div>
              </div>
            );
          })()}

          {/* 統計 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            {[
              { label: '我的投稿', value: data.myQuotes.length, icon: '✍' },
              { label: '已收藏', value: data.savedQuotes.length, icon: '◇' },
              { label: '已按讚', value: data.likedQuotes.length, icon: '♡' },
              { label: '通過審核', value: data.myQuotes.filter(q => q.status === 'approved').length, icon: '✓' },
              { label: '獲得按讚', value: data.myQuotes.reduce((a, q) => a + (q.likes?.length || 0), 0), icon: '❤' },
              { label: '獲得收藏', value: data.myQuotes.reduce((a, q) => a + (q.saves?.length || 0), 0), icon: '★' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', marginBottom: '0.3rem', opacity: 0.4 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.5rem', fontWeight: 300, color: 'var(--amber)', lineHeight: 1, marginBottom: '0.25rem' }}>{s.value}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 列表型 ── */}
      {['myQuotes', 'saved', 'liked'].includes(tab) && (
        <div style={card}>
          {dataLoading ? <div className="loading">載入中</div>
            : listMap[tab].length === 0
              ? <div style={{ padding: '3rem', textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{emptyMap[tab]}</div>
              : listMap[tab].map(q => (
                <QuoteRow key={q._id} quote={q}
                  showStatus={tab === 'myQuotes'} editable={tab === 'myQuotes'}
                  onDelete={tab === 'myQuotes' ? handleDelete : null} />
              ))
          }
        </div>
      )}

      {/* ── 設定 ── */}
      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 個人資料 */}
          <div style={{ ...card, padding: '1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <div style={sectionTitle}>個人資料</div>
              {!profileEditing && (
                <button onClick={() => setProfileEditing(true)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.3rem 0.7rem', background: 'none', border: '1px solid var(--border)', color: 'var(--amber)', borderRadius: '2px', cursor: 'pointer' }}>修改</button>
              )}
            </div>

            {profileEditing ? (
              <form onSubmit={handleProfileSave}>
                <div className="form-group">
                  <label className="form-label">用戶名</label>
                  <input className="form-input" value={profileForm.username} required minLength={2}
                    onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">電子郵件</label>
                  <input className="form-input" type="email" value={profileForm.email} required
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '0.7rem', marginTop: '0.4rem' }}>
                  <button className="submit-btn" type="submit" disabled={profileLoading}>{profileLoading ? '儲存中...' : '儲存變更'}</button>
                  <button type="button" onClick={() => { setProfileEditing(false); setProfileForm({ username: user.username, email: user.email }); }}
                    style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', padding: '0.78rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>取消</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[['用戶名', user.username], ['電子郵件', user.email], ['登入方式', user.googleId ? 'Google 帳號' : '電子郵件']].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>{label}</div>
                    <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.88rem', color: 'var(--text)' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 修改密碼 */}
          <div style={{ ...card, padding: '1.8rem' }}>
            <div style={sectionTitle}>修改密碼</div>
            {user.googleId && !user.password ? (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 2, letterSpacing: '0.04em' }}>
                你的帳號是透過 Google 登入的，無法設定獨立密碼。
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                <PasswordInput label="目前密碼" placeholder="輸入目前的密碼" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
                <PasswordInput label="新密碼" placeholder="至少 6 個字元" value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} required />
                <PasswordInput label="確認新密碼" placeholder="再輸入一次新密碼" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
                <button className="submit-btn" type="submit" disabled={pwLoading} style={{ marginTop: '0.4rem' }}>{pwLoading ? '更新中...' : '確認修改'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── 聯絡 ── */}
      {tab === 'contact' && (
        <div style={{ ...card, padding: '1.8rem' }}>
          <div style={sectionTitle}>聯絡管理員</div>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 2.2, marginBottom: '1.5rem', letterSpacing: '0.04em' }}>
            如有語錄申訴、帳號問題或任何建議，歡迎直接發送郵件。
          </p>
          <a href={`mailto:yihan970317@gmail.com?subject=【語境】${user.username} 的回饋`}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', background: 'var(--bg-3)', border: '1px solid var(--border-light)', borderRadius: '4px', textDecoration: 'none', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--amber-dim)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#c8a96e" />
            </svg>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text)', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>yihan970317@gmail.com</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--text-muted)' }}>點擊開啟郵件客戶端</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ marginLeft: 'auto' }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
