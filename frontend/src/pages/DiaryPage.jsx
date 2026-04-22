import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MOODS = ['😄', '😊', '😐', '😔', '😢', '😡', '😴', '🤔', '✨', '💪'];
const WEATHERS = ['☀️', '⛅', '🌧️', '⛈️', '❄️', '🌫️'];
const MOOD_LABELS = { '😄': '很棒', '😊': '不錯', '😐': '普通', '😔': '有點低落', '😢': '很難過', '😡': '生氣', '😴': '疲憊', '🤔': '思考中', '✨': '很有靈感', '💪': '充滿能量' };

/* 日期格式 */
const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};
const daysUntil = (d) => {
  const diff = new Date(d) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/* ── 心情日記 ── */
function MoodDiary({ API }) {
  const { addToast } = useToast();
  const [diaries, setDiaries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today());
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ mood: '', weather: '', content: '', tags: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('write'); // 'write' | 'history'

  const fetchDiaries = useCallback(async () => {
    try {
      const r = await API.get('/diary/mood');
      setDiaries(r.data);
    } catch {}
  }, []);

  const fetchDay = useCallback(async (date) => {
    try {
      const r = await API.get(`/diary/mood/${date}`);
      setCurrent(r.data);
      if (r.data) {
        setForm({ mood: r.data.mood, weather: r.data.weather || '', content: r.data.content || '', tags: r.data.tags?.join(', ') || '' });
        setEditing(false);
      } else {
        setForm({ mood: '', weather: '', content: '', tags: '' });
        setEditing(true);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchDiaries(); fetchDay(selectedDate); }, []);

  const handleSave = async () => {
    if (!form.mood) { addToast('請選擇今天的心情', 'error'); return; }
    setSaving(true);
    try {
      const tags = form.tags.split(/[,，\s]+/).filter(Boolean);
      const r = await API.post('/diary/mood', {
        date: selectedDate, mood: form.mood, weather: form.weather,
        content: form.content, tags,
      });
      setCurrent(r.data.diary);
      setEditing(false);
      addToast('日記已儲存 ✨', 'success');
      fetchDiaries();
    } catch (e) { addToast(e.response?.data?.message || '儲存失敗', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('確定刪除這則日記？')) return;
    try {
      await API.delete(`/diary/mood/${id}`);
      setCurrent(null);
      setForm({ mood: '', weather: '', content: '', tags: '' });
      setEditing(true);
      addToast('已刪除', 'success');
      fetchDiaries();
    } catch { addToast('刪除失敗', 'error'); }
  };

  const moodMap = {};
  diaries.forEach(d => { moodMap[d.date] = d.mood; });

  return (
    <div>
      {/* 頂部切換 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[['write', '今日記錄'], ['history', '過往日記']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{
            fontFamily: "'Space Mono', monospace", fontSize: '0.63rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '0.5rem 0', background: 'none', border: 'none',
            borderBottom: `2px solid ${view === v ? 'var(--amber)' : 'transparent'}`,
            color: view === v ? 'var(--amber)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {view === 'write' && (
        <div>
          {/* 日期選擇 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <input type="date" value={selectedDate} max={today()}
              onChange={e => { setSelectedDate(e.target.value); fetchDay(e.target.value); }}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', padding: '0.5rem 0.8rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '2px', outline: 'none' }} />
            <span style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {formatDate(selectedDate)}
            </span>
          </div>

          {/* 寫入/檢視 */}
          {editing ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* 心情選擇 */}
              <div>
                <label className="form-label">今天的心情</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {MOODS.map(m => (
                    <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mood: m }))} title={MOOD_LABELS[m]} style={{
                      fontSize: '1.5rem', width: '44px', height: '44px', borderRadius: '8px',
                      background: form.mood === m ? 'rgba(200,169,110,0.2)' : 'var(--bg-3)',
                      border: `2px solid ${form.mood === m ? 'var(--amber)' : 'transparent'}`,
                      cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1,
                    }}>{m}</button>
                  ))}
                </div>
                {form.mood && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: 'var(--amber)', marginTop: '0.4rem', letterSpacing: '0.06em' }}>{MOOD_LABELS[form.mood]}</div>}
              </div>

              {/* 天氣 */}
              <div>
                <label className="form-label">今天的天氣（選填）</label>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {WEATHERS.map(w => (
                    <button key={w} type="button" onClick={() => setForm(f => ({ ...f, weather: f.weather === w ? '' : w }))} style={{
                      fontSize: '1.3rem', width: '40px', height: '40px', borderRadius: '8px',
                      background: form.weather === w ? 'rgba(200,169,110,0.15)' : 'var(--bg-3)',
                      border: `2px solid ${form.weather === w ? 'var(--amber)' : 'transparent'}`,
                      cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1,
                    }}>{w}</button>
                  ))}
                </div>
              </div>

              {/* 內容 */}
              <div>
                <label className="form-label">寫下今天的故事</label>
                <textarea className="form-textarea" rows={6} placeholder="今天發生了什麼？有什麼感受？想記錄下來的事..."
                  value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ marginTop: '0.4rem' }} />
              </div>

              {/* 標籤 */}
              <div>
                <label className="form-label">關鍵字標籤（逗號分隔）</label>
                <input className="form-input" placeholder="例：工作、家人、咖啡" value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={{ marginTop: '0.4rem' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.7rem' }}>
                <button className="submit-btn" onClick={handleSave} disabled={saving} style={{ maxWidth: '160px' }}>
                  {saving ? '儲存中...' : '儲存日記'}
                </button>
                {current && <button type="button" onClick={() => setEditing(false)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', padding: '0.78rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>取消</button>}
              </div>
            </div>
          ) : current ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{current.mood}</span>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: 'var(--amber)', letterSpacing: '0.06em' }}>{MOOD_LABELS[current.mood]}</div>
                    {current.weather && <div style={{ fontSize: '1rem', marginTop: '0.2rem' }}>{current.weather}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setEditing(true)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', padding: '0.3rem 0.7rem', background: 'none', border: '1px solid var(--border)', color: 'var(--amber)', borderRadius: '2px', cursor: 'pointer' }}>編輯</button>
                  <button onClick={() => handleDelete(current._id)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', padding: '0.3rem 0.7rem', background: 'none', border: '1px solid var(--border)', color: 'var(--rose)', borderRadius: '2px', cursor: 'pointer' }}>刪除</button>
                </div>
              </div>
              {current.content && (
                <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.9rem', lineHeight: 2, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{current.content}</div>
              )}
              {current.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {current.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em' }}>
              這一天還沒有記錄<br />
              <button onClick={() => setEditing(true)} style={{ marginTop: '1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', padding: '0.5rem 1.2rem', background: 'rgba(200,169,110,0.12)', border: '1px solid var(--amber-dim)', color: 'var(--amber)', borderRadius: '2px', cursor: 'pointer' }}>開始記錄</button>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div>
          {diaries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.72rem' }}>還沒有任何日記記錄</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              {diaries.map(d => (
                <div key={d._id} onClick={() => { setSelectedDate(d.date); fetchDay(d.date); setView('write'); }} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.9rem 1.2rem', background: 'var(--surface)', cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                >
                  <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{d.mood}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.2rem', letterSpacing: '0.04em' }}>
                      {formatDate(d.date)} {d.weather}
                    </div>
                    {d.content && (
                      <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.82rem', color: 'var(--text-dim)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {d.content.slice(0, 60)}{d.content.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </div>
                  {d.tags?.length > 0 && (
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {d.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 寫給未來的信 ── */
function FutureLetters({ API }) {
  const { addToast } = useToast();
  const [letters, setLetters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', openDate: '', mood: '' });
  const [saving, setSaving] = useState(false);
  const [openedLetter, setOpenedLetter] = useState(null);

  const fetchLetters = useCallback(async () => {
    try {
      const r = await API.get('/diary/future');
      setLetters(r.data);
    } catch {}
  }, []);

  useEffect(() => { fetchLetters(); }, []);

  // 最短開封日期（明天）
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  const handleSend = async () => {
    if (!form.title || !form.content || !form.openDate) { addToast('請填寫完整', 'error'); return; }
    setSaving(true);
    try {
      await API.post('/diary/future', form);
      addToast('信件已封存，等待時間到來 📮', 'success');
      setShowForm(false);
      setForm({ title: '', content: '', openDate: '', mood: '' });
      fetchLetters();
    } catch (e) { addToast(e.response?.data?.message || '儲存失敗', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('確定刪除這封信？')) return;
    try {
      await API.delete(`/diary/future/${id}`);
      addToast('已刪除', 'success');
      setOpenedLetter(null);
      fetchLetters();
    } catch { addToast('刪除失敗', 'error'); }
  };

  const pending = letters.filter(l => !l.opened);
  const opened = letters.filter(l => l.opened);

  return (
    <div>
      {/* 新增按鈕 */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{
          width: '100%', padding: '1rem',
          background: 'rgba(200,169,110,0.08)',
          border: '1px dashed var(--amber-dim)',
          borderRadius: '6px', cursor: 'pointer',
          fontFamily: "'Space Mono', monospace", fontSize: '0.68rem',
          color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase',
          transition: 'all 0.2s', marginBottom: '1.5rem',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,169,110,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,169,110,0.08)'}
        >+ 寫一封給未來自己的信</button>
      )}

      {/* 寫信表單 */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1rem', color: 'var(--text)', letterSpacing: '0.04em' }}>寫給未來的自己</div>

          <div>
            <label className="form-label">信件標題</label>
            <input className="form-input" placeholder="例：親愛的一年後的自己" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ marginTop: '0.4rem' }} />
          </div>

          <div>
            <label className="form-label">預計開封日期</label>
            <input type="date" min={minDateStr} value={form.openDate}
              onChange={e => setForm(f => ({ ...f, openDate: e.target.value }))}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', padding: '0.58rem 0.9rem', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '2px', outline: 'none', marginTop: '0.4rem', display: 'block' }} />
            {form.openDate && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--amber)', marginTop: '0.3rem', letterSpacing: '0.04em' }}>距今 {daysUntil(form.openDate)} 天後開封</div>}
          </div>

          <div>
            <label className="form-label">今天的心情（選填）</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {MOODS.map(m => (
                <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mood: f.mood === m ? '' : m }))} style={{
                  fontSize: '1.3rem', width: '38px', height: '38px', borderRadius: '6px',
                  background: form.mood === m ? 'rgba(200,169,110,0.2)' : 'var(--bg-3)',
                  border: `2px solid ${form.mood === m ? 'var(--amber)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">信件內容</label>
            <textarea className="form-textarea" rows={8}
              placeholder="親愛的未來的自己，你好嗎？&#10;&#10;現在的我想告訴你..."
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ marginTop: '0.4rem' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.7rem' }}>
            <button className="submit-btn" onClick={handleSend} disabled={saving} style={{ maxWidth: '160px' }}>
              {saving ? '封存中...' : '📮 封存信件'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', padding: '0.78rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>取消</button>
          </div>
        </div>
      )}

      {/* 未開封 */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>📮 封存中 ({pending.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {pending.map(l => (
              <div key={l._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.75 }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>📩</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.2rem' }}>{l.title}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--amber)', letterSpacing: '0.04em' }}>
                    {formatDate(l.openDate)} 開封 · 還有 {daysUntil(l.openDate)} 天
                  </div>
                </div>
                <button onClick={() => handleDelete(l._id)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--rose)', cursor: 'pointer', borderRadius: '2px', padding: '0.2rem 0.5rem', fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', flexShrink: 0 }}>刪除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已開封 */}
      {opened.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>💌 已開封 ({opened.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {opened.map(l => (
              <div key={l._id}>
                <div onClick={() => setOpenedLetter(openedLetter?._id === l._id ? null : l)} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1rem 1.2rem',
                  display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                >
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{l.mood || '💌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.2rem' }}>{l.title}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                      寫於 {formatDate(l.createdAt)} · 開封於 {formatDate(l.openDate)}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>{openedLetter?._id === l._id ? '▲' : '▼'}</span>
                </div>

                {openedLetter?._id === l._id && (
                  <div style={{ background: 'rgba(15,31,61,0.4)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '1.5rem' }}>
                    <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.9rem', lineHeight: 2, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{l.content}</div>
                    <button onClick={() => handleDelete(l._id)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', padding: '0.3rem 0.7rem', background: 'none', border: '1px solid var(--border)', color: 'var(--rose)', borderRadius: '2px', cursor: 'pointer' }}>刪除</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {letters.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.08em' }}>
          還沒有寫給未來自己的信<br />
          <span style={{ opacity: 0.5 }}>時間是最誠實的見證者</span>
        </div>
      )}
    </div>
  );
}

/* ── 主頁面 ── */
export default function DiaryPage() {
  const { user, API } = useAuth();
  const [tab, setTab] = useState('mood');

  if (!user) return <Navigate to="/" replace />;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* 標題 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--amber)', opacity: 0.7, marginBottom: '0.5rem' }}>私密空間</div>
        <h1 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.6rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.06em' }}>
          我的日記
        </h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', letterSpacing: '0.04em', lineHeight: 1.8 }}>
          只有你自己看得見的角落
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.8rem' }}>
        {[['mood', '📅 心情日記'], ['future', '📮 寫給未來']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            fontFamily: "'Space Mono', monospace", fontSize: '0.63rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '0.7rem 0', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === v ? 'var(--amber)' : 'transparent'}`,
            color: tab === v ? 'var(--amber)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'mood'   && <MoodDiary API={API} />}
      {tab === 'future' && <FutureLetters API={API} />}
    </div>
  );
}
