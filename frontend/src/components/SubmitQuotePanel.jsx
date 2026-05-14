import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SubmitQuotePanel({ onSubmitted, onAuthRequired }) {
  const [form, setForm] = useState({ content: '', author: '', tags: '' });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user, API } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }
    setLoading(true);
    try {
      const tags = form.tags.split(/[,，\s]+/).filter(Boolean).map(t => t.toLowerCase().replace('#', ''));
      await API.post('/quotes', { content: form.content, author: form.author, tags });
      addToast('語錄已發布！', 'success');
      setForm({ content: '', author: '', tags: '' });
      setExpanded(false);
      onSubmitted?.();
    } catch (e) {
      addToast(e.response?.data?.message || '發布失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <div className="submit-panel" style={{ cursor: 'pointer', marginBottom: '2rem' }}
        onClick={() => user ? setExpanded(true) : onAuthRequired()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-avatar" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
            {user?.avatarEmoji
              ? <span style={{ fontSize: '1.1rem' }}>{user.avatarEmoji}</span>
              : user?.avatar
                ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{
            flex: 1, padding: '0.6rem 1rem',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: '2px', cursor: 'text',
            color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem',
            letterSpacing: '0.04em',
          }}>
            {user ? '分享一句觸動你的話...' : '登入後投稿你的語錄'}
          </div>
          <button
            className="submit-btn"
            style={{ width: 'auto', padding: '0.5rem 1.2rem' }}
            onClick={e => { e.stopPropagation(); user ? setExpanded(true) : onAuthRequired(); }}
          >
            投稿
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-panel" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.95rem', color: 'var(--text)', letterSpacing: '0.04em' }}>
          投稿語錄
        </div>
        <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">語錄內容 *</label>
          <textarea className="form-textarea"
            placeholder="輸入你想分享的語錄、名言或金句..."
            value={form.content} required minLength={5}
            onChange={e => setForm({ ...form, content: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">出處 / 作者</label>
          <input className="form-input" placeholder="書名、作者名（可留空）"
            value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">標籤（逗號分隔）</label>
          <input className="form-input" placeholder="例：人生, 成長, 勇氣"
            value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? '發布中...' : '發布語錄'}
          </button>
          <button type="button" onClick={() => setExpanded(false)} style={{
            fontFamily: "'Space Mono', monospace", fontSize: '0.72rem',
            padding: '0.85rem 1.2rem', background: 'none',
            border: '1px solid var(--border)', borderRadius: '2px',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>取消</button>
        </div>
      </form>
    </div>
  );
}
