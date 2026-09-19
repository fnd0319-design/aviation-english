import { useState, useEffect } from 'react';
import { Settings } from './components/Settings';
import { TopPage } from './components/TopPage';
import { PracticeRoom } from './components/PracticeRoom';
import { getApiKey } from './services/aiService';
import { FeedbackModal } from './components/FeedbackModal';
import { MessageSquare } from 'lucide-react';
import './App.css';

function App() {
  const [hasKey, setHasKey] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    if (getApiKey()) {
      setHasKey(true);
    }
  }, []);

  return (
    <div className="app-container">
      {!hasKey ? (
        <Settings onSave={() => setHasKey(true)} />
      ) : !selectedTest ? (
        <TopPage onSelectTest={(testName) => setSelectedTest(testName)} />
      ) : (
        <PracticeRoom testMode={selectedTest} onGoBack={() => setSelectedTest(null)} />
      )}

      {/* 常に表示されるフローティングアンケートボタン */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        style={{
          position: 'fixed',
          bottom: '25px',
          left: '25px',
          backgroundColor: '#e67e22',
          color: '#fff',
          borderRadius: '30px',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          zIndex: 999,
          cursor: 'pointer',
          border: '2px solid rgba(255,255,255,0.2)',
          transition: 'transform 0.2s',
          fontSize: '1rem'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <MessageSquare size={20} />
        不具合・ご意見等フィードバック
      </button>

      {/* フィードバックモーダル */}
      {isFeedbackOpen && (
        <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />
      )}
    </div>
  );
}

export default App;
