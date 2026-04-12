import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AIPanel({ onGenerated, onAuthRequired }) {
  const [form, setForm] = useState({ theme: '', mood: '正向激勵', style: '哲理', language: 'zh' });
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const { user, API } = useAuth();
  const { addToast } = useToast();

  const handleGenerate = async () => {
    if (!user) { onAuthRequired(); return; }
    setLoading(true);
    try {
      const r = await API.post('/ai/generate', form);
      setLastGenerated(r.data.quote);
      onGenerated?.(r.data.quote);
      addToast('✦ AI 語錄已生成並加入語錄庫！', 'success');
    } catch (e) {
      addToast(e.response?.data?.message || 'AI 生成失敗，請稍後再試', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <h3>✦ AI 語錄生成器</h3>
      <p>輸入你想要的語錄主題，讓 AI 為你創作獨特的語錄，並自動加入語錄庫</p>

      <div className="ai-input-grid">
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)', marginBottom: '0.4rem' }}>
            主題 / 靈感
          </div>
          <input
            className="form-input"
            style={{ background: 'rgba(245,240,232,0.1)', border: '1px solid rgba(245,240,232,0.15)', color: 'var(--paper)', width: '100%' }}
            placeholder="例：孤獨、時間、勇氣..."
            value={form.theme}
            onChange={e => setForm({ ...form, theme: e.target.value })}
          />
        </div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)', marginBottom: '0.4rem' }}>
            情緒基調
          </div>
          <select className="ai-select" value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })}>
            <option>正向激勵</option>
            <option>沉思冥想</option>
            <option>憂鬱詩意</option>
            <option>幽默睿智</option>
            <option>超然豁達</option>
          </select>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)', marginBottom: '0.4rem' }}>
            語言風格
          </div>
          <select className="ai-select" value={form.style} onChange={e => setForm({ ...form, style: e.target.value })}>
            <option>哲理</option>
            <option>詩意</option>
            <option>簡潔有力</option>
            <option>文學性</option>
            <option>禪意</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="ai-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? '✦ 生成中...' : '✦ 生成語錄'}
        </button>
        <select className="ai-select" style={{ width: 'auto' }} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
          <option value="zh">繁體中文</option>
          <option value="en">English</option>
        </select>
        {!user && (
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)' }}>
            * 需要登入才能使用
          </span>
        )}
      </div>

      {lastGenerated && (
        <div style={{
          marginTop: '1.5rem', padding: '1.2rem',
          background: 'rgba(245,240,232,0.07)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '2px'
        }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--gold-light)', marginBottom: '0.6rem' }}>
            ✦ 最新生成
          </div>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--paper)' }}>
            「{lastGenerated.content}」
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: 'rgba(245,240,232,0.4)', marginTop: '0.5rem' }}>
            — {lastGenerated.author}
          </div>
        </div>
      )}
    </div>
  );
}
