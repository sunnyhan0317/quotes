import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';

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
          { label: '總語錄', num: stats.total, color: 'var(--ink)' },
          { label: '待審核', num: stats.pending, color: '#856404' },
          { label: '已通過', num: stats.approved, color: '#0f5132' },
          { label: '已拒絕', num: stats.rejected, color: '#842029' },
          { label: '總用戶', num: stats.users, color: 'var(--accent)' },
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

function QuotesTable({ API, statusFilter }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { addToast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const endpoint = statusFilter === 'pending' ? '/admin/pending' : `/admin/all${params}`;
      const r = await API.get(endpoint);
      setQuotes(r.data.quotes);
      setTotal(r.data.total);
    } catch { addToast('載入失敗', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const action = async (id, type) => {
    try {
      if (type === 'delete') {
        if (!confirm('確定要永久刪除這則語錄？')) return;
        await API.delete(`/admin/${id}`);
        addToast('已刪除', 'success');
      } else {
        await API.patch(`/admin/${id}/${type}`);
        addToast(type === 'approve' ? '已通過審核' : '已拒絕', 'success');
      }
      fetch();
    } catch { addToast('操作失敗', 'error'); }
  };

  const titles = { pending: '待審核語錄', approved: '已通過語錄', rejected: '已拒絕語錄', '': '全部語錄' };

  return (
    <div>
      <h2 className="admin-title">{titles[statusFilter] || '語錄管理'} <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '1rem', color: 'var(--muted)' }}>({total})</span></h2>
      {loading ? <div className="loading">載入中</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>語錄內容</th>
                <th>作者</th>
                <th>投稿者</th>
                <th>來源</th>
                <th>狀態</th>
                <th>標籤</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>沒有資料</td></tr>
              )}
              {quotes.map(q => (
                <tr key={q._id}>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{q.content}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{q.author}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>
                    {q.submittedBy?.username || q.submittedByName || '-'}
                  </td>
                  <td>
                    <span className={`badge badge-${q.source}`}>{q.source === 'ai' ? 'AI' : '用戶'}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${q.status}`}>
                      {q.status === 'pending' ? '待審核' : q.status === 'approved' ? '已通過' : '已拒絕'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {q.tags?.join(', ') || '-'}
                  </td>
                  <td>
                    <div className="action-btns">
                      {q.status !== 'approved' && (
                        <button className="btn-approve" onClick={() => action(q._id, 'approve')}>通過</button>
                      )}
                      {q.status !== 'rejected' && (
                        <button className="btn-reject" onClick={() => action(q._id, 'reject')}>拒絕</button>
                      )}
                      <button className="btn-delete" onClick={() => action(q._id, 'delete')}>刪除</button>
                    </div>
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

function UsersTable({ API }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    API.get('/admin/users').then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleRole = async (id, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    try {
      const r = await API.patch(`/admin/users/${id}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === id ? r.data : u));
      addToast(`角色已更新為 ${newRole}`, 'success');
    } catch { addToast('操作失敗', 'error'); }
  };

  return (
    <div>
      <h2 className="admin-title">用戶管理 <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '1rem', color: 'var(--muted)' }}>({users.length})</span></h2>
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
                  <td style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>{u.username}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-approved' : 'badge-user'}`}>{u.role}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>
                    {u.googleId ? 'Google' : '電子郵件'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'Space Mono', monospace" }}>
                    {new Date(u.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td>
                    {u._id !== currentUser.id && (
                      <button className={u.role === 'admin' ? 'btn-delete' : 'btn-approve'}
                        onClick={() => toggleRole(u._id, u.role)}>
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

export default function AdminPage() {
  const { user, API } = useAuth();
  const [section, setSection] = useState('dashboard');

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return (
    <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '1rem' }}>無權限</div>
      <div style={{ color: 'var(--muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>需要管理員權限才能存取此頁面</div>
    </div>
  );

  const navItems = [
    { key: 'dashboard', label: '儀表板' },
    { key: 'pending', label: '待審核' },
    { key: 'approved', label: '已通過' },
    { key: 'rejected', label: '已拒絕' },
    { key: 'all', label: '全部語錄' },
    { key: 'users', label: '用戶管理' },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div style={{ padding: '1rem 1.5rem 1.5rem', fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'rgba(245,240,232,0.4)', borderBottom: '1px solid rgba(245,240,232,0.08)' }}>
          管理後台
        </div>
        {navItems.map(n => (
          <button key={n.key} className={`admin-nav-item ${section === n.key ? 'active' : ''}`}
            onClick={() => setSection(n.key)}>
            {n.label}
          </button>
        ))}
      </div>
      <div className="admin-content">
        {section === 'dashboard' && <StatsPanel API={API} />}
        {section === 'pending' && <QuotesTable API={API} statusFilter="pending" />}
        {section === 'approved' && <QuotesTable API={API} statusFilter="approved" />}
        {section === 'rejected' && <QuotesTable API={API} statusFilter="rejected" />}
        {section === 'all' && <QuotesTable API={API} statusFilter="" />}
        {section === 'users' && <UsersTable API={API} />}
      </div>
    </div>
  );
}
