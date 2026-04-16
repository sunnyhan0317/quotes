import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function PasswordField({ value, onChange, placeholder = '••••••••', required = true }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        minLength={6}
        value={value}
        onChange={onChange}
        style={{ paddingRight: '3rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: '0.75rem', top: '50%',
          transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.04em',
          transition: 'color 0.2s',
          padding: '0.2rem',
        }}
        onMouseEnter={e => e.target.style.color = 'var(--amber)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
      >
        {show ? '隱藏' : '顯示'}
      </button>
    </div>
  );
}

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register, googleLogin } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
      window.google?.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: 360, text: 'continue_with' }
      );
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  const handleGoogleCallback = async (res) => {
    try {
      setLoading(true);
      await googleLogin(res.credential);
      addToast('Google 登入成功！', 'success');
      onClose();
    } catch (e) {
      addToast(e.response?.data?.message || 'Google 登入失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        addToast('登入成功！歡迎回來', 'success');
      } else {
        await register(form.username, form.email, form.password);
        addToast('註冊成功！歡迎加入語境', 'success');
      }
      onClose();
    } catch (e) {
      addToast(e.response?.data?.message || '操作失敗，請稍後再試', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>{mode === 'login' ? '歡迎回來' : '加入語境'}</h2>
        <p>{mode === 'login' ? '登入以收藏、點讚並分享你的語錄' : '建立帳號，開始你的語錄之旅'}</p>

        {GOOGLE_CLIENT_ID && (
          <>
            <div id="google-btn" style={{ marginBottom: '0.5rem' }} />
            {!window.google && (
              <button className="google-btn" disabled>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
                </svg>
                使用 Google 繼續
              </button>
            )}
            <div className="divider">或</div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">用戶名</label>
              <input className="form-input" type="text" placeholder="你的筆名" required
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">電子郵件</label>
            <input className="form-input" type="email" placeholder="your@email.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">密碼</label>
            <PasswordField
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? '處理中...' : mode === 'login' ? '登入' : '建立帳號'}
          </button>
        </form>

        <div className="toggle-auth">
          {mode === 'login' ? (
            <span>還沒有帳號？<button onClick={() => setMode('register')}>立即註冊</button></span>
          ) : (
            <span>已有帳號？<button onClick={() => setMode('login')}>返回登入</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
