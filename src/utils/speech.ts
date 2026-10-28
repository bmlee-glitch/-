// Web Speech API interfaces
interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function createSpeechRecognizer(options?: {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = options?.lang || 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    options?.onStart?.();
  };

  recognition.onresult = (event: SpeechRecognitionEventLike) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    const text = finalTranscript || interimTranscript;
    options?.onResult?.(text, Boolean(finalTranscript));
  };

  recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
    options?.onError?.(event.error);
  };

  recognition.onend = () => {
    options?.onEnd?.();
  };

  return recognition;
}

// Text to Speech
export function speakText(
  text: string,
  options?: {
    lang?: 'en-US' | 'en-GB' | 'ko-KR';
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options?.lang || 'en-US';
  utterance.rate = options?.rate || 0.95;
  utterance.pitch = options?.pitch || 1.0;

  // Attempt to pick a natural sounding voice
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const desiredLang = options?.lang || 'en-US';
    const matchedVoice = voices.find(
      (v) =>
        v.lang === desiredLang ||
        v.lang.replace('_', '-').startsWith(desiredLang.slice(0, 2))
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    options?.onError?.(e);
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Calculate similarity score between target text and spoken text
export function evaluatePronunciation(target: string, spoken: string): {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'retry';
  feedback: string;
} {
  const cleanTarget = target.trim().toLowerCase().replace(/[.,!?;:'"()]/g, '');
  const cleanSpoken = spoken.trim().toLowerCase().replace(/[.,!?;:'"()]/g, '');

  if (!cleanSpoken) {
    return { score: 0, level: 'retry', feedback: '음성이 감지되지 않았습니다. 다시 말씀해보세요.' };
  }

  if (cleanTarget === cleanSpoken) {
    return { score: 100, level: 'excellent', feedback: '완벽한 발음입니다! 원어민 수준의 정확도예요.' };
  }

  // Check if spoken contains the target word
  if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
    const ratio = Math.min(cleanTarget.length, cleanSpoken.length) / Math.max(cleanTarget.length, cleanSpoken.length);
    const score = Math.round(85 + ratio * 15);
    return {
      score,
      level: score >= 90 ? 'excellent' : 'good',
      feedback: '아주 훌륭해요! 억양과 강세를 조금만 더 부드럽게 이어가보세요.',
    };
  }

  // Levenshtein distance
  const d: number[][] = [];
  const m = cleanTarget.length;
  const n = cleanSpoken.length;

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = cleanTarget[i - 1] === cleanSpoken[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  const distance = d[m][n];
  const maxLen = Math.max(m, n);
  const similarity = Math.max(0, 1 - distance / maxLen);
  const score = Math.round(similarity * 100);

  if (score >= 80) {
    return { score, level: 'good', feedback: '좋은 발음입니다! 거의 정확하게 인식되었어요.' };
  } else if (score >= 50) {
    return { score, level: 'fair', feedback: '비슷하게 발음하셨어요. 모음과 끝자음 소리에 주의해서 천천히 다시 말해보세요.' };
  } else {
    return { score, level: 'retry', feedback: '정확한 소리를 원어민 발음으로 들어보고 다시 도전해보세요.' };
  }
}
