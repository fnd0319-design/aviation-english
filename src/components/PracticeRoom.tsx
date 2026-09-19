import { useState, useEffect } from 'react';
import { pictures } from '../data/pictures';
import { atcScenarios } from '../data/atcScenarios';
import { sequencePictures } from '../data/sequencePictures';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { chatWithExaminer, generateReviewQuestions, evaluateReviewAnswer } from '../services/aiService';
import type { ChatResponse, ReviewQuestion } from '../services/aiService';
import { SequenceImageDisplay } from './SequenceImageDisplay';
import { Mic, MicOff, CheckCircle, Plane, XCircle, PlayCircle, PauseCircle } from 'lucide-react';

type Phase = 
  | 'select' 
  | 'setup' 
  | 'p1_prompt' 
  | 'p1_record' 
  | 'p2_prompt' 
  | 'p2_record' 
  | 'p3_prompt' 
  | 'p3_record' 
  | 'eval_display'
  | 'review_drill'
  | 'cooldown'
  | 'experience_review'
  | 'done';

interface PracticeRoomProps {
  testMode: string;
  onGoBack: () => void;
}

// ----------------------------------------------------
// 忘却曲線のバッジ判定ヘルパー
// ----------------------------------------------------
function getForgetCurveStatus(lastDateStr?: string) {
  if (!lastDateStr) return { label: '未実施', color: '#7f8c8d', dateStr: '' };
  const lastTime = new Date(lastDateStr).getTime();
  const diffHours = (Date.now() - lastTime) / (1000 * 60 * 60);

  // 次回推奨日時
  let nextRecommendTime = new Date(lastTime + 24 * 60 * 60 * 1000); // デフォルト1日後
  let color = '#2ecc71'; // 定着中 (緑)
  let label = '定着中';

  if (diffHours >= 168) { // 7日以上経過
    color = '#e74c3c'; // 復習おすすめ (赤)
    label = '復習推奨 (赤)';
    nextRecommendTime = new Date(lastTime + 7 * 24 * 60 * 60 * 1000);
  } else if (diffHours >= 24) { // 1日以上経過
    color = '#f1c40f'; // 復習おすすめ (黄)
    label = '復習推奨 (黄)';
    nextRecommendTime = new Date(lastTime + 24 * 60 * 60 * 1000);
  }

  const nextStr = nextRecommendTime.toLocaleDateString() + ' ' + nextRecommendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { label, color, dateStr: nextStr };
}

// ----------------------------------------------------
// Web Audio API による優しい完了音
// ----------------------------------------------------
function playGentleChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (e) {
    console.error("Failed to play chime", e);
  }
}

// ----------------------------------------------------
// 航空英語オートコレクト
// ----------------------------------------------------
function autoCorrectAviationTerms(text: string): string {
  let corrected = text;
  const rules = [
    { pattern: /\brunway\s+(three|3)\s+(four|4)\s+left\b/gi, replacement: "Runway 34L" },
    { pattern: /\brunway\s+(three|3)\s+(four|4)\s+right\b/gi, replacement: "Runway 34R" },
    { pattern: /\brunway\s+(zero|0)\s+(nine|9)\b/gi, replacement: "Runway 09" },
    { pattern: /\brunway\s+(two|2)\s+(seven|7)\b/gi, replacement: "Runway 27" },
    { pattern: /\bflight\s+level\s+(two|2)\s+(four|4)\s+(zero|0)\b/gi, replacement: "FL240" },
    { pattern: /\bflight\s+level\s+(one|1)\s+(eight|8)\s+(zero|0)\b/gi, replacement: "FL180" },
    { pattern: /\bheading\s+(one|1)\s+(eight|8)\s+(zero|0)\b/gi, replacement: "HDG 180" },
    { pattern: /\bheading\s+(two|2)\s+(seven|7)\s+(zero|0)\b/gi, replacement: "HDG 270" },
    { pattern: /\bheading\s+(zero|0)\s+(nine|9)\s+(zero|0)\b/gi, replacement: "HDG 090" }
  ];
  rules.forEach(rule => {
    corrected = corrected.replace(rule.pattern, rule.replacement);
  });
  return corrected;
}

export function PracticeRoom({ testMode, onGoBack }: PracticeRoomProps) {
  // 状態管理
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedPicId, setSelectedPicId] = useState<string | null>(null);
  const [level, setLevel] = useState<string>('Level 4'); // 'Level 3' | 'Level 4' | 'Level 5'
  const [logs, setLogs] = useState<{role: 'ai' | 'user', text: string, responseData?: ChatResponse}[]>([]);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  // 復習関連の状態
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [currentReviewIdx, setCurrentReviewIdx] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<any>({});
  const [experienceHistory, setExperienceHistory] = useState<any[]>([]);
  const [showObscuredHint, setShowObscuredHint] = useState(false);

  // フリートーク（背景色変更用）
  const [isFreeTalking, setIsFreeTalking] = useState(false);

  // クールダウンタイマー
  const [cooldownTime, setCooldownTime] = useState(60);

  // タイマー・時間計測関連
  const [startTime, setStartTime] = useState<number>(0);
  const [silenceCounter, setSilenceCounter] = useState(0);
  const [showSilenceWarning, setShowSilenceWarning] = useState(false);

  // 音声フック
  const { isRecording, startRecording, stopRecording, transcript, setTranscript } = useSpeechRecognition();
  const { speak, stop: stopTTS, pause: pauseTTS, resume: resumeTTS, isSpeaking, isPaused } = useSpeechSynthesis();

  // シナリオデータの取得
  const pic = selectedPicId && testMode === 'PictureDescription' ? pictures.find(p => p.id === selectedPicId)! : pictures[0];
  const atc = selectedPicId && testMode === 'ATCCommunication' ? atcScenarios.find(s => s.id === selectedPicId)! : atcScenarios[0];
  const seqPic = selectedPicId && testMode === 'SequencePicture' ? sequencePictures.find(s => s.id === selectedPicId)! : sequencePictures[0];

  // 音声読み上げ速度の決定
  const getSpeechRate = () => {
    if (level === 'Level 3') return 0.65;
    if (level === 'Level 5') return 1.0;
    return 0.8; // Level 4
  };

  // ----------------------------------------------------
  // ローカルストレージデータの読み込み
  // ----------------------------------------------------
  useEffect(() => {
    const history = localStorage.getItem('aelp_review_history');
    if (history) {
      setReviewHistory(JSON.parse(history));
    }
    const exp = localStorage.getItem('aelp_experience_history');
    if (exp) {
      setExperienceHistory(JSON.parse(exp));
    }
  }, []);

  // ----------------------------------------------------
  // 5秒サイレント（無音）監視タイマー
  // ----------------------------------------------------
  useEffect(() => {
    let interval: any;
    if (isRecording && !isSpeaking && !isPaused) {
      interval = setInterval(() => {
        setSilenceCounter(prev => {
          const next = prev + 1;
          if (next === 3) {
            setShowSilenceWarning(true);
          }
          if (next >= 5) {
            // 5秒沈黙：AIが英語で促す
            stopRecording();
            speak(
              "Are you finished with your description? If so, please press the 'Description Finished' button.",
              getSpeechRate(),
              () => {
                // 促し終わったらマイクを再開
                startRecording(true);
              }
            );
            setShowSilenceWarning(false);
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      setSilenceCounter(0);
      setShowSilenceWarning(false);
    }
    return () => clearInterval(interval);
  }, [isRecording, isSpeaking, isPaused]);

  // マイク入力（transcript）が更新されたらタイマーをリセット
  useEffect(() => {
    setSilenceCounter(0);
    setShowSilenceWarning(false);
  }, [transcript]);

  // ----------------------------------------------------
  // 音声合成とマイクの自動排他制御
  // ----------------------------------------------------
  useEffect(() => {
    if (isSpeaking && isRecording) {
      stopRecording();
    }
  }, [isSpeaking]);

  // ----------------------------------------------------
  // テスト全体のコントロールロジック
  // ----------------------------------------------------
  const startTest = () => {
    setLogs([]);
    setStartTime(Date.now());
    setPhase('p1_prompt');
  };

  // AI発声＆ログ追加
  const speakAndLog = (text: string, onEnd?: () => void, responseData?: ChatResponse) => {
    // 日本語応答かフリートークか判定し、背景色フラグを切り替え
    const isJp = /[ぁ-んァ-ヶ]/.test(text) && !text.includes("Pardon?");
    setIsFreeTalking(isJp);

    setLogs(prev => [...prev, { role: 'ai', text, responseData }]);
    speak(text, getSpeechRate(), onEnd);
  };

  // AIの質問指示 (Phase遷移)
  useEffect(() => {
    if (phase === 'p1_prompt') {
      let promptText = "";
      if (testMode === 'ATCCommunication') {
        promptText = "Let's begin the ATC translation test. Please read the Japanese bullet points and translate them into English.";
      } else if (testMode === 'SequencePicture') {
        promptText = seqPic.descriptionPrompt;
      } else {
        promptText = pic.descriptionPrompt;
      }
      speakAndLog(promptText, () => setPhase('p1_record'));
    } else if (phase === 'p2_prompt') {
      // Phase 2: AIからの最初の質問
      const q = testMode === 'SequencePicture' ? seqPic.phase2Questions[0] : (testMode === 'PictureDescription' ? pic.phase2Questions[0] : "Can you explain the troubleshooting details?");
      speakAndLog(q, () => setPhase('p2_record'));
    } else if (phase === 'p3_prompt') {
      // Phase 3: 経験に関する質問
      const q = testMode === 'SequencePicture' ? seqPic.phase3Questions[0] : (testMode === 'PictureDescription' ? pic.phase3Questions[0] : atc.experienceQuestion);
      speakAndLog(q, () => setPhase('p3_record'));
    }
  }, [phase]);

  // 送信処理（説明終了 / 完了ボタン押下）
  const handleFinishRecording = async () => {
    stopRecording();
    let userText = transcript.trim();
    
    // ATCオートコレクト
    userText = autoCorrectAviationTerms(userText);
    
    if (!userText) {
      speakAndLog("I didn't catch that. Could you please try again?", () => {
        startRecording(true);
      });
      return;
    }
    
    setLogs(prev => [...prev, { role: 'user', text: userText }]);
    setTranscript('');

    setLoadingMsg("AI試験官が回答を評価中...");
    
    try {
      const extraInfo = testMode === 'ATCCommunication' ? atc.roleplayContent.join('\n') : (testMode === 'SequencePicture' ? seqPic.referenceStory : pic.sampleAnswers.join('\n'));
      
      const response = await chatWithExaminer(
        logs, 
        userText, 
        testMode, 
        level, 
        phase, 
        extraInfo
      );
      
      setLoadingMsg('');
      setIsFreeTalking(false);

      // 日本語のフリートーク回答だった場合は元のPhaseにとどまり、再度マイクをオンにする
      const isJpReply = /[ぁ-んァ-ヶ]/.test(response.reply) && !response.reply.includes("試験");
      if (isJpReply) {
        speakAndLog(response.reply + "\nそれでは、続きの回答をどうぞ。", () => {
          startRecording(true);
        }, response);
        return;
      }

      // 通常評価応答の場合
      if (phase === 'p1_record') {
        speakAndLog(response.reply, () => {
          setPhase('p2_prompt');
        }, response);
      } else if (phase === 'p2_record') {
        speakAndLog(response.reply, () => {
          setPhase('p3_prompt');
        }, response);
      } else if (phase === 'p3_record') {
        // 全試験終了：所要時間の計算
        const durationSec = Math.round((Date.now() - startTime) / 1000);
        
        // 経験に関する質問の保存
        const expQ = testMode === 'SequencePicture' ? seqPic.phase3Questions[0] : (testMode === 'PictureDescription' ? pic.phase3Questions[0] : atc.experienceQuestion);
        const newExpHistory = [{ question: expQ, date: new Date().toISOString() }, ...experienceHistory.filter(h => h.question !== expQ)];
        setExperienceHistory(newExpHistory);
        localStorage.setItem('aelp_experience_history', JSON.stringify(newExpHistory));

        speakAndLog(response.reply + "\nThis concludes the test. Thank you.", async () => {
          // 復習用ミスの抽出
          setLoadingMsg("復習用の弱点リストを生成中...");
          const mistakes = await generateReviewQuestions([...logs, { role: 'user', text: userText }]);
          setLoadingMsg('');
          
          // 履歴データの保存
          const testId = selectedPicId || "pic_default";
          const currentStore = reviewHistory[testId] || { reviewCount: 0 };
          const updatedStore = {
            ...reviewHistory,
            [testId]: {
              reviewCount: currentStore.reviewCount,
              lastDuration: durationSec,
              lastDate: new Date().toISOString(),
              mistakes: mistakes.length > 0 ? mistakes : (currentStore.mistakes || [])
            }
          };
          setReviewHistory(updatedStore);
          localStorage.setItem('aelp_review_history', JSON.stringify(updatedStore));

          setReviewQuestions(mistakes);
          setPhase('eval_display');
        }, response);
      }
    } catch (e: any) {
      setLoadingMsg('');
      speakAndLog("通信エラーが発生しました: " + e.message);
    }
  };

  // 一時停止/再開
  const handleTogglePause = () => {
    if (isPaused) {
      resumeTTS();
    } else if (isSpeaking) {
      pauseTTS();
      stopRecording();
    }
  };

  // 中止して最初から
  const handleAbort = () => {
    stopRecording();
    stopTTS();
    window.location.reload();
  };

  // ----------------------------------------------------
  // 復習ドリル（弱点復習）の開始とループ制御
  // ----------------------------------------------------
  const startReviewDrill = (questions: ReviewQuestion[]) => {
    setReviewQuestions(questions);
    setCurrentReviewIdx(0);
    setPhase('review_drill');
    setShowObscuredHint(false);
    
    // ドリル開始アナウンス
    speakAndLog("試験どうだった？これから、試験中にアドバイスしたことを、定着させるために、復習していくね！", () => {
      speakAndLog(
        `それでは、これから言う、さっきアドバイスした、文章を日本語いうから、英語でこたえてね！それでは始めます！\n\nお題：${questions[0].japanese}`,
        () => {
          startRecording();
        }
      );
    });
  };

  // 復習回答の送信
  const handleReviewAnswer = async () => {
    stopRecording();
    let userText = transcript.trim();
    userText = autoCorrectAviationTerms(userText);
    
    if (!userText) {
      speakAndLog("もう一度英語で言ってみてください。", () => {
        startRecording(true);
      });
      return;
    }

    setLogs(prev => [...prev, { role: 'user', text: `【復習回答】: ${userText}` }]);
    setTranscript('');
    setLoadingMsg("AI判定中...");

    const currentQ = reviewQuestions[currentReviewIdx];
    try {
      const result = await evaluateReviewAnswer(userText, currentQ.english, currentQ.japanese);
      setLoadingMsg('');
      
      if (result.isCorrect) {
        playGentleChime(); // 優しい完了音
        speakAndLog(result.reply + "\n正解です！「次の復習に行く」を押してください。");
      } else {
        speakAndLog(result.reply + "\nもう一度挑戦してみましょう！", () => {
          startRecording(true);
        });
      }
    } catch (e: any) {
      setLoadingMsg('');
      speakAndLog("エラー: " + e.message);
    }
  };

  // ギブアップ（答えを聞く）
  const handleGiveUp = () => {
    const currentQ = reviewQuestions[currentReviewIdx];
    speakAndLog(`英語ではこう言うよ。真似して発音してみてね！\n"${currentQ.english}"`, () => {
      // ユーザーのシャドーイング（真似）を待つ
      startRecording(true);
    });
  };

  // 次の復習問題に進む
  const handleNextReview = () => {
    const nextIdx = currentReviewIdx + 1;
    if (nextIdx < reviewQuestions.length && nextIdx < 5) { // 最大5問
      setCurrentReviewIdx(nextIdx);
      setShowObscuredHint(false);
      speakAndLog(`次のお題です：\n${reviewQuestions[nextIdx].japanese}`, () => {
        startRecording();
      });
    } else {
      // 復習完了：脳科学クールダウンへ
      const testId = selectedPicId || "pic_default";
      const currentStore = reviewHistory[testId] || { reviewCount: 0 };
      const updatedStore = {
        ...reviewHistory,
        [testId]: {
          ...currentStore,
          reviewCount: currentStore.reviewCount + 1, // 復習回数のインクリメント
        }
      };
      setReviewHistory(updatedStore);
      localStorage.setItem('aelp_review_history', JSON.stringify(updatedStore));

      setPhase('cooldown');
      setCooldownTime(60);
    }
  };

  // ----------------------------------------------------
  // 脳科学クールダウンタイマー
  // ----------------------------------------------------
  useEffect(() => {
    let timer: any;
    if (phase === 'cooldown') {
      if (cooldownTime > 0) {
        timer = setTimeout(() => setCooldownTime(prev => prev - 1), 1000);
      } else {
        playGentleChime();
        speak("クールダウン完了です。記憶がしっかりと定着しました！");
        setPhase('done');
      }
    }
    return () => clearTimeout(timer);
  }, [phase, cooldownTime]);

  // ----------------------------------------------------
  // 自前SVGレーダーチャート描画コンポーネント
  // ----------------------------------------------------
  const renderRadarChart = (scores: ChatResponse['gradingScores']) => {
    if (!scores) return null;
    const items = [
      { name: '発音 (Pron)', val: scores.pronunciation || 4 },
      { name: '文法 (Struct)', val: scores.structure || 4 },
      { name: '語彙 (Vocab)', val: scores.vocabulary || 4 },
      { name: '流暢さ (Fluency)', val: scores.fluency || 4 },
      { name: '理解力 (Compre)', val: scores.comprehension || 4 },
      { name: '対応力 (Interact)', val: scores.interactions || 4 },
    ];

    const center = 150;
    const rMax = 100;
    const angleStep = (Math.PI * 2) / 6;

    // スコアから多角形のポイントを計算
    const points = items.map((item, idx) => {
      const val = Math.min(Math.max(item.val, 1), 6); // 1〜6点
      const r = (val / 6) * rMax;
      const x = center + r * Math.sin(idx * angleStep);
      const y = center - r * Math.cos(idx * angleStep);
      return `${x},${y}`;
    }).join(' ');

    // レベル4合格ラインのポイント
    const passPoints = items.map((_, idx) => {
      const r = (4 / 6) * rMax; // Level 4
      const x = center + r * Math.sin(idx * angleStep);
      const y = center - r * Math.cos(idx * angleStep);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
        <svg width="300" height="300" style={{ background: '#1e293b', borderRadius: '8px', padding: '10px' }}>
          {/* 背景グリッド円 */}
          {[1, 2, 3, 4, 5, 6].map(i => {
            const r = (i / 6) * rMax;
            const gridPts = items.map((_, idx) => {
              const x = center + r * Math.sin(idx * angleStep);
              const y = center - r * Math.cos(idx * angleStep);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon 
                key={i} 
                points={gridPts} 
                fill="none" 
                stroke={i === 4 ? "#e67e22" : "rgba(255,255,255,0.15)"} 
                strokeWidth={i === 4 ? 2 : 1}
                strokeDasharray={i === 4 ? "4" : ""}
              />
            );
          })}

          {/* 軸の描画 */}
          {items.map((item, idx) => {
            const x = center + rMax * Math.sin(idx * angleStep);
            const y = center - rMax * Math.cos(idx * angleStep);
            const textX = center + (rMax + 25) * Math.sin(idx * angleStep);
            const textY = center - (rMax + 12) * Math.cos(idx * angleStep);
            return (
              <g key={idx}>
                <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.2)" />
                <text 
                  x={textX} 
                  y={textY} 
                  fill="#fff" 
                  fontSize="11" 
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {item.name} ({item.val})
                </text>
              </g>
            );
          })}

          {/* 合格ライン表示 */}
          <polygon points={passPoints} fill="none" stroke="rgba(230, 126, 34, 0.4)" strokeWidth="1" />

          {/* 実際のスコアエリア */}
          <polygon 
            points={points} 
            fill="rgba(52, 152, 219, 0.4)" 
            stroke="#3498db" 
            strokeWidth="2" 
          />
        </svg>
        <span style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '5px' }}>
          オレンジ破線：Level 4（合格ライン） | 青エリア：今回の評価
        </span>
      </div>
    );
  };

  // ----------------------------------------------------
  // 伏せ字ヒントのテキスト生成
  // ----------------------------------------------------
  const renderObscuredText = (english: string) => {
    const words = english.split(/\s+/).filter(w => w.length > 4);
    if (words.length === 0) return english;
    
    let obscured = english;
    const keyword = words[currentReviewIdx % words.length].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    obscured = english.replace(regex, (match) => {
      return match[0] + " " + "_ ".repeat(match.length - 1).trim();
    });
    
    return (
      <span style={{ fontFamily: 'monospace', letterSpacing: '1px', fontSize: '1.2rem', color: '#f1c40f' }}>
        {obscured}
      </span>
    );
  };


  // ----------------------------------------------------
  // サブメニュー画面 (復習モード等の分岐)
  // ----------------------------------------------------
  if (phase === 'select') {
    // 復習データの有無をチェック
    const hasAnyHistory = Object.keys(reviewHistory).some(key => {
      const hist = reviewHistory[key];
      return hist && hist.mistakes && hist.mistakes.length > 0;
    });

    return (
      <div className="practice-room-select-container" style={{ overflowY: 'auto', maxHeight: '95vh' }}>
        <div className="back-button-container" style={{ display: 'flex', gap: '15px' }}>
          <button onClick={onGoBack} className="back-button">
            &larr; HOME
          </button>
          {!isReviewMode ? (
            <button 
              onClick={() => setIsReviewMode(true)} 
              className="back-button" 
              style={{ backgroundColor: '#8e44ad', borderColor: '#8e44ad', color: '#fff' }}
            >
              過去の弱点をまとめて復習する (復習版)
            </button>
          ) : (
            <button 
              onClick={() => setIsReviewMode(false)} 
              className="back-button" 
              style={{ backgroundColor: '#2980b9', borderColor: '#2980b9', color: '#fff' }}
            >
              通常テストモードへ
            </button>
          )}
        </div>

        {/* 忘却曲線の凡例 */}
        {isReviewMode && (
          <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '8px', margin: '20px 0', border: '1px solid #444' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>【エビングハウスの忘却曲線に基づく復習バッジの凡例】</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f1c40f' }}></span>
                1日経過：最初の忘却を防ぐ（黄色バッジ）
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#e74c3c' }}></span>
                7日経過：記憶を長期定着させる（赤色バッジ）
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2ecc71' }}></span>
                復習済み：定着中（緑色バッジ）
              </span>
            </div>
          </div>
        )}

        <h2 className="practice-room-title">
          {isReviewMode ? "【復習版】復習したい画像を選択してください" : "画像を選択してください"}
        </h2>

        {/* 経験の復習用分岐ボタン */}
        {isReviewMode && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
            <button 
              onClick={() => setPhase('experience_review')} 
              style={{ padding: '15px 30px', fontSize: '1.2rem', backgroundColor: '#e67e22', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🎤 経験を聞かれた時の復習はこちら
            </button>
          </div>
        )}

        {isReviewMode && !hasAnyHistory && (
          <div style={{ textAlign: 'center', color: '#95a5a6', fontSize: '1.2rem', marginTop: '40px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            「まだ練習の履歴がありません。まずは通常の試験から始めてみましょう！」
          </div>
        )}

        <div className="practice-room-grid">
          {/* ATC Scenarios */}
          {testMode === 'ATCCommunication' && atcScenarios.map(s => {
            const hist = reviewHistory[s.id];
            if (isReviewMode && (!hist || !hist.mistakes || hist.mistakes.length === 0)) return null;

            const curve = getForgetCurveStatus(hist?.lastDate);
            return (
              <div 
                key={s.id} 
                onClick={() => {
                  setSelectedPicId(s.id);
                  if (isReviewMode) {
                    startReviewDrill(hist.mistakes);
                  } else {
                    setPhase('setup');
                  }
                }}
                className="practice-room-card"
                style={{ height: 'auto', minHeight: '180px', padding: '20px', backgroundColor: '#1e293b' }}
              >
                <div style={{ color: 'var(--highlight-color)', fontWeight: 'bold', fontSize: '1rem' }}>{s.title}</div>
                <div style={{ fontSize: '1.1rem', color: '#fff', marginTop: '10px' }}>{s.subtitle}</div>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                  <div>復習回数：{hist?.reviewCount || 0}回</div>
                  {hist?.lastDuration && <div>前回の所要時間：{Math.floor(hist.lastDuration / 60)}分{hist.lastDuration % 60}秒</div>}
                  {hist?.lastDate && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: curve.color }}></span>
                      <span>{curve.label} | 推奨：{curve.dateStr}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Sequence Picture Description */}
          {testMode === 'SequencePicture' && sequencePictures.map(s => {
            const hist = reviewHistory[s.id];
            if (isReviewMode && (!hist || !hist.mistakes || hist.mistakes.length === 0)) return null;

            const curve = getForgetCurveStatus(hist?.lastDate);
            return (
              <div 
                key={s.id} 
                onClick={() => {
                  setSelectedPicId(s.id);
                  if (isReviewMode) {
                    startReviewDrill(hist.mistakes);
                  } else {
                    setPhase('setup');
                  }
                }}
                className="practice-room-card"
                style={{ height: 'auto', minHeight: '180px', padding: '20px', backgroundColor: '#1e293b' }}
              >
                <div style={{ color: 'var(--highlight-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                  <div>復習回数：{hist?.reviewCount || 0}回</div>
                  {hist?.lastDuration && <div>前回の所要時間：{Math.floor(hist.lastDuration / 60)}分{hist.lastDuration % 60}秒</div>}
                  {hist?.lastDate && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: curve.color }}></span>
                      <span>{curve.label} | 推奨：{curve.dateStr}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Single Picture Description */}
          {testMode === 'PictureDescription' && pictures.map(p => {
            const hist = reviewHistory[p.id];
            if (isReviewMode && (!hist || !hist.mistakes || hist.mistakes.length === 0)) return null;

            const curve = getForgetCurveStatus(hist?.lastDate);
            return (
              <div 
                key={p.id} 
                onClick={() => {
                  setSelectedPicId(p.id);
                  if (isReviewMode) {
                    startReviewDrill(hist.mistakes);
                  } else {
                    setPhase('setup');
                  }
                }}
                className="practice-room-card"
              >
                <div className="practice-room-card-image-wrapper">
                  <img src={p.imageUrl} alt="Tarmac" />
                </div>
                <div className="practice-room-card-title">
                  Test: {p.id.replace('pic_', '')}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ccc', padding: '10px', borderTop: '1px solid #333' }}>
                  <div>復習回数：{hist?.reviewCount || 0}回</div>
                  {hist?.lastDuration && <div>前回の所要時間：{Math.floor(hist.lastDuration / 60)}分{hist.lastDuration % 60}秒</div>}
                  {hist?.lastDate && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: curve.color }}></span>
                      <span>{curve.label} | 推奨：{curve.dateStr}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 経験に関する質問（復習版）リスト画面
  // ----------------------------------------------------
  if (phase === 'experience_review') {
    return (
      <div className="practice-room-select-container">
        <div className="back-button-container">
          <button onClick={() => setPhase('select')} className="back-button">
            &larr; 復習目次に戻る
          </button>
        </div>
        <h2 className="practice-room-title">🎤 経験に関する質問の復習（新しい順）</h2>
        
        {experienceHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#95a5a6', fontSize: '1.2rem', marginTop: '40px' }}>
            まだ質問された経験がありません。通常の試験をプレイしてください。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px', margin: '30px auto' }}>
            {experienceHistory.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setLogs([]);
                  setPhase('p3_record');
                  speakAndLog(item.question, () => {
                    startRecording();
                  });
                }}
                className="practice-room-card"
                style={{ padding: '20px', cursor: 'pointer', backgroundColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ fontSize: '1.1rem', color: '#00ffff', fontWeight: 'bold' }}>{item.question}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>質問日: {new Date(item.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // 脳科学クールダウン画面
  // ----------------------------------------------------
  if (phase === 'cooldown') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', backgroundColor: '#0f172a', color: '#fff', padding: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#2980b9', marginBottom: '30px', textAlign: 'center', lineHeight: '1.6', maxWidth: '800px' }}>
          脳科学に基づき、今学んだ記憶をもっとも効率よく整理・固定化するため、目を閉じるか、画面を見ずに1分間深呼吸してください。
        </h2>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#e67e22', margin: '30px 0' }}>
          {cooldownTime} 秒
        </div>
        <button 
          onClick={() => {
            stopTTS();
            setPhase('done');
          }} 
          className="restart-btn"
          style={{ backgroundColor: '#7f8c8d', border: 'none', color: '#fff', fontSize: '1.2rem', padding: '10px 35px' }}
        >
          スキップ
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // レーダーチャート・評価サマリー画面
  // ----------------------------------------------------
  if (phase === 'eval_display') {
    const lastLog = logs[logs.length - 1];
    const scores = lastLog?.responseData?.gradingScores;
    const tone = lastLog?.responseData?.speechTone;
    const paraphrases = lastLog?.responseData?.improvedExpressions;

    return (
      <div className="practice-room-select-container" style={{ overflowY: 'auto', maxHeight: '90vh' }}>
        <h2 className="practice-room-title">🎯 AELP 模擬試験 総合評価</h2>
        
        {scores && renderRadarChart(scores)}

        {tone && (
          <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '8px', margin: '20px auto', maxWidth: '600px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '2.5rem' }}>
              {tone === 'Confident' && "😎"}
              {tone === 'Clear' && "🗣️"}
              {tone === 'Hesitant' && "😰"}
              {tone === 'Anxious' && "⚡"}
            </span>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>スピーチトーン評価：</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00ffff' }}>{tone}</div>
            </div>
          </div>
        )}

        {/* 評価サマリーアコーディオンカード */}
        <div style={{ maxWidth: '800px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <details style={{ backgroundColor: '#1e293b', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
            <summary style={{ fontWeight: 'bold', color: '#2ecc71', cursor: 'pointer', fontSize: '1.2rem' }}>👍 良かった点 (Good Points)</summary>
            <div style={{ marginTop: '15px', color: '#ccc', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {lastLog.text}
            </div>
          </details>

          <details style={{ backgroundColor: '#1e293b', border: '1px solid #333', borderRadius: '8px', padding: '15px' }} open>
            <summary style={{ fontWeight: 'bold', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem' }}>⚠️ 改善すべき点 (To Improve)</summary>
            <div style={{ marginTop: '15px', color: '#ccc', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {lastLog.responseData?.isFillerWarned && (
                <div style={{ color: '#ff4d4d', fontWeight: 'bold', marginBottom: '10px' }}>
                  ※注意: 「uh, um, er, hmm」などのフィラー音が多く検知されました。これらはなるべく減らしてください。
                </div>
              )}
              {lastLog.responseData?.difficultWords && lastLog.responseData.difficultWords.length > 0 && (
                <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: '#f1c40f', marginBottom: '5px' }}>【今回の重要難単語・航空用語】</div>
                  {lastLog.responseData.difficultWords.map((dw, idx) => (
                    <div key={idx} style={{ marginBottom: '5px' }}>
                      <strong>{dw.word}</strong>: {dw.meaning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          {paraphrases && (
            <details style={{ backgroundColor: '#1e293b', border: '1px solid #333', borderRadius: '8px', padding: '15px' }}>
              <summary style={{ fontWeight: 'bold', color: '#3498db', cursor: 'pointer', fontSize: '1.2rem' }}>📝 プロらしい英語への言い換え提案 (Paraphrase)</summary>
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <strong style={{ color: '#00ffff' }}>【実務標準 (Standard)】:</strong>
                  <div style={{ fontStyle: 'italic', fontSize: '1.1rem', marginTop: '5px' }}>"{paraphrases.standard}"</div>
                </div>
                <div>
                  <strong style={{ color: '#ffff00' }}>【高度・Level 5 (Advanced)】:</strong>
                  <div style={{ fontStyle: 'italic', fontSize: '1.1rem', marginTop: '5px' }}>"{paraphrases.advanced}"</div>
                </div>
                <div>
                  <strong style={{ color: '#e67e22' }}>【簡潔安全 (Concise)】:</strong>
                  <div style={{ fontStyle: 'italic', fontSize: '1.1rem', marginTop: '5px' }}>"{paraphrases.concise}"</div>
                </div>
              </div>
            </details>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', margin: '40px 0' }}>
          {reviewQuestions.length > 0 && (
            <button 
              onClick={() => startReviewDrill(reviewQuestions)} 
              className="start-test-btn" 
              style={{ backgroundColor: '#8e44ad', fontSize: '1.3rem', padding: '15px 30px' }}
            >
              🔄 このトピックの弱点の復習
            </button>
          )}
          <button 
            onClick={() => setPhase('select')} 
            className="back-button"
            style={{ fontSize: '1.3rem', padding: '15px 30px', border: '2px solid #ccc' }}
          >
            別のPictureで練習
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="restart-btn"
            style={{ fontSize: '1.3rem', padding: '15px 30px' }}
          >
            HOME
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 弱点復習ドリル画面
  // ----------------------------------------------------
  if (phase === 'review_drill') {
    const currentQ = reviewQuestions[currentReviewIdx];

    return (
      <div className="practice-room-main-container">
        <div className="practice-room-left-panel">
          <div className="panel-header">
            <h3 className="panel-title">🔄 弱点復習ドリル ({currentReviewIdx + 1} / {reviewQuestions.length})</h3>
            <span style={{ fontSize: '1.1rem', color: '#f1c40f', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '15px' }}>
              {currentQ.grammarTag}
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <h4 style={{ color: '#aaa', margin: '0 0 10px 0' }}>【日本語のお題】</h4>
            <h2 style={{ fontSize: '1.8rem', color: '#fff', textAlign: 'center', marginBottom: '40px' }}>
              {currentQ.japanese}
            </h2>

            {/* 伏せ字ヒント */}
            {showObscuredHint && (
              <div style={{ margin: '20px 0', padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>虫食いヒント:</div>
                {renderObscuredText(currentQ.english)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <button 
                onClick={() => setShowObscuredHint(true)} 
                className="action-btn"
                style={{ backgroundColor: '#2980b9' }}
              >
                💡 ヒントを表示 (伏せ字)
              </button>
              <button 
                onClick={handleGiveUp} 
                className="action-btn"
                style={{ backgroundColor: '#c0392b' }}
              >
                📢 答えを聞く (ギブアップ)
              </button>
            </div>
          </div>

          <div className="controls-area" style={{ marginTop: '20px' }}>
            {loadingMsg && <div style={{ color: '#f1c40f', marginBottom: '10px', fontWeight: 'bold' }}>{loadingMsg}</div>}
            
            <div className="recording-status" style={{ background: isRecording ? '#c0392b' : '#333', transition: 'all 0.3s' }}>
              {isRecording ? <Mic size={24} className="recording-pulse" /> : <MicOff size={24} />}
              <span>{isRecording ? "マイクON (回答を話してください)..." : "マイクOFF"}</span>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
              <button 
                onClick={handleReviewAnswer} 
                disabled={!isRecording} 
                className="action-btn btn-success"
                style={{ fontSize: '1.2rem', padding: '12px 30px' }}
              >
                <CheckCircle size={18} /> 回答を判定する
              </button>
              <button 
                onClick={handleNextReview} 
                className="action-btn"
                style={{ backgroundColor: '#27ae60', fontSize: '1.2rem', padding: '12px 30px' }}
              >
                次の復習に行く &rarr;
              </button>
              <button 
                onClick={() => {
                  stopTTS();
                  setPhase('select');
                }} 
                className="action-btn btn-danger"
              >
                終了する
              </button>
            </div>
          </div>
        </div>

        {/* 復習ドリル用チャットログ */}
        <div className="practice-room-right-panel">
          <div className="panel-header border-bottom">
            <h3 className="panel-title">復習中のチャットログ</h3>
          </div>
          <div className="chat-log-area" style={{ flex: 1, overflowY: 'auto' }}>
            {logs.map((log, i) => (
              <div key={i} className={`chat-bubble ${log.role}`}>
                <span className="chat-role">{log.role === 'ai' ? 'Examiner' : 'You'}</span>
                <div className="chat-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {log.text}
                </div>
              </div>
            ))}
            {isRecording && (
              <div className="chat-bubble user">
                <span className="chat-role">You</span>
                <div className="chat-text">{transcript || "音声を聞き取り中..."}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // セットアップ画面 (レベル選択など)
  // ----------------------------------------------------
  if (phase === 'setup') {
    return (
      <div className="practice-room-select-container">
        <div className="back-button-container">
          <button 
            onClick={() => {
              setSelectedPicId(null);
              setPhase('select');
            }} 
            className="back-button"
          >
            &larr; 画像選択に戻る
          </button>
        </div>

        <h2 className="practice-room-title">レベル選択</h2>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '420px' }}>
            {['Level 3', 'Level 4', 'Level 5'].map(lvl => (
              <button 
                key={lvl}
                onClick={() => setLevel(lvl)}
                style={{
                  padding: '16px 25px',
                  fontSize: '1.2rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '2px solid',
                  fontWeight: 'bold',
                  borderColor: level === lvl ? 'var(--highlight-color)' : '#334155',
                  backgroundColor: level === lvl ? 'rgba(230, 126, 34, 0.2)' : '#1e293b',
                  color: '#fff',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div>{lvl === 'Level 3' ? 'Level 3（入門）' : lvl === 'Level 4' ? 'Level 4（実務レベル）' : 'Level 5（ネイティブレベル）'}</div>
                <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 'normal' }}>
                  {lvl === 'Level 3' && "とてもゆっくり / 小学生並みの簡単な英語"}
                  {lvl === 'Level 4' && "少しゆっくりめ / 実務基準のフィードバック"}
                  {lvl === 'Level 5' && "通常ネイティブスピード / 厳しめの詳細アドバイス"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <button onClick={startTest} className="start-test-btn" style={{ fontSize: '1.5rem', padding: '15px 45px' }}>
            Start Practice Test
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 本番試験画面 (メイン対話画面)
  // ----------------------------------------------------
  return (
    <div 
      className="practice-room-main-container"
      style={{
        backgroundColor: isFreeTalking ? 'rgba(230, 126, 34, 0.08)' : '#0f172a',
        transition: 'background-color 0.4s ease'
      }}
      onClick={handleTogglePause}
    >
      <div className="practice-room-left-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <Plane size={24} /> 
            {testMode === 'PictureDescription' && "Single Picture Description"}
            {testMode === 'ATCCommunication' && "ATC Communication"}
            {testMode === 'SequencePicture' && "Sequence Picture Description"}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85rem' }}>
              {level}
            </span>
            <button 
              onClick={() => { localStorage.removeItem("gemini_api_key"); window.location.reload(); }} 
              className="reset-api-key-btn"
            >
              Reset API Key
            </button>
          </div>
        </div>
        
        {/* ピクチャー最大化エリア */}
        <div className="image-display-area" style={{ flex: 1, minHeight: '40vh', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          {testMode === 'ATCCommunication' ? (
            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '8px', height: '100%', overflowY: 'auto' }}>
              <h3 style={{ color: 'yellow', fontSize: '1.5rem', marginTop: 0, marginBottom: '20px' }}>【ATC 翻訳スピーキングお題】</h3>
              <ul style={{ paddingLeft: '20px', fontSize: '1.2rem', lineHeight: '2' }}>
                {atc.roleplayContent.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '12px' }}>{item}</li>
                ))}
              </ul>
            </div>
          ) : testMode === 'SequencePicture' ? (
            <SequenceImageDisplay imageUrls={seqPic.imageUrls} />
          ) : (
            <img src={pic.imageUrl} alt="Tarmac scene" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>
        
        {/* 音声認識の状態表示 */}
        <div className="controls-area" style={{ marginTop: '15px' }}>
          {loadingMsg && <div style={{ color: '#f1c40f', marginBottom: '10px', fontWeight: 'bold' }}>{loadingMsg}</div>}

          <div className="recording-status" style={{ background: isRecording ? '#c0392b' : '#333', transition: 'all 0.3s' }}>
            {isRecording ? <Mic size={24} className="recording-pulse" /> : <MicOff size={24} />}
            <span>
              {isRecording ? "Listening..." : (isPaused ? "Paused (一時停止中)" : "Microphone off")}
            </span>
          </div>

          {/* 5秒沈黙のカウントダウン警告 */}
          {showSilenceWarning && (
            <div style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '1.1rem', margin: '10px 0' }}>
              ⚠️ 沈黙が続いています。あと {5 - silenceCounter} 秒でAI試験官が確認します。
            </div>
          )}

          {/* ボタンの常時表示 */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <button 
              onClick={handleFinishRecording} 
              disabled={!isRecording} 
              className="action-btn btn-success"
              style={{ fontSize: '1.1rem', padding: '12px 25px' }}
            >
              <CheckCircle size={18} /> 説明終了 / 送信
            </button>
            <button 
              onClick={handleTogglePause} 
              className="action-btn btn-warning"
              style={{ fontSize: '1.1rem', padding: '12px 25px' }}
            >
              {isPaused ? <PlayCircle size={18}/> : <PauseCircle size={18}/>}
              {isPaused ? "一時停止を解除 (再開)" : "一時的に中止 (一時停止)"}
            </button>
            <button onClick={handleAbort} className="action-btn btn-danger" style={{ fontSize: '1.1rem' }}>
              <XCircle size={18} /> 最初からやり直す
            </button>
          </div>
        </div>
      </div>

      {/* チャットログ開閉シートUI */}
      <details className="practice-room-right-panel" style={{ width: '400px', backgroundColor: '#1e293b', borderLeft: '1px solid #333' }} open>
        <summary style={{ padding: '15px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#161e2e' }}>
          チャットログの表示/非表示
        </summary>
        <div className="chat-log-area" style={{ height: '70vh', overflowY: 'auto', padding: '15px' }}>
          {logs.map((log, i) => (
            <div key={i} className={`chat-bubble ${log.role}`} style={{ marginBottom: '15px' }}>
              <span className="chat-role" style={{ color: log.role === 'ai' ? '#3498db' : '#2ecc71', fontWeight: 'bold' }}>
                {log.role === 'ai' ? 'Examiner' : 'You'}
              </span>
              <div className="chat-text" style={{ marginTop: '5px' }}>
                {highlightFillersAndEnglish(log.text, log.role === 'ai', log.responseData?.difficultWords)}
              </div>
            </div>
          ))}
          
          {/* 現在の音声認識文字起こしをリアルタイムにバブル表示 */}
          {isRecording && (
            <div className="chat-bubble user">
              <span className="chat-role" style={{ color: '#2ecc71', fontWeight: 'bold' }}>You</span>
              <div className="chat-text" style={{ opacity: transcript ? 1 : 0.6 }}>
                {transcript ? autoCorrectAviationTerms(transcript) : "話してください..."}
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

// ----------------------------------------------------
// ハイライト表示用ヘルパー関数
// ----------------------------------------------------
function highlightFillersAndEnglish(text: string, isAi: boolean, difficultWords?: {word: string, meaning: string}[]): React.ReactNode {
  const words = text.split(/(\buh\b|\bum\b|\ber\b|\bhmm\b)/gi);
  
  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {words.map((seg, idx) => {
        const lower = seg.toLowerCase();
        const isFiller = ['uh', 'um', 'er', 'hmm'].includes(lower);
        
        if (isFiller) {
          return <span key={idx} style={{ color: '#e74c3c', fontWeight: 'bold', textDecoration: 'underline' }}>{seg}</span>;
        }

        if (isAi && difficultWords && difficultWords.length > 0) {
          let wordSegs = [seg];
          difficultWords.forEach(dw => {
            const temp: string[] = [];
            const regex = new RegExp(`(\\b${dw.word}\\b)`, 'gi');
            wordSegs.forEach(s => {
              const parts = s.split(regex);
              temp.push(...parts);
            });
            wordSegs = temp;
          });

          return wordSegs.map((wseg, widx) => {
            const matchedWord = difficultWords.find(dw => dw.word.toLowerCase() === wseg.toLowerCase());
            if (matchedWord) {
              return (
                <span 
                  key={`${idx}-${widx}`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`【難単語】\n${matchedWord.word}\n意味: ${matchedWord.meaning}`);
                  }}
                  style={{ color: '#f1c40f', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {wseg}
                </span>
              );
            }
            const isEnglish = /[a-zA-Z]/.test(wseg);
            return <span key={`${idx}-${widx}`} style={isEnglish ? { color: '#00ffff', fontWeight: 'bold' } : {}}>{wseg}</span>;
          });
        }

        const isEnglish = /[a-zA-Z]/.test(seg);
        if (isEnglish && isAi) {
          return <span key={idx} style={{ color: '#00ffff', fontWeight: 'bold' }}>{seg}</span>;
        }
        
        return <span key={idx}>{seg}</span>;
      })}
    </div>
  );
}
