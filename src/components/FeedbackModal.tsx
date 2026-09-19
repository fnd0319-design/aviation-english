import { useState } from 'react';
import { Send, X, Mail } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendApi = async () => {
    if (!feedback.trim()) return;
    setIsSending(true);
    
    try {
      // FormSubmit無料APIを使って、裏側で直接 fnd0319@gmail.com へメール送信する
      const response = await fetch("https://formsubmit.co/ajax/fnd0319@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            _subject: "【航空英語アプリ】アンケート・フィードバック",
            message: feedback
        })
      });

      if (response.ok) {
        alert("フィードバックを送信しました！ご協力ありがとうございます。");
        onClose();
      } else {
        alert("送信に失敗しました。時間をおいて再度お試しください。");
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#162447', borderRadius: '12px', padding: '30px', 
        width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px' }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{ color: 'var(--highlight-color)', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={24} /> フィードバック送信
        </h2>
        
        <p style={{ lineHeight: '1.6', marginBottom: '20px', color: '#e0e0e0', fontSize: '1.05rem' }}>
          この度は無料ベータ版をご使用いただき誠にありがとうございます。<br/>
          このアプリの不具合や、こういう機能をつけてほしいなどご意見があれば、コメントお願いします。<br/>
          今後のアップデートの参考にさせて頂きたいと思います。
        </p>
        
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="ここにご意見や不具合の内容をご記入ください..."
          style={{
            width: '100%', height: '180px', padding: '15px', borderRadius: '8px',
            border: '1px solid #444', backgroundColor: '#0b1320', color: '#fff',
            fontSize: '1.05rem', resize: 'vertical', marginBottom: '20px', boxSizing: 'border-box'
          }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            onClick={handleSendApi}
            disabled={!feedback.trim() || isSending}
            style={{ 
              padding: '10px 30px', backgroundColor: 'var(--success-color)', color: '#fff', 
              display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '6px', border: 'none',
              opacity: (!feedback.trim() || isSending) ? 0.5 : 1, cursor: (!feedback.trim() || isSending) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', fontSize: '1.05rem', letterSpacing: '2px'
            }}
          >
            <Send size={18} /> {isSending ? "送信中..." : "送信"}
          </button>

          <button onClick={onClose} disabled={isSending} style={{ padding: '10px 20px', backgroundColor: '#555', color: '#fff', borderRadius: '6px', cursor: 'pointer', border: 'none' }}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
