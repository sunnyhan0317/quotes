import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const MOOD_LABELS = {
  '😄': '很棒', '😊': '不錯', '😐': '普通', '😔': '低落',
  '😢': '難過', '😡': '生氣', '😴': '疲憊', '🤔': '思考',
  '✨': '靈感', '💪': '充能',
};

const MOOD_COLORS = {
  '😄': '#ffd93d', '😊': '#6bcb77', '😐': '#a8b4c8', '😔': '#8aaddf',
  '😢': '#6c9bd2', '😡': '#e63946', '😴': '#9b72cf', '🤔': '#c8a96e',
  '✨': '#f4e04d', '💪': '#f4a261',
};

const MOOD_GROUPS = {
  positive: ['😄', '😊', '✨', '💪'],
  neutral:  ['😐', '🤔'],
  negative: ['😔', '😢', '😡', '😴'],
};

/* 大型 emoji 泡泡 */
function MoodBubbles({ todayMoods, todayTotal }) {
  if (todayTotal === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem' }}>
      今天還沒有人記錄心情
    </div>
  );

  const sorted = Object.entries(todayMoods).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem 0' }}>
      {sorted.map(([mood, count]) => {
        const pct = count / max;
        const size = 48 + pct * 52; // 48~100px
        const userPct = Math.round((count / todayTotal) * 100);
        return (
          <div key={mood} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{
              width: size, height: size, borderRadius: '50%',
              background: `${MOOD_COLORS[mood]}20`,
              border: `2px solid ${MOOD_COLORS[mood]}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: size * 0.44,
              transition: 'all 0.5s ease',
              boxShadow: `0 0 ${pct * 20}px ${MOOD_COLORS[mood]}30`,
            }}>
              {mood}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.56rem', color: MOOD_COLORS[mood], opacity: 0.8 }}>
              {userPct}%
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              {MOOD_LABELS[mood]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 正/負/中 比例條 */
function SentimentBar({ todayMoods, todayTotal }) {
  if (todayTotal === 0) return null;

  const pos = MOOD_GROUPS.positive.reduce((a, m) => a + (todayMoods[m] || 0), 0);
  const neu = MOOD_GROUPS.neutral.reduce((a, m) => a + (todayMoods[m] || 0), 0);
  const neg = MOOD_GROUPS.negative.reduce((a, m) => a + (todayMoods[m] || 0), 0);
  const pPos = Math.round((pos / todayTotal) * 100);
  const pNeu = Math.round((neu / todayTotal) * 100);
  const pNeg = 100 - pPos - pNeu;

  const dominant = pos >= neg && pos >= neu ? 'positive'
    : neg >= pos && neg >= neu ? 'negative' : 'neutral';

  const dominantText = {
    positive: '今天社群整體情緒偏向正面 ✨',
    negative: '今天社群情緒偏低，你不是一個人 🌙',
    neutral:  '今天社群情緒平靜而穩定 🌊',
  }[dominant];

  return (
    <div>
      <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.6rem' }}>
        <div style={{ width: `${pPos}%`, background: '#6bcb77', transition: 'width 1s ease' }} />
        <div style={{ width: `${pNeu}%`, background: '#a8b4c8', transition: 'width 1s ease' }} />
        <div style={{ width: `${pNeg}%`, background: '#8aaddf', transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.8rem' }}>
        {[['正向', pPos, '#6bcb77'], ['中性', pNeu, '#a8b4c8'], ['低落', pNeg, '#8aaddf']].map(([l, p, c]) => (
          <span key={l} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: c }}>
            {l} {p}%
          </span>
        ))}
      </div>
      <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
        {dominantText}
      </div>
    </div>
  );
}

/* 7天折線圖 */
function MoodTrend({ byDate }) {
  const dates = Object.keys(byDate).sort().slice(-7);
  if (dates.length === 0) return null;

  // 每天計算「正面指數」= (正面 - 負面) / 總數 * 100，範圍 -100~100
  const points = dates.map(date => {
    const d = byDate[date] || {};
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    if (total === 0) return { date, score: 0, total: 0 };
    const pos = MOOD_GROUPS.positive.reduce((a, m) => a + (d[m] || 0), 0);
    const neg = MOOD_GROUPS.negative.reduce((a, m) => a + (d[m] || 0), 0);
    const score = Math.round(((pos - neg) / total) * 100);
    return { date, score, total };
  });

  const W = 560, H = 120, PAD = 20;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  // score: -100~100 → y
  const scoreToY = (s) => PAD + (innerH / 2) - (s / 100) * (innerH / 2);
  const idxToX = (i) => PAD + (i / Math.max(points.length - 1, 1)) * innerW;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${idxToX(i)} ${scoreToY(p.score)}`).join(' ');
  const areaD = `${pathD} L ${idxToX(points.length - 1)} ${scoreToY(0)} L ${idxToX(0)} ${scoreToY(0)} Z`;

  const formatDate = (d) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
        近 7 天情緒走勢（正面指數）
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
          {/* 零線 */}
          <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="4 4" />
          {/* 填充區 */}
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6bcb77" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6bcb77" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#moodGrad)" />
          {/* 折線 */}
          <path d={pathD} fill="none" stroke="#6bcb77" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* 點 */}
          {points.map((p, i) => (
            <g key={p.date}>
              <circle cx={idxToX(i)} cy={scoreToY(p.score)} r={4} fill="#6bcb77" stroke="var(--bg)" strokeWidth={2} />
              <text x={idxToX(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)"
                style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px' }}>
                {formatDate(p.date)}
              </text>
            </g>
          ))}
          {/* Y 軸標籤 */}
          <text x={PAD - 4} y={PAD + 4} textAnchor="end" fill="rgba(255,255,255,0.2)"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px' }}>+100</text>
          <text x={PAD - 4} y={H / 2 + 4} textAnchor="end" fill="rgba(255,255,255,0.2)"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px' }}>0</text>
          <text x={PAD - 4} y={H - PAD + 4} textAnchor="end" fill="rgba(255,255,255,0.2)"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px' }}>-100</text>
        </svg>
      </div>

      {/* 每日人數 */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', justifyContent: 'space-around' }}>
        {points.map(p => (
          <div key={p.date} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.75rem', color: p.score > 0 ? '#6bcb77' : p.score < 0 ? '#8aaddf' : 'var(--text-muted)' }}>
              {p.score > 0 ? '+' : ''}{p.score}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: 'var(--text-muted)', opacity: 0.5 }}>
              {p.total}人
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 主頁面 */
export default function MoodMapPage() {
  const { API } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  const fetchData = async (days) => {
    setLoading(true);
    try {
      const r = await API.get(`/analytics/mood-map?days=${days}`);
      setData(r.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(range); }, [range]);

  const card = (extra = {}) => ({
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1.5rem',
    ...extra,
  });

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* 頁頭 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--amber)', opacity: 0.7, marginBottom: '0.5rem' }}>
          匿名 · 即時統計
        </div>
        <h1 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.06em' }}>
          社群情緒地圖
        </h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', letterSpacing: '0.04em', lineHeight: 1.8 }}>
          你不孤單。看看今天大家的心情。
        </p>
      </div>

      {loading ? <div className="loading">讀取情緒資料中</div> : !data ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.7rem' }}>
          載入失敗，請稍後再試
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* 今日參與人數 */}
          <div style={{ display: 'flex', gap: '1.2rem' }}>
            <div style={{ ...card(), flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '2.5rem', fontWeight: 300, color: 'var(--amber)', lineHeight: 1 }}>
                {data.todayTotal}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                今日記錄人數
              </div>
            </div>
            <div style={{ ...card(), flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '2.5rem', fontWeight: 300, color: 'var(--text)', lineHeight: 1 }}>
                {data.totalParticipants}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                近 {range} 天參與人數
              </div>
            </div>
          </div>

          {/* 今日情緒泡泡 */}
          <div style={card()}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              今日情緒分布
            </div>
            <MoodBubbles todayMoods={data.todayMoods} todayTotal={data.todayTotal} />
          </div>

          {/* 情緒傾向 */}
          {data.todayTotal > 0 && (
            <div style={card()}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                今日情緒傾向
              </div>
              <SentimentBar todayMoods={data.todayMoods} todayTotal={data.todayTotal} />
            </div>
          )}

          {/* 7天走勢 */}
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>趨勢分析</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => setRange(d)} style={{
                    fontFamily: "'Space Mono', monospace", fontSize: '0.58rem',
                    padding: '0.2rem 0.5rem', borderRadius: '3px',
                    background: range === d ? 'var(--amber)' : 'none',
                    border: `1px solid ${range === d ? 'var(--amber)' : 'var(--border)'}`,
                    color: range === d ? 'var(--bg)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>{d}天</button>
                ))}
              </div>
            </div>
            <MoodTrend byDate={data.byDate} />
          </div>

          {/* 記錄提示 */}
          <div style={{
            ...card(),
            background: 'rgba(200,169,110,0.06)',
            border: '1px solid rgba(200,169,110,0.2)',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>📓</span>
            <div>
              <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                記錄你的心情，加入地圖
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                在日記頁面記錄今日心情，就會匿名出現在這裡
              </div>
            </div>
            <a href="/diary" style={{
              flexShrink: 0,
              fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '0.4rem 0.8rem',
              background: 'rgba(200,169,110,0.15)', border: '1px solid var(--amber-dim)',
              color: 'var(--amber)', borderRadius: '3px', textDecoration: 'none',
              transition: 'all 0.15s',
            }}>前往記錄</a>
          </div>
        </div>
      )}
    </div>
  );
}
