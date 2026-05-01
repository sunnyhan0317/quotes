import { useState, useRef, useEffect } from 'react';

const THEMES = [
  { id: 'midnight',  label: '午夜藍', bg: '#0f1f3d', text: '#e8e4dc', accent: '#c8a96e', sub: '#6b8fce' },
  { id: 'ink',       label: '水墨黑', bg: '#111111', text: '#f0ece4', accent: '#d4b896', sub: '#555555' },
  { id: 'forest',    label: '森林綠', bg: '#1a2e1a', text: '#e8f0e8', accent: '#8fbf8f', sub: '#4a7c4a' },
  { id: 'wine',      label: '酒紅暗', bg: '#2a1018', text: '#f0e8e8', accent: '#c87878', sub: '#8a3a4a' },
  { id: 'dusk',      label: '黃昏橙', bg: '#1e1508', text: '#f0ead8', accent: '#d4963c', sub: '#7a5a1a' },
  { id: 'lavender',  label: '薰衣紫', bg: '#1a1530', text: '#ece8f8', accent: '#a08acc', sub: '#5a4a8a' },
  { id: 'paper',     label: '米白紙', bg: '#f5f0e8', text: '#1a1208', accent: '#8b4513', sub: '#8a7f6e' },
  { id: 'fog',       label: '霧灰藍', bg: '#1a2028', text: '#d8e0e8', accent: '#7a98b8', sub: '#445566' },
];

const FONTS = [
  { id: 'serif',  label: '宋體',  family: 'Noto Serif TC, serif' },
  { id: 'mono',   label: '等寬',  family: 'Space Mono, monospace' },
];

/* 截斷文字 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 8) {
  const chars = text.split('');
  let line = '';
  let lines = [];

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      lines.push(line);
      line = chars[i];
      if (lines.length >= maxLines) { lines[maxLines - 1] += '...'; break; }
    } else {
      line = testLine;
    }
  }
  if (lines.length < maxLines) lines.push(line);

  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

export default function PosterModal({ quote, onClose }) {
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [font, setFont] = useState(FONTS[0]);
  const [showWatermark, setShowWatermark] = useState(true);
  const [rendered, setRendered] = useState(false);

  const W = 800, H = 800;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    const PAD = 72;
    const innerW = W - PAD * 2;

    // 背景
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    // 紙張質感（細微噪點）
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const alpha = Math.random() * 0.04;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // 左側裝飾線
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PAD, PAD + 10);
    ctx.lineTo(PAD, H - PAD - 10);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 大引號裝飾
    ctx.font = `bold 200px Georgia, serif`;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.07;
    ctx.fillText('"', W - PAD - 120, PAD + 160);
    ctx.globalAlpha = 1;

    // 來源小標
    ctx.font = `12px Space Mono, monospace`;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.6;
    ctx.fillText('語 境', PAD + 16, PAD + 20);
    ctx.globalAlpha = 1;

    // 語錄內容
    const contentX = PAD + 22;
    let contentY = PAD + 80;

    // 動態字體大小：根據內容長度調整
    const contentLen = quote.content.length;
    const fontSize = contentLen < 30 ? 38
      : contentLen < 60 ? 32
      : contentLen < 100 ? 26
      : 22;

    ctx.font = `${fontSize}px ${font.family}`;
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.92;

    const lineH = fontSize * 1.85;
    const linesCount = wrapText(ctx, quote.content, contentX, contentY, innerW - 30, lineH, 10);
    contentY += linesCount * lineH + 40;
    ctx.globalAlpha = 1;

    // 分隔線
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentX, contentY);
    ctx.lineTo(contentX + 60, contentY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    contentY += 28;

    // 作者
    ctx.font = `14px Space Mono, monospace`;
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.75;
    ctx.fillText(`— ${quote.author || '匿名'}`, contentX, contentY);
    ctx.globalAlpha = 1;

    // 標籤
    if (quote.tags?.length > 0) {
      contentY += 36;
      ctx.font = `11px Space Mono, monospace`;
      ctx.fillStyle = theme.sub;
      ctx.globalAlpha = 0.6;
      ctx.fillText(quote.tags.map(t => `#${t}`).join('  '), contentX, contentY);
      ctx.globalAlpha = 1;
    }

    // 底部水印
    if (showWatermark) {
      ctx.font = `11px Space Mono, monospace`;
      ctx.fillStyle = theme.text;
      ctx.globalAlpha = 0.2;
      ctx.fillText('yu境 · quotes', PAD + 16, H - PAD + 8);
      ctx.globalAlpha = 1;
    }

    // 底部裝飾點
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(W - PAD - 20 - i * 14, H - PAD + 8, 3, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.15 + i * 0.07;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    setRendered(true);
  };

  useEffect(() => {
    // 等字體載入
    const timer = setTimeout(draw, 100);
    return () => clearTimeout(timer);
  }, [theme, font, showWatermark]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `語境_${quote.author || '語錄'}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        width: '100%', maxWidth: '900px',
        maxHeight: '92vh',
        display: 'flex', gap: 0,
        overflow: 'hidden',
      }}>

        {/* 左：預覽 */}
        <div style={{ flex: 1, background: 'var(--bg)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '4px', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
        </div>

        {/* 右：控制 */}
        <div style={{ width: '260px', flexShrink: 0, padding: '1.5rem', borderLeft: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.95rem', color: 'var(--text)' }}>生成海報</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>

          {/* 主題選擇 */}
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>主題配色</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t)} title={t.label} style={{
                  height: '32px', borderRadius: '4px',
                  background: t.bg,
                  border: `2px solid ${theme.id === t.id ? t.accent : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', right: '3px', bottom: '3px', width: '8px', height: '8px', borderRadius: '50%', background: t.accent }} />
                </button>
              ))}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--amber)', marginTop: '0.4rem', letterSpacing: '0.04em' }}>{theme.label}</div>
          </div>

          {/* 字體 */}
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>字體</div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {FONTS.map(f => (
                <button key={f.id} onClick={() => setFont(f)} style={{
                  flex: 1, padding: '0.4rem',
                  background: font.id === f.id ? 'rgba(200,169,110,0.15)' : 'var(--bg-3)',
                  border: `1px solid ${font.id === f.id ? 'var(--amber-dim)' : 'var(--border)'}`,
                  color: font.id === f.id ? 'var(--amber)' : 'var(--text-muted)',
                  borderRadius: '4px', cursor: 'pointer',
                  fontFamily: f.family, fontSize: '0.75rem',
                  transition: 'all 0.15s',
                }}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* 水印 */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <div
                onClick={() => setShowWatermark(s => !s)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px',
                  background: showWatermark ? 'var(--amber)' : 'var(--border-light)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: showWatermark ? '18px' : '3px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>顯示浮水印</span>
            </label>
          </div>

          {/* 語錄預覽 */}
          <div style={{ background: 'var(--bg-3)', borderRadius: '4px', padding: '0.8rem', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '0.4rem',
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {quote.content}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: 'var(--text-muted)' }}>— {quote.author}</div>
          </div>

          {/* 下載按鈕 */}
          <button
            onClick={handleDownload}
            style={{
              width: '100%', padding: '0.85rem',
              background: 'var(--amber)', color: 'var(--bg)',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: '0.7rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              transition: 'opacity 0.2s', marginTop: 'auto',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ↓ 下載海報
          </button>
        </div>
      </div>
    </div>
  );
}
