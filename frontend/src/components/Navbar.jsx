import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Navbar({ onAuthOpen, onSearch }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const inputRef = useRef(null);
  const loc = useLocation();

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleToggleSearch = () => {
    if (searchOpen) {
      setSearchOpen(false);
      if (searchVal) { setSearchVal(''); onSearch?.(''); }
    } else {
      setSearchOpen(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch?.(searchVal);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchVal('');
      onSearch?.('');
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => {
      if (!e.target.closest('.user-menu')) setMenuOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [menuOpen]);

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">語<span>境</span></Link>

      <div className="nav-links">

        {/* 搜尋 */}
        <div className="nav-search">
          <form
            onSubmit={handleSearchSubmit}
            className={`nav-search-form ${searchOpen ? 'open' : ''}`}
          >
            <input
              ref={inputRef}
              className="nav-search-input"
              placeholder="搜尋語錄、作者、標籤..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </form>
          <button className="nav-icon-btn" onClick={handleToggleSearch} title={searchOpen ? '關閉' : '搜尋'}>
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>
        </div>

        {!searchOpen && (
          <>
            <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>首頁</Link>
            <Link to="/mood-map" className={loc.pathname === '/mood-map' ? 'active' : ''}>情緒</Link>
            {user && (
              <Link to="/dna" className={loc.pathname === '/dna' ? 'active' : ''}>DNA</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className={loc.pathname.startsWith('/admin') ? 'active' : ''}>管理</Link>
            )}
          </>
        )}

        {!searchOpen && (
          user ? (
            <div className="user-menu">
              {/* 顯示 emoji 頭像或文字頭像 */}
              <div className="user-avatar" onClick={() => setMenuOpen(o => !o)}>
                {user.avatarEmoji
                  ? <span style={{ fontSize: '1rem', lineHeight: 1 }}>{user.avatarEmoji}</span>
                  : user.avatar
                    ? <img src={user.avatar} alt={user.username} />
                    : user.username?.[0]?.toUpperCase()
                }
              </div>
              {menuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-item" style={{
                    borderBottom: '1px solid var(--border)',
                    pointerEvents: 'none', opacity: 0.5,
                    textTransform: 'none', letterSpacing: 0,
                    fontFamily: "'Noto Serif TC', serif",
                    fontSize: '0.8rem',
                  }}>
                    {user.username}
                  </div>
                  <Link to="/profile" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                    個人資料
                  </Link>
                  <Link to="/diary" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                    我的日記
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                      管理後台
                    </Link>
                  )}
                  <button
                    className="user-dropdown-item danger"
                    onClick={() => { setMenuOpen(false); logout(); }}
                  >
                    登出
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-btn btn-primary" onClick={onAuthOpen}>登入 / 註冊</button>
          )
        )}
      </div>
    </nav>
  );
}
