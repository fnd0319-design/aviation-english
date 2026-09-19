import { useState, useEffect, useRef } from 'react';

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as WindowWithSpeechRecognition).SpeechRecognition || (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setTranscript((prev) => (prev ? prev + " " + finalTranscript : finalTranscript).trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = (isResume = false) => {
    if (!isResume) {
      setTranscript('');
    }
    setIsRecording(true);
    try {
      recognitionRef.current?.start();
    } catch(e) { console.error(e) }
  };

  const stopRecording = () => {
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch(e) { console.error(e) }
  };

  return {
    isRecording,
    transcript,
    setTranscript,
    startRecording,
    stopRecording,
    hasSupport: !!recognitionRef.current
  };
}
