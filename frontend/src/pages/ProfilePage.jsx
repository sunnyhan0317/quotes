import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── 密碼欄位 ── */
function PasswordInput({ label, placeholder, value, onChange, required }) {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="form-input"
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          minLength={6}
          style={{ paddingRight: '2.8rem' }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: '0.7rem', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '0.72rem',
            fontFamily: "'Space Mono', monospace", letterSpacing: '0.04em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--amber)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          {show ? '隱藏' : '顯示'}
        </button>
      </div>
    </div>
  );
}

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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: '0.3rem' }}>編輯語錄</h2>
        <p style={{ marginBottom: '1.4rem' }}>
          {quote.status === 'approved'
            ? '修改後將重新進入審核'
            : '修改後仍需等待管理員審核'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">語錄內容 *</label>
            <textarea className="form-textarea" rows={4}
              value={form.content} required
              onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">出處 / 作者</label>
            <input className="form-input" placeholder="書名、作者名"
              value={form.author}
              onChange={e => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">標籤（逗號分隔）</label>
            <input className="form-input" placeholder="例：人生, 成長"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? '更新中...' : '確認更新'}
            </button>
            <button type="button" onClick={onClose} style={{
              fontFamily: "'Space Mono', monospace", fontSize: '0.68rem',
              padding: '0.78rem 1rem', background: 'none',
              border: '1px solid var(--border)', borderRadius: '2px',
              cursor: 'pointer', color: 'var(--text-muted)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── 語錄列 ── */
function QuoteRow({ quote: initial, onDelete, showStatus, editable }) {
  const [quote, setQuote] = useState(initial);
  const [showEdit, setShowEdit] = useState(false);

  const statusMap = {
    pending:  { label: '審核中', color: 'var(--amber)' },
    approved: { label: '已通過', color: '#6abf80' },
    rejected: { label: '已拒絕', color: 'var(--rose)' },
  };
  const s = statusMap[quote.status] || statusMap.pending;

  return (
    <>
      <div style={{
        padding: '1rem 1.2rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', gap: '1rem', alignItems: 'flex-start',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* 左色條 */}
        <div style={{
          width: '3px', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch',
          background: '#0f1f3d',
          border: '1px solid rgba(15,31,61,0.6)',
        }} />

        {/* 內容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Noto Serif TC', serif",
            fontSize: '0.88rem', color: 'var(--text)',
            lineHeight: 1.8, marginBottom: '0.4rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {quote.content}
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '0.6rem',
            color: 'var(--text-muted)', display: 'flex', gap: '1rem',
            flexWrap: 'wrap', alignItems: 'center',
          }}>
            <span>— {quote.author}</span>
            {quote.tags?.length > 0 && <span>{quote.tags.map(t => `#${t}`).join(' ')}</span>}
            <span>❤ {quote.likes?.length || 0} · 🔖 {quote.saves?.length || 0}</span>
            {showStatus && <span style={{ color: s.color }}>{s.label}</span>}
            <span style={{ opacity: 0.5 }}>{new Date(quote.createdAt).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
          {/* 編輯按鈕 */}
          {editable && (
            <button
              onClick={() => setShowEdit(true)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--amber)', cursor: 'pointer',
                borderRadius: '2px', padding: '0.25rem 0.6rem',
                fontFamily: "'Space Mono', monospace", fontSize: '0.58rem',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--amber-dim)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              編輯
            </button>
          )}

          {/* 撤回（只有 pending） */}
          {onDelete && quote.status === 'pending' && (
            <button
              onClick={() => onDelete(quote._id)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--rose)', cursor: 'pointer',
                borderRadius: '2px', padding: '0.25rem 0.6rem',
                fontFamily: "'Space Mono', monospace", fontSize: '0.58rem',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rose)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              撤回
            </button>
          )}
        </div>
      </div>

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

/* ── Tab ── */
function Tab({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'Space Mono', monospace", fontSize: '0.65rem',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '0.6rem 0', background: 'none', border: 'none',
      borderBottom: `2px solid ${active ? 'var(--amber)' : 'transparent'}`,
      color: active ? 'var(--amber)' : 'var(--text-muted)',
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {label}
      {count !== undefined && <span style={{ marginLeft: '0.4em', opacity: 0.6 }}>({count})</span>}
    </button>
  );
}

/* ── 主頁面 ── */
export default function ProfilePage() {
  const { user, API } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('myQuotes');
  const [data, setData] = useState({ myQuotes: [], savedQuotes: [], likedQuotes: [] });
  const [dataLoading, setDataLoading] = useState(true);
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

  const handleDelete = async (id) => {
    if (!confirm('確定要撤回這則語錄嗎？')) return;
    try {
      await API.delete(`/user/quotes/${id}`);
      addToast('已撤回', 'success');
      fetchProfile();
    } catch (e) {
      addToast(e.response?.data?.message || '撤回失敗', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { addToast('兩次輸入的新密碼不一致', 'error'); return; }
    if (pwForm.next.length < 6) { addToast('新密碼至少需要 6 個字元', 'error'); return; }
    setPwLoading(true);
    try {
      await API.patch('/user/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      addToast('密碼已成功更新', 'success');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e) {
      addToast(e.response?.data?.message || '修改失敗', 'error');
    } finally { setPwLoading(false); }
  };

  const tabs = [
    { key: 'myQuotes', label: '我的投稿', count: data.myQuotes.length },
    { key: 'saved',    label: '已收藏',   count: data.savedQuotes.length },
    { key: 'liked',    label: '已按讚',   count: data.likedQuotes.length },
    { key: 'password', label: '修改密碼' },
    { key: 'contact',  label: '聯絡管理員' },
  ];

  const currentList =
    tab === 'myQuotes' ? data.myQuotes :
    tab === 'saved'    ? data.savedQuotes :
    tab === 'liked'    ? data.likedQuotes : [];

  const emptyText =
    tab === 'myQuotes' ? '還沒有投稿過語錄' :
    tab === 'saved'    ? '還沒有收藏語錄'   :
                         '還沒有按讚任何語錄';

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* 個人資訊 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--surface-2)', border: '2px solid var(--border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', color: 'var(--amber)',
          fontFamily: "'Noto Serif TC', serif", overflow: 'hidden', flexShrink: 0,
        }}>
          {user.avatar
            ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
            {user.username}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            {user.email}
            {user.role === 'admin' && (
              <span style={{ marginLeft: '0.8rem', color: 'var(--amber)', background: 'rgba(200,169,110,0.12)', padding: '0.1rem 0.5rem', borderRadius: '2px' }}>
                管理員
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '1.5rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1.5rem', overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {tabs.map(t => (
          <Tab key={t.key} label={t.label} count={t.count} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {/* 列表型 Tab */}
      {['myQuotes', 'saved', 'liked'].includes(tab) && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          {dataLoading ? (
            <div className="loading">載入中</div>
          ) : currentList.length === 0 ? (
            <div style={{
              padding: '3rem', textAlign: 'center',
              fontFamily: "'Space Mono', monospace", fontSize: '0.7rem',
              color: 'var(--text-muted)', letterSpacing: '0.08em',
            }}>{emptyText}</div>
          ) : (
            currentList.map(q => (
              <QuoteRow
                key={q._id}
                quote={q}
                showStatus={tab === 'myQuotes'}
                editable={tab === 'myQuotes'}
                onDelete={tab === 'myQuotes' ? handleDelete : null}
              />
            ))
          )}
        </div>
      )}

      {/* 修改密碼 */}
      {tab === 'password' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1.8rem' }}>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1rem', color: 'var(--text)', marginBottom: '1.4rem', letterSpacing: '0.04em' }}>
            修改密碼
          </div>
          {user.googleId && !user.password ? (
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 2, letterSpacing: '0.04em' }}>
              你的帳號是透過 Google 登入的，無法設定獨立密碼。
            </div>
          ) : (
            <form onSubmit={handleChangePassword}>
              <PasswordInput label="目前密碼" placeholder="輸入目前的密碼" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
              <PasswordInput label="新密碼" placeholder="至少 6 個字元" value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} required />
              <PasswordInput label="確認新密碼" placeholder="再輸入一次新密碼" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              <button className="submit-btn" type="submit" disabled={pwLoading} style={{ marginTop: '0.4rem' }}>
                {pwLoading ? '更新中...' : '確認修改'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 聯絡管理員 */}
      {tab === 'contact' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1.8rem' }}>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1rem', color: 'var(--text)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
            聯絡管理員
          </div>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 2.2, marginBottom: '1.5rem', letterSpacing: '0.04em' }}>
            如有語錄申訴、帳號問題或任何建議，<br />歡迎直接發送郵件給管理員。
          </p>

          <a
            href={`mailto:yihan970317@gmail.com?subject=【語境】使用者回饋 - ${user.username}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem 1.2rem',
              background: 'var(--bg-3)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--amber-dim)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#c8a96e"/>
            </svg>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text)', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                yihan970317@gmail.com
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                點擊開啟郵件客戶端
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ marginLeft: 'auto' }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
              寫信時可以附上
            </div>
            {[
              '你的用戶名：' + user.username,
              '問題類型（語錄申訴 / 帳號 / 建議 / 其他）',
              '詳細說明',
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                fontFamily: "'Space Mono', monospace", fontSize: '0.65rem',
                color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: '0.3rem',
              }}>
                <span style={{ color: 'var(--amber)', flexShrink: 0 }}>·</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
