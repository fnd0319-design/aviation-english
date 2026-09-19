import { useState, useEffect, useRef } from 'react';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [enVoice, setEnVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [jpVoice, setJpVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 巻き戻し再生用に状態を保持するRef
  const segmentsRef = useRef<string[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const currentRateRef = useRef<number>(1.0);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // 女性のネイティブアメリカン(en-US)を優先的に探索
      const usFemaleVoice = availableVoices.find(v => 
        (v.lang === 'en-US' || v.lang === 'en_US') && 
        (v.name.includes('Zira') || v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Hazel') || v.name.includes('Natural'))
      ) || availableVoices.find(v => v.lang.startsWith('en'));

      const japaneseVoice = availableVoices.find(v => v.name.includes('Google 日本語') || v.name.includes('Google Japanese')) ||
        availableVoices.find(v => v.lang.startsWith('ja') && (v.name.includes('Female') || v.name.includes('Haruka') || v.name.includes('Google'))) ||
        availableVoices.find(v => v.lang.startsWith('ja'));
      
      if (usFemaleVoice) setEnVoice(usFemaleVoice);
      if (japaneseVoice) setJpVoice(japaneseVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = (text: string, rate: number = 1.0, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setIsPaused(false);

    // 英語と日本語を適切に分割
    const segments = text.split(/([a-zA-Z][a-zA-Z0-9\s.,!?()'-]*[a-zA-Z0-9]|[a-zA-Z])/g).filter(s => s.trim() !== "");
    
    segmentsRef.current = segments;
    currentIndexRef.current = 0;
    currentRateRef.current = rate;
    onEndRef.current = onEnd;
    
    speakNext();
  };

  const speakNext = () => {
    const index = currentIndexRef.current;
    const segments = segmentsRef.current;
    
    if (index >= segments.length) {
      setIsSpeaking(false);
      const callback = onEndRef.current;
      if (callback) callback();
      return;
    }
    
    const chunk = segments[index];
    const hasEnglishLetter = /[a-zA-Z]/.test(chunk);
    const voiceToUse = hasEnglishLetter ? enVoice : (jpVoice || enVoice);
    
    const utterance = new SpeechSynthesisUtterance(chunk);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    
    if (hasEnglishLetter) {
      utterance.rate = currentRateRef.current; 
      utterance.pitch = 1.0; 
    } else {
      // 日本語は聞きやすい速度
      utterance.rate = 1.1; 
      utterance.pitch = 1.0; 
    }
    
    utterance.onend = () => {
      currentIndexRef.current += 1;
      speakNext();
    };
    
    utterance.onerror = () => {
      currentIndexRef.current += 1;
      speakNext();
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    currentIndexRef.current = -1;
    segmentsRef.current = [];
  };

  // 巻き戻し式の一時停止 (発声をcancelし、インデックスを保持)
  const pause = () => {
    if (!isSpeaking || isPaused) return;
    
    window.speechSynthesis.cancel(); // 完全に止める
    setIsPaused(true);
  };

  // 巻き戻し再開 (直前の文章から少し巻き戻して再生)
  const resume = () => {
    if (!isPaused) return;
    
    setIsPaused(false);
    
    // 現在の読み上げインデックスを「1つ前」に巻き戻す (文章の先頭リピート)
    let targetIndex = currentIndexRef.current - 1;
    if (targetIndex < 0) targetIndex = 0;
    currentIndexRef.current = targetIndex;
    
    speakNext();
  };

  return { speak, stop, pause, resume, isSpeaking, isPaused, voices, enVoice, jpVoice };
}
