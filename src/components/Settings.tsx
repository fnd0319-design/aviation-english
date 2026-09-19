import { useState } from 'react';
import { setApiKey as saveApiKey, getApiKey } from '../services/aiService';

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
    <div style={{ maxWidth: '450px', margin: '100px auto', padding: '30px', backgroundColor: 'var(--secondary-color)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
      <h2 style={{ color: 'var(--highlight-color)', textAlign: 'center', marginBottom: '20px' }}>Aviation English Practice</h2>
      <p style={{ fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>
        Please enter your Gemini API Key to initialize the AI examiner. 
        Your key is stored securely in your browser's local storage.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="password" 
          value={key} 
          onChange={(e) => setKey(e.target.value)} 
          placeholder="AIzaSy..."
          style={{ padding: '12px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#111', color: '#fff' }}
          required
        />
        <button type="submit" style={{ padding: '12px', fontSize: '1.1rem' }}>Save & Start</button>
      </form>
    </div>
  );
}
