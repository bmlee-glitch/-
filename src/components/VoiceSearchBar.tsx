import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Search, Loader2, Sparkles, X, Keyboard, Globe, Info } from 'lucide-react';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';

interface VoiceSearchBarProps {
  onSearch: (word: string) => void;
  isLoading: boolean;
  initialWord?: string;
}

export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  onSearch,
  isLoading,
  initialWord = '',
}) => {
  const [inputWord, setInputWord] = useState(initialWord);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechLang, setSpeechLang] = useState<'en-US' | 'ko-KR'>('en-US');
  const [supportStatus, setSupportStatus] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSupportStatus(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (initialWord) {
      setInputWord(initialWord);
    }
  }, [initialWord]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const target = inputWord.trim();
    if (target) {
      if (isListening) {
        stopVoiceRecognition();
      }
      onSearch(target);
    }
  };

  const startVoiceRecognition = () => {
    if (!supportStatus) {
      alert('현재 브라우저에서 마이크 음성 인식이 지원되지 않습니다. Chrome 또는 Safari 브라우저를 권장합니다.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      setInterimText('');
      const recognition = createSpeechRecognizer({
        lang: speechLang,
        onStart: () => {
          setIsListening(true);
        },
        onResult: (transcript, isFinal) => {
          setInterimText(transcript);
          setInputWord(transcript);
          if (isFinal && transcript.trim()) {
            setIsListening(false);
            setTimeout(() => {
              onSearch(transcript.trim());
            }, 300);
          }
        },
        onError: (err) => {
          console.warn('Speech error:', err);
          setIsListening(false);
          setInterimText('');
        },
        onEnd: () => {
          setIsListening(false);
        },
      });

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const toggleMic = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const handleSelectMode = (mode: 'text' | 'voice') => {
    setInputMode(mode);
    if (mode === 'text') {
      stopVoiceRecognition();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      startVoiceRecognition();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Input Mode Selector Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleSelectMode('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              inputMode === 'text'
                ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>직접 텍스트 입력</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              inputMode === 'voice'
                ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>음성 마이크 입력</span>
          </button>
        </div>

        {/* API Info / Language Switch */}
        <div className="flex items-center gap-2">
          {inputMode === 'voice' && (
            <button
              type="button"
              onClick={() => setSpeechLang(speechLang === 'en-US' ? 'ko-KR' : 'en-US')}
              title="음성 인식 언어 전환 (영어 / 한국어)"
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{speechLang === 'en-US' ? '🇺🇸 영어로 말하기' : '🇰🇷 한국어로 말하기'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Search Bar Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center bg-white rounded-2xl border-2 transition-all shadow-lg ${
            isListening
              ? 'border-red-500 ring-4 ring-red-100 shadow-red-500/10'
              : 'border-indigo-100 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 shadow-indigo-500/5'
          }`}
        >
          {/* Left search icon or loading spinner */}
          <div className="pl-5 text-indigo-500 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            ) : (
              <Search className="w-6 h-6 text-slate-400" />
            )}
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            placeholder={
              isListening
                ? '귀 기울여 듣고 있어요... 말씀해보세요!'
                : inputMode === 'text'
                ? '분석할 영어 단어나 문장을 직접 입력하세요 (예: resilient, serendipity)'
                : '마이크 버튼을 누르고 말씀하세요 (예: "resilient")'
            }
            className="w-full py-4.5 px-4 text-base sm:text-lg text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium"
            disabled={isLoading}
            autoFocus
          />

          {/* Clear button */}
          {inputWord && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setInputWord('');
                setInterimText('');
                inputRef.current?.focus();
              }}
              className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Microphone button */}
          <button
            type="button"
            onClick={toggleMic}
            disabled={isLoading}
            className={`relative p-3 mr-2 rounded-xl transition-all flex items-center justify-center ${
              isListening
                ? 'bg-red-500 text-white shadow-md shadow-red-500/40 animate-bounce'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700'
            }`}
            title={isListening ? '음성 인식 중지' : '마이크로 영어 단어 말하기'}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !inputWord.trim()}
            className="mr-2 sm:mr-3 px-4 sm:px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-md shadow-indigo-600/25 hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-1.5"
          >
            <span>분석</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Voice Listening Wave Indicator */}
      {isListening && (
        <div className="p-3.5 bg-red-50/90 border border-red-200/80 rounded-xl flex items-center justify-between text-xs sm:text-sm text-red-700 shadow-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 bg-red-500 rounded-full animate-[bounce_0.8s_infinite]"></span>
              <span className="w-1 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_0.2s]"></span>
              <span className="w-1 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_0.4s]"></span>
              <span className="w-1 bg-red-500 rounded-full animate-[bounce_0.8s_infinite_0.1s]"></span>
            </div>
            <span className="font-semibold">
              {interimText
                ? `인식 중: "${interimText}"`
                : '단어를 또렷하게 말씀해주세요... (말이 끝나면 자동 분석됩니다)'}
            </span>
          </div>
          <button
            type="button"
            onClick={stopVoiceRecognition}
            className="text-xs font-bold underline hover:text-red-900"
          >
            취소
          </button>
        </div>
      )}

      {/* Helper text with Quick Preset Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">추천 검색:</span>
          {['resilient', 'serendipity', 'articulate', 'procrastinate'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setInputWord(chip);
                onSearch(chip);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors border border-slate-200"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-700">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>키보드로 직접 입력 후 Enter를 누르시거나 마이크로 말씀하세요.</span>
        </div>
      </div>
    </div>
  );
};
