import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Award, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createSpeechRecognizer, speakText, evaluatePronunciation } from '../utils/speech';

interface SpeakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetText: string;
  phonetic?: string;
  koreanMeaning?: string;
  speechAccent?: 'en-US' | 'en-GB';
  speechRate?: number;
}

export const SpeakingModal: React.FC<SpeakingModalProps> = ({
  isOpen,
  onClose,
  targetText,
  phonetic,
  koreanMeaning,
  speechAccent = 'en-US',
  speechRate = 0.9,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [evaluation, setEvaluation] = useState<{
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'retry';
    feedback: string;
  } | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSpokenText('');
      setEvaluation(null);
      setIsListening(false);
    }
  }, [isOpen, targetText]);

  if (!isOpen) return null;

  const handlePlayNative = () => {
    speakText(targetText, {
      lang: speechAccent,
      rate: speechRate,
    });
  };

  const handleStartSpeaking = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      setSpokenText('');
      setEvaluation(null);

      const recognition = createSpeechRecognizer({
        lang: speechAccent,
        onStart: () => setIsListening(true),
        onResult: (transcript, isFinal) => {
          setSpokenText(transcript);
          if (isFinal) {
            setIsListening(false);
            const result = evaluatePronunciation(targetText, transcript);
            setEvaluation(result);
            if (result.score >= 85) {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
              });
            }
          }
        },
        onError: (err) => {
          console.warn('Recognition error:', err);
          setIsListening(false);
        },
        onEnd: () => setIsListening(false),
      });

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleStopSpeaking = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-lg">AI 발음 트레이닝 (Speaking Coach)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Content */}
        <div className="p-6 text-center">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            따라 읽어볼 단어/문장
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            {targetText}
          </h2>
          {phonetic && (
            <p className="text-sm font-mono text-indigo-600 mb-1">{phonetic}</p>
          )}
          {koreanMeaning && (
            <p className="text-sm text-slate-700 mb-4">{koreanMeaning}</p>
          )}

          {/* Native Audio Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handlePlayNative}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors"
            >
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>원어민 발음 먼저 듣기</span>
            </button>
          </div>

          {/* Microphone Action Area */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center mb-4">
            <div className="relative mb-3">
              {isListening && (
                <div className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping"></div>
              )}
              <button
                onClick={isListening ? handleStopSpeaking : handleStartSpeaking}
                className={`relative w-18 h-18 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-lg ${
                  isListening
                    ? 'bg-red-500 shadow-red-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <p className="text-sm font-medium text-slate-700">
              {isListening
                ? '귀 기울여 듣고 있어요... 말씀해보세요!'
                : '마이크 버튼을 누르고 말씀하세요'}
            </p>

            {spokenText && (
              <div className="mt-3 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 max-w-full">
                <span className="text-slate-600 font-semibold mr-1">인식된 음성:</span>
                <span className="font-bold text-indigo-700">"{spokenText}"</span>
              </div>
            )}
          </div>

          {/* Evaluation Results */}
          {evaluation && (
            <div
              className={`p-4 rounded-2xl border text-left transition-all ${
                evaluation.score >= 80
                  ? 'bg-emerald-50 border-emerald-200'
                  : evaluation.score >= 50
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {evaluation.score >= 80 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="font-bold text-sm text-slate-900">
                    {evaluation.score >= 90
                      ? '🎉 원어민급 발음!'
                      : evaluation.score >= 80
                      ? '👍 아주 좋은 발음!'
                      : evaluation.score >= 50
                      ? '🙂 조금만 더 연습해볼까요?'
                      : '💪 다시 도전해보세요!'}
                  </span>
                </div>
                <span
                  className={`text-lg font-extrabold ${
                    evaluation.score >= 80
                      ? 'text-emerald-700'
                      : evaluation.score >= 50
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {evaluation.score}점
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-3">
                {evaluation.feedback}
              </p>

              <div className="flex justify-end">
                <button
                  onClick={handleStartSpeaking}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 말해보기</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
