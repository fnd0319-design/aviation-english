import { useState } from 'react';
import { setApiKey as saveApiKey, getApiKey } from '../services/aiService';
import { Key, ExternalLink, ShieldCheck } from 'lucide-react';

export function Settings({ onSave }: { onSave: () => void }) {
  const [key, setKey] = useState(getApiKey() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      saveApiKey(key.trim());
      onSave();
    }
  };

  return (
    <div style={{
      maxWidth: '520px',
      margin: '40px auto',
      padding: '30px 24px',
      backgroundColor: 'var(--secondary-color, #1a2234)',
      borderRadius: '16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      color: '#f0f4f8',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(212, 160, 23, 0.15)', marginBottom: '10px' }}>
          <Key size={32} color="#d4a017" />
        </div>
        <h2 style={{ color: '#d4a017', fontSize: '1.4rem', margin: '5px 0' }}>
          航空英語能力試験 AI対策アプリ
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '6px 0 0' }}>
          AI試験官と音声で対話練習を行うための初期設定です
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#cbd5e1' }}>
          Gemini APIキーを入力してください（完全無料）
        </label>
        <input 
          type="text" 
          value={key} 
          onChange={(e) => setKey(e.target.value)} 
          placeholder="AIzaSy..."
          style={{
            padding: '14px',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            backgroundColor: '#0f172a',
            color: '#fff',
            outline: 'none',
            letterSpacing: '0.5px'
          }}
          required
        />
        <button 
          type="submit" 
          style={{
            padding: '14px',
            fontSize: '1.05rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#d4a017',
            color: '#0f172a',
            cursor: 'pointer',
            transition: 'background 0.2s',
            marginTop: '4px'
          }}
        >
          保存して練習を始める
        </button>
      </form>

      {/* 小学生でもわかるAPIキーの取得手順 */}
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155'
      }}>
        <h3 style={{
          fontSize: '1rem',
          margin: '0 0 15px',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📖</span> APIキーの取り方（1分・ずっと無料）
        </h3>
        
        <ol style={{
          margin: 0,
          paddingLeft: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          fontSize: '0.88rem',
          lineHeight: '1.6',
          color: '#e2e8f0'
        }}>
          <li>
            <strong>Google AI Studio を開く</strong>
            <div style={{ marginTop: '4px' }}>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#38bdf8',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 'bold'
                }}
              >
                👉 ここをクリックして開く <ExternalLink size={14} />
              </a>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>
                ※Googleアカウント（Gmail等）でログインしてください
              </span>
            </div>
          </li>

          <li>
            <strong>青いボタンを押す</strong>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              画面にある青いボタン <strong>「Create API key」</strong>（キーを作成）を押します。
            </div>
          </li>

          <li>
            <strong>キーをコピーする</strong>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              「Create API key in new project」を押すと、<strong>AIzaSy...</strong> から始まる長い文字が表示されます。横にある <strong>「Copy」</strong>（コピー）を押します。
            </div>
          </li>

          <li>
            <strong>この画面の上枠に貼ってスタート！</strong>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              コピーした文字を上の枠に貼り付けて、<strong>「保存して練習を始める」</strong> を押せば完了です！
            </div>
          </li>
        </ol>

        <div style={{
          marginTop: '15px',
          paddingTop: '12px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#10b981',
          fontSize: '0.8rem'
        }}>
          <ShieldCheck size={16} />
          <span>一度保存すれば、次回からはこの画面は出ずに直接練習できます。</span>
        </div>
      </div>
    </div>
  );
}
