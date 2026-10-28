import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Trash2,
  Volume2,
  Copy,
  Check,
  Download,
  Sparkles,
  Edit3,
  Mic,
  ArrowRight,
  BookMarked,
  Tag,
} from 'lucide-react';
import { StudiedSentence } from '../types';
import { speakText } from '../utils/speech';

interface StudiedSentencesViewProps {
  sentences: StudiedSentence[];
  onRemoveSentence: (id: string) => void;
  onEditSentence: (sentence: StudiedSentence) => void;
  onPracticeSpeaking: (targetText: string, phonetic?: string, meaning?: string) => void;
  onExploreWords: () => void;
  speechAccent?: 'en-US' | 'en-GB';
  speechRate?: number;
}

export const StudiedSentencesView: React.FC<StudiedSentencesViewProps> = ({
  sentences,
  onRemoveSentence,
  onEditSentence,
  onPracticeSpeaking,
  onExploreWords,
  speechAccent = 'en-US',
  speechRate = 0.95,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = sentences.filter((item) => {
    const q = filterQuery.toLowerCase();
    return (
      item.word.toLowerCase().includes(q) ||
      (item.customSentence && item.customSentence.toLowerCase().includes(q)) ||
      (item.customKorean && item.customKorean.includes(q)) ||
      item.originalSentence.toLowerCase().includes(q) ||
      (item.userNotes && item.userNotes.includes(q)) ||
      item.situation.includes(q)
    );
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportText = () => {
    if (sentences.length === 0) return;
    const lines = sentences.map((s, idx) => {
      const activeEn = s.customSentence || s.originalSentence;
      const activeKo = s.customKorean || s.originalKorean;
      return `${idx + 1}. [${s.word}] (${s.situation})\nEN: ${activeEn}\nKO: ${activeKo}${
        s.userNotes ? `\nMEMO: ${s.userNotes}` : ''
      }\n`;
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `공부한_예문_보관함_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">
              공부한 예문 보관함
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {sentences.length}개 보관 중
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            공부하며 내 상황에 맞게 재작성하고 보관한 예문들을 언제든 꺼내쓰고 발음 연습하세요.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {sentences.length > 0 && (
            <button
              onClick={handleExportText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              title="텍스트 파일로 내보내기"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>텍스트 파일 저장</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {sentences.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="단어, 문장, 한글 번역, 또는 작성한 메모 검색..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Sentences List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((item) => {
            const activeSentence = item.customSentence || item.originalSentence;
            const activeKorean = item.customKorean || item.originalKorean;
            const isRewritten = Boolean(item.customSentence && item.customSentence !== item.originalSentence);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3.5 group"
              >
                {/* Meta header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                      {item.word}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{item.situation}</span>
                    </span>
                    {isRewritten && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        ✨ 맞춤 재작성됨
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(activeSentence, item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="문장 클립보드 복사"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onRemoveSentence(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="보관함에서 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sentences content */}
                <div>
                  <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-1">
                    {activeSentence}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                    {activeKorean}
                  </p>

                  {/* If customized, show original in small toggle */}
                  {isRewritten && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">원래 예문: </span>
                      <span className="italic">{item.originalSentence}</span>
                    </div>
                  )}

                  {/* User Memo */}
                  {item.userNotes && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-medium">
                      📌 <span className="font-bold">내 메모:</span> {item.userNotes}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        speakText(activeSentence, {
                          lang: speechAccent,
                          rate: speechRate,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>원어민 발음 듣기</span>
                    </button>

                    <button
                      onClick={() =>
                        onPracticeSpeaking(activeSentence, undefined, activeKorean)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>따라 말하기 (쉐도잉)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onEditSentence(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>다시 재작성 / 수정</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : sentences.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            아직 보관된 예문이 없습니다
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 mb-6 leading-relaxed">
            단어 탐색 화면에서 마음에 드는 예문의 <strong className="text-indigo-600">"⭐️ 예문 보관"</strong> 또는 <strong className="text-indigo-600">"✏️ 내 상황으로 재작성"</strong> 버튼을 누르면 나만의 예문으로 저장되어 언제든 다시 꺼내볼 수 있습니다.
          </p>
          <button
            onClick={onExploreWords}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>단어 예문 둘러보기</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-700 text-sm">
          검색 조건과 일치하는 예문이 없습니다.
        </div>
      )}
    </div>
  );
};
