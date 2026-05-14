import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';

/* 統計卡 */
function StatsPanel({ API }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    API.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="loading">載入統計中</div>;
  return (
    <div>
      <h2 className="admin-title">儀表板</h2>
      <div className="stat-cards">
        {[
          { label: '總語錄', num: stats.total, color: 'var(--amber)' },
          { label: '總用戶', num: stats.users, color: '#6abf80' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <span className="stat-num" style={{ color: s.color }}>{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 語錄管理 */
function QuotesTable({ API }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { addToast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await API.get(`/admin/all?page=${page}&limit=20`);
      setQuotes(r.data.quotes);
      setTotal(r.data.total);
    } catch { addToast('載入失敗', 'error'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!confirm('確定要永久刪除這則語錄？此操作無法還原。')) return;
    try {
      await API.delete(`/admin/${id}`);
      addToast('已刪除', 'success');
      fetch();
    } catch { addToast('刪除失敗', 'error'); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h2 className="admin-title">
        語錄管理
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.8rem' }}>
          ({total})
        </span>
      </h2>
      {loading ? <div className="loading">載入中</div> : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>語錄內容</th>
                  <th>作者</th>
                  <th>投稿者</th>
                  <th>標籤</th>
                  <th>日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', padding: '2rem' }}>沒有語錄</td></tr>
                )}
                {quotes.map(q => (
                  <tr key={q._id}>
                    <td>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
                        {q.content.length > 80 ? q.content.slice(0, 80) + '...' : q.content}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{q.author}</td>
                    <td style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {q.submittedBy?.username || q.submittedByName || '-'}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {q.tags?.join(', ') || '-'}
                    </td>
                    <td style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(q.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDelete(q._id)}>
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '1.5rem' }}>
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* 用戶管理 */
function UsersTable({ API }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    API.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => addToast('載入失敗', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggleRole = async (id, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    if (!confirm(`確定要將此用戶${newRole === 'admin' ? '升為管理員' : '降為一般用戶'}？`)) return;
    try {
      const r = await API.patch(`/admin/users/${id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === id ? r.data : u));
      addToast(`已更新為 ${newRole}`, 'success');
    } catch { addToast('操作失敗', 'error'); }
  };

  return (
    <div>
      <h2 className="admin-title">
        用戶管理
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.8rem' }}>
          ({users.length})
        </span>
      </h2>
      {loading ? <div className="loading">載入中</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>用戶名</th>
                <th>電子郵件</th>
                <th>角色</th>
                <th>登入方式</th>
                <th>加入日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', color: 'var(--text)' }}>
                    {u.avatarEmoji && <span style={{ marginRight: '0.4rem' }}>{u.avatarEmoji}</span>}
                    {u.username}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-approved' : 'badge-user'}`}>
                      {u.role === 'admin' ? '管理員' : '用戶'}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {u.googleId ? 'Google' : '電子郵件'}
                  </td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(u.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td>
                    {u._id !== currentUser.id && (
                      <button
                        className={u.role === 'admin' ? 'btn-delete' : 'btn-approve'}
                        onClick={() => toggleRole(u._id, u.role)}
                      >
                        {u.role === 'admin' ? '降為用戶' : '升為管理員'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* 主頁面 */
export default function AdminPage() {
  const { user, API } = useAuth();
  const [section, setSection] = useState('dashboard');

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return (
    <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text)' }}>無權限</div>
      <div style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem' }}>需要管理員權限才能存取此頁面</div>
    </div>
  );

  const navItems = [
    { key: 'dashboard', label: '儀表板' },
    { key: 'quotes',    label: '語錄管理' },
    { key: 'users',     label: '用戶管理' },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div style={{ padding: '1rem 1.5rem 1.2rem', fontFamily: "'Noto Serif TC', serif", fontSize: '1rem', color: 'rgba(245,240,232,0.3)', borderBottom: '1px solid rgba(245,240,232,0.06)' }}>
          管理後台
        </div>
        {navItems.map(n => (
          <button key={n.key}
            className={`admin-nav-item ${section === n.key ? 'active' : ''}`}
            onClick={() => setSection(n.key)}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div className="admin-content">
        {section === 'dashboard' && <StatsPanel API={API} />}
        {section === 'quotes'    && <QuotesTable API={API} />}
        {section === 'users'     && <UsersTable API={API} />}
      </div>
    </div>
  );
}
