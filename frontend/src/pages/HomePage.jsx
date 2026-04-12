import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import QuoteCard from '../components/QuoteCard';
import SubmitQuotePanel from '../components/SubmitQuotePanel';

export default function HomePage({ onAuthRequired, search }) {
  const [quotes, setQuotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { API } = useAuth();

  // 搜尋變更時重置 page
  useEffect(() => { setPage(1); }, [search]);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, sort });
      if (search) params.append('search', search);
      if (activeTag) params.append('tag', activeTag);
      const r = await API.get(`/quotes?${params}`);
      setQuotes(r.data.quotes);
      setTotal(r.data.total);
      setTotalPages(r.data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTag, sort]);

  const fetchTags = useCallback(async () => {
    try {
      const r = await API.get('/quotes/tags');
      setTags(r.data.slice(0, 20));
    } catch {}
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? '' : tag);
    setPage(1);
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="hero-eyebrow">語境 · 語錄之海</div>
        <h1 className="hero-title">
          那些無法言說的，<br />
          <strong>都藏在別人的句子裡</strong>
        </h1>
        <p className="hero-desc">
          收藏讓你停下來的文字<br />
          在沉默中尋找共鳴
        </p>
        <div className="hero-stats">
          <div>
            <span className="hero-stat-num">{total}</span>
            <span className="hero-stat-label">則語錄</span>
          </div>
          <div>
            <span className="hero-stat-num">{tags.length}+</span>
            <span className="hero-stat-label">個主題</span>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* 排序 + 標籤列 */}
      <div className="tags-bar">
        {/* 排序 */}
        <select
          className="filter-select"
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
        >
          <option value="new">最新</option>
          <option value="popular">最多讚</option>
        </select>

        {/* 標籤 */}
        <div className="tags-cloud-inline">
          <span
            className={`tag ${!activeTag ? 'active' : ''}`}
            onClick={() => { setActiveTag(''); setPage(1); }}
          >
            全部
          </span>
          {tags.map(t => (
            <span
              key={t._id}
              className={`tag ${activeTag === t._id ? 'active' : ''}`}
              onClick={() => handleTagClick(t._id)}
            >
              {t._id}
              <span style={{ opacity: 0.35, marginLeft: '0.3em', fontSize: '0.9em' }}>{t.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="container">
        {/* 投稿面板 */}
        <SubmitQuotePanel onSubmitted={fetchQuotes} onAuthRequired={onAuthRequired} />

        {/* 搜尋中提示 */}
        {search && (
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            marginBottom: '1.2rem'
          }}>
            搜尋「{search}」的結果 · 共 {total} 則
          </div>
        )}

        {/* 語錄格 */}
        {loading ? (
          <div className="loading">載入中</div>
        ) : quotes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            color: 'var(--text-muted)',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.72rem',
            letterSpacing: '0.1em'
          }}>
            {search || activeTag ? '找不到符合的語錄' : '語錄庫還是空的，來第一個投稿吧'}
          </div>
        ) : (
          <div className="quotes-grid">
            {quotes.map((q) => (
              <QuoteCard
                key={q._id}
                quote={q}
                onAuthRequired={onAuthRequired}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              );
            })}
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >›</button>
          </div>
        )}
      </div>
    </div>
  );
}
