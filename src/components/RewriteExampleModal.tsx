import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Volume2,
  Check,
  Loader2,
  BookmarkCheck,
  RefreshCw,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import { ExampleItem, StudiedSentence } from '../types';
import { speakText } from '../utils/speech';

interface RewriteExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  example: ExampleItem | null;
  word: string;
  onSaveToVault: (item: StudiedSentence) => void;
  speechAccent?: 'en-US' | 'en-GB';
  speechRate?: number;
}

export const RewriteExampleModal: React.FC<RewriteExampleModalProps> = ({
  isOpen,
  onClose,
  example,
  word,
  onSaveToVault,
  speechAccent = 'en-US',
  speechRate = 0.95,
}) => {
  const [stylePreset, setStylePreset] = useState<string>('비즈니스 이메일용으로 더 격식있게');
  const [customStyleInput, setCustomStyleInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [rewrittenSentence, setRewrittenSentence] = useState<string>('');
  const [rewrittenKorean, setRewrittenKorean] = useState<string>('');
  const [nuanceTip, setNuanceTip] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isEditingManually, setIsEditingManually] = useState<boolean>(false);

  React.useEffect(() => {
    if (example) {
      setRewrittenSentence('');
      setRewrittenKorean('');
      setNuanceTip('');
      setUserNotes('');
      setIsSaved(false);
      setIsEditingManually(false);
      setCustomStyleInput('');
    }
  }, [example]);

  if (!isOpen || !example) return null;

  const handleGenerateRewrite = async (presetOrCustom?: string) => {
    const targetStyle = presetOrCustom || customStyleInput || stylePreset;
    setIsGenerating(true);
    setIsSaved(false);

    try {
      const res = await fetch('/api/rewrite-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSentence: example.sentence,
          word,
          styleOrSituation: targetStyle,
        }),
      });

      const text = await res.text();
      const json = JSON.parse(text);

      if (json.success && json.data) {
        setRewrittenSentence(json.data.rewrittenSentence);
        setRewrittenKorean(json.data.koreanTranslation);
        setNuanceTip(json.data.nuanceTip);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const finalItem: StudiedSentence = {
      id: `studied-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      word,
      originalSentence: example.sentence,
      originalKorean: example.koreanTranslation,
      customSentence: rewrittenSentence || example.sentence,
      customKorean: rewrittenKorean || example.koreanTranslation,
      situation: customStyleInput || stylePreset || example.situation,
      userNotes: userNotes.trim(),
      savedAt: Date.now(),
      isBookmarked: true,
    };

    onSaveToVault(finalItem);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const currentSentenceToPlay = rewrittenSentence || example.sentence;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-lg">내 상황에 맞게 예문 재작성 &amp; 보관</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Original Sentence Display */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              원문 예문 ({example.situation || '기본'})
            </span>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-medium text-slate-900 leading-snug mb-1">
                  {example.sentence}
                </p>
                <p className="text-xs sm:text-sm text-slate-700">
                  {example.koreanTranslation}
                </p>
              </div>
              <button
                onClick={() =>
                  speakText(example.sentence, {
                    lang: speechAccent,
                    rate: speechRate,
                  })
                }
                className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 shrink-0"
                title="원문 발음 듣기"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              어떤 상황이나 스타일로 다시 쓰고 싶으신가요?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                '비즈니스 이메일용',
                '일상 캐주얼 대화',
                '면접 / 프레젠테이션',
                '더 쉽고 간결하게',
              ].map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setStylePreset(style);
                    handleGenerateRewrite(style);
                  }}
                  disabled={isGenerating}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    stylePreset === style
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 mt-2.5">
              <input
                type="text"
                value={customStyleInput}
                onChange={(e) => setCustomStyleInput(e.target.value)}
                placeholder="또는 원하는 상황 직접 입력 (예: 공항에서 분실물 찾을 때)"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerateRewrite(customStyleInput);
                  }
                }}
              />
              <button
                onClick={() => handleGenerateRewrite(customStyleInput)}
                disabled={isGenerating || !customStyleInput.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>AI 재작성</span>
              </button>
            </div>
          </div>

          {/* Rewritten Sentence Output */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>재작성된 나만의 예문</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingManually(!isEditingManually)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingManually ? '편집 완료' : '직접 수정하기'}</span>
                </button>

                <button
                  onClick={() =>
                    speakText(currentSentenceToPlay, {
                      lang: speechAccent,
                      rate: speechRate,
                    })
                  }
                  className="p-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                  title="발음 듣기"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isEditingManually ? (
              <div className="space-y-2">
                <textarea
                  value={rewrittenSentence || example.sentence}
                  onChange={(e) => setRewrittenSentence(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-indigo-300 text-sm font-medium bg-white focus:outline-none"
                  rows={2}
                  placeholder="영어 문장 직접 수정"
                />
                <textarea
                  value={rewrittenKorean || example.koreanTranslation}
                  onChange={(e) => setRewrittenKorean(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-indigo-300 text-xs sm:text-sm bg-white focus:outline-none"
                  rows={2}
                  placeholder="한글 번역 직접 수정"
                />
              </div>
            ) : (
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-1">
                  {rewrittenSentence || (
                    <span className="text-slate-500 font-normal italic">
                      위 버튼을 눌러 원하는 상황에 맞게 재작성해보세요.
                    </span>
                  )}
                </p>
                {rewrittenKorean && (
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    {rewrittenKorean}
                  </p>
                )}
              </div>
            )}

            {nuanceTip && (
              <div className="p-3 rounded-xl bg-white border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                <span className="font-bold text-indigo-700 block mb-0.5">💡 실전 활용 팁:</span>
                {nuanceTip}
              </div>
            )}
          </div>

          {/* Personal Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              나만의 암기 메모 (선택사항)
            </label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="예: 내일 오전 10시 팀 미팅 때 써먹기, 바이어 미팅 필수 표현"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-700 hidden sm:block">
            저장된 예문은 언제든 '공부한 예문' 탭에서 다시 꺼내쓰실 수 있습니다.
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>보관함에 저장 완료!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>내 예문 보관함에 저장</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
