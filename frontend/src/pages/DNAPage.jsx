import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PERSONALITY_DESC = {
  '人生哲學家':   { desc: '你在意生命的深度，喜歡在文字中尋找存在的意義', color: '#7c6fff', icon: '🧿' },
  '成長探索者':   { desc: '你渴望進步，每一句觸動你的話都指向一個更好的自己', color: '#4ecdc4', icon: '🌱' },
  '浪漫主義者':   { desc: '你感受力豐富，文字對你來說是情感的容器', color: '#ff6b9d', icon: '🌹' },
  '深思者':       { desc: '你不怕孤獨，因為那是你與自己對話的空間', color: '#a8b4c8', icon: '🌙' },
  '理想追求者':   { desc: '你相信未來，夢想對你來說是真實存在的方向', color: '#ffd93d', icon: '✨' },
  '靈魂流浪者':   { desc: '你不被定義，每一次閱讀都是一次不同的旅程', color: '#c8a96e', icon: '🪶' },
  '時間感知者':   { desc: '你對時間的流逝特別敏感，懂得珍惜當下', color: '#f4a261', icon: '⏳' },
  '存在主義者':   { desc: '你直視生命的本質，不迴避深刻的命題', color: '#6c757d', icon: '🕯' },
  '勇者':         { desc: '你欣賞勇氣，那些讓你停下來的話都帶著力量', color: '#e63946', icon: '⚔️' },
  '智慧探索者':   { desc: '你收集智慧，像一位靜默的學者', color: '#457b9d', icon: '📚' },
  '自然崇拜者':   { desc: '你在自然的節奏中找到共鳴', color: '#2d6a4f', icon: '🌿' },
  '藝術靈魂':     { desc: '你以美學的眼光看待世界，語言對你是一種藝術', color: '#e07a5f', icon: '🎨' },
  '文字魔法師':   { desc: '你深信文字有改變人心的力量', color: '#9b72cf', icon: '✒️' },
  '哲學思考者':   { desc: '你思考那些沒有答案的問題，並享受這個過程', color: '#3d405b', icon: '🔍' },
  '溫柔療癒者':   { desc: '你被溫柔打動，也用溫柔影響他人', color: '#f2cc8f', icon: '🌸' },
  '獨特的語錄收藏家': { desc: '你的品味難以被定義，這正是你最珍貴的地方', color: '#c8a96e', icon: '💎' },
};

/* 環形進度條 */
function RingProgress({ value, max = 100, size = 90, color = '#c8a96e', label, sublabel }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / max) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ marginTop: `-${size * 0.72}px`, textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: size * 0.22, color: 'var(--text)', lineHeight: 1 }}>{label}</div>
        {sublabel && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: size * 0.12, color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sublabel}</div>}
      </div>
      <div style={{ height: size * 0.72 }} />
    </div>
  );
}

/* 標籤雲 */
function TagCloud({ tags }) {
  const max = tags[0]?.count || 1;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {tags.map(({ tag, count }) => {
        const scale = 0.7 + (count / max) * 0.6;
        const opacity = 0.5 + (count / max) * 0.5;
        return (
          <span key={tag} style={{
            fontFamily: "'Noto Serif TC', serif",
            fontSize: `${scale}rem`,
            color: `rgba(200,169,110,${opacity})`,
            padding: '0.2rem 0.5rem',
            border: `1px solid rgba(200,169,110,${opacity * 0.4})`,
            borderRadius: '20px',
            transition: 'all 0.2s',
            cursor: 'default',
          }}>
            #{tag} <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6em', opacity: 0.6 }}>{count}</span>
          </span>
        );
      })}
    </div>
  );
}

/* 長條比例 */
function BarCompare({ labelA, valueA, labelB, valueB, colorA, colorB }) {
  const total = valueA + valueB || 1;
  const pctA = Math.round((valueA / total) * 100);
  return (
    <div>
      <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ width: `${pctA}%`, background: colorA, transition: 'width 1s ease' }} />
        <div style={{ flex: 1, background: colorB, transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: colorA }}>{labelA} {pctA}%</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: colorB }}>{labelB} {100 - pctA}%</span>
      </div>
    </div>
  );
}

export default function DNAPage() {
  const { user, API } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!user) return <Navigate to="/" replace />;

  useEffect(() => {
    API.get('/analytics/dna')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const card = (extra = {}) => ({
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '1.6rem',
    ...extra,
  });

  if (loading) return (
    <div style={{ maxWidth: '700px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <div className="loading">分析語錄 DNA 中</div>
    </div>
  );

  if (!data || data.insufficient) return (
    <div style={{ maxWidth: '700px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧬</div>
      <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.8rem' }}>資料還不夠</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 2, letterSpacing: '0.04em' }}>
        至少需要 3 則收藏或按讚的語錄<br />
        才能分析你的語錄 DNA<br />
        目前：{data?.count || 0} / 3 則
      </div>
    </div>
  );

  const pInfo = PERSONALITY_DESC[data.personality] || PERSONALITY_DESC['獨特的語錄收藏家'];

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* 頁頭 */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--amber)', opacity: 0.7, marginBottom: '0.5rem' }}>
          基於 {data.stats.totalEngaged} 則互動語錄
        </div>
        <h1 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.06em' }}>
          你的語錄 DNA
        </h1>
      </div>

      {/* 人格卡 */}
      <div style={{
        ...card(),
        background: `linear-gradient(135deg, ${pInfo.color}18, ${pInfo.color}08)`,
        border: `1px solid ${pInfo.color}30`,
        marginBottom: '1.2rem',
        display: 'flex', alignItems: 'center', gap: '1.5rem',
      }}>
        <div style={{ fontSize: '3.5rem', flexShrink: 0, lineHeight: 1 }}>{pInfo.icon}</div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: pInfo.color, marginBottom: '0.4rem', opacity: 0.8 }}>你的語錄人格</div>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>{data.personality}</div>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>{pInfo.desc}</div>
        </div>
      </div>

      {/* 稀有度 + 統計 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>

        {/* 稀有度 */}
        <div style={card({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' })}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>品味稀有度</div>
          <RingProgress value={data.rarityScore} max={100} size={100} color={pInfo.color}
            label={`${data.rarityScore}`} sublabel="/ 100" />
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {data.rarityScore >= 80 ? '極為獨特' : data.rarityScore >= 60 ? '品味鮮明' : data.rarityScore >= 40 ? '漸趨成形' : '持續探索中'}
          </div>
        </div>

        {/* 數字統計 */}
        <div style={card()}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>我的數字</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
              { label: '收藏語錄', value: data.stats.savedCount, color: 'var(--amber)' },
              { label: '按讚語錄', value: data.stats.likedCount, color: 'var(--rose)' },
              { label: '我的投稿', value: data.stats.myQuotesCount, color: '#6abf80' },
              { label: '通過審核', value: data.stats.approvedCount, color: '#8aaddf' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.1rem', color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 標籤雲 */}
      {data.topTags.length > 0 && (
        <div style={{ ...card(), marginBottom: '1.2rem' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            你最共鳴的主題
          </div>
          <TagCloud tags={data.topTags} />
        </div>
      )}

      {/* 語句長度偏好 */}
      <div style={{ ...card(), marginBottom: '1.2rem' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>語句長度偏好</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '1.8rem', color: 'var(--amber)' }}>
            {data.preferences.lengthPref}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            平均 {data.preferences.avgLength} 字
          </div>
        </div>
        <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.5rem', lineHeight: 1.8 }}>
          {data.preferences.lengthPref === '精煉簡短' ? '你喜歡一語中的，字字有力'
            : data.preferences.lengthPref === '適中平衡' ? '你享受剛好的分量，不多不少'
            : '你沉浸在綿延的文字河流中'}
        </div>
      </div>

      {/* 最愛作者 */}
      {data.topAuthors.length > 0 && (
        <div style={card({ marginBottom: '1.2rem' })}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            你最常共鳴的作者
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {data.topAuthors.map(({ author, count }, i) => (
              <div key={author} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--text-muted)', width: '1.2rem', textAlign: 'right' }}>{i + 1}</span>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / data.topAuthors[0].count) * 100}%`, background: 'var(--amber)', borderRadius: '2px', transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.85rem', color: 'var(--text)', minWidth: '80px' }}>{author}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--text-muted)' }}>×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部提示 */}
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 2, opacity: 0.6 }}>
        DNA 根據你的收藏與按讚即時分析<br />
        持續探索，你的語錄人格將會更加清晰
      </div>
    </div>
  );
}
