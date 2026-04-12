import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  // 展開時自動 focus
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleToggleSearch = () => {
    if (searchOpen) {
      // 關閉時清空搜尋
      setSearchOpen(false);
      if (searchVal) {
        setSearchVal('');
        onSearch?.('');
      }
    } else {
      setSearchOpen(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch?.(searchVal);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchVal('');
      onSearch?.('');
    }
  };

  // 點外面關閉 user dropdown
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">語<span>境</span></Link>

      <div className="nav-links">

        {/* 搜尋欄 */}
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
              onKeyDown={handleSearchKeyDown}
            />
          </form>
          <button
            className="nav-icon-btn"
            onClick={handleToggleSearch}
            title={searchOpen ? '關閉搜尋' : '搜尋'}
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>
        </div>

        {/* 頁面連結 */}
        {!searchOpen && (
          <>
            <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>首頁</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={loc.pathname.startsWith('/admin') ? 'active' : ''}>管理</Link>
            )}
          </>
        )}

        {/* 用戶 */}
        {!searchOpen && (
          user ? (
            <div className="user-menu" onClick={e => e.stopPropagation()}>
              <div className="user-avatar" onClick={() => setMenuOpen(o => !o)}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.username} />
                  : user.username?.[0]?.toUpperCase()}
              </div>
              {menuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-item" style={{ borderBottom: '1px solid var(--border)', pointerEvents: 'none', opacity: 0.5 }}>
                    {user.username}
                  </div>
                  <button className="user-dropdown-item danger" onClick={() => { setMenuOpen(false); logout(); }}>登出</button>
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
