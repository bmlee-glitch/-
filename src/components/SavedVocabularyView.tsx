import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Trash2,
  Volume2,
  ExternalLink,
  Download,
  BookOpen,
  Star,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { SavedWord } from '../types';
import { speakText } from '../utils/speech';

interface SavedVocabularyViewProps {
  savedWords: SavedWord[];
  onSelectWord: (word: string) => void;
  onRemoveWord: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onStartQuiz: () => void;
  onExploreWords: () => void;
  speechAccent?: 'en-US' | 'en-GB';
  speechRate?: number;
}

export const SavedVocabularyView: React.FC<SavedVocabularyViewProps> = ({
  savedWords,
  onSelectWord,
  onRemoveWord,
  onToggleFavorite,
  onStartQuiz,
  onExploreWords,
  speechAccent = 'en-US',
  speechRate = 0.95,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const filtered = savedWords.filter((item) => {
    const matchesQuery =
      item.word.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.koreanMeanings.some((m) => m.includes(filterQuery));
    const matchesFav = onlyFavorites ? item.isFavorite : true;
    const matchesLevel =
      selectedLevel === 'all' ? true : item.cefrLevel === selectedLevel;

    return matchesQuery && matchesFav && matchesLevel;
  });

  const handleExportCSV = () => {
    if (savedWords.length === 0) return;
    const headers = ['단어', '발음기호', 'CEFR레벨', '한국어뜻', '저장날짜'];
    const rows = savedWords.map((w) => [
      `"${w.word}"`,
      `"${w.phonetic || ''}"`,
      `"${w.cefrLevel || ''}"`,
      `"${w.koreanMeanings.join(', ')}"`,
      `"${new Date(w.savedAt).toLocaleDateString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WordFlow_단어장_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">
              나만의 영어 단어장
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {savedWords.length}개 저장됨
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            음성이나 텍스트로 검색한 단어를 복습하고 플래시카드로 학습해보세요.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {savedWords.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                title="CSV 파일로 다운로드"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>CSV 내보내기</span>
              </button>

              <button
                onClick={onStartQuiz}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs sm:text-sm font-bold shadow-xs hover:from-indigo-700 hover:to-blue-700 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>단어 퀴즈 풀기</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {savedWords.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="저장된 단어 또는 한글 뜻 검색..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                onlyFavorites
                  ? 'bg-amber-50 border-amber-300 text-amber-700 font-extrabold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  onlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                }`}
              />
              <span>즐겨찾기만</span>
            </button>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-indigo-500 shrink-0"
            >
              <option value="all">모든 난이도</option>
              <option value="A1">A1 기초</option>
              <option value="A2">A2 초급</option>
              <option value="B1">B1 중급</option>
              <option value="B2">B2 중고급</option>
              <option value="C1">C1 고급</option>
              <option value="C2">C2 원어민급</option>
            </select>
          </div>
        </div>
      )}

      {/* Vocabulary List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3
                      onClick={() => onSelectWord(item.word)}
                      className="font-extrabold text-xl text-slate-900 group-hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {item.word}
                    </h3>
                    {item.cefrLevel && (
                      <span className="text-[10px] font-bold px-2 py-0.3 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.cefrLevel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                      title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.isFavorite
                            ? 'fill-amber-500 text-amber-500'
                            : 'hover:text-amber-500'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => onRemoveWord(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                      title="단어장에서 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.phonetic && (
                  <p className="text-xs font-mono text-slate-700 mb-2">
                    {item.phonetic}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.koreanMeanings.map((meaning, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800"
                    >
                      {meaning}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Card Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() =>
                    speakText(item.word, {
                      lang: speechAccent,
                      rate: speechRate,
                    })
                  }
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>발음 듣기</span>
                </button>

                <button
                  onClick={() => onSelectWord(item.word)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <span>예문 &amp; 해설 보기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : savedWords.length === 0 ? (
        /* Empty State when no words saved at all */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            아직 저장된 단어가 없습니다
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 mb-6 leading-relaxed">
            단어 탐색 화면에서 마이크로 영단어를 말하고 북마크 아이콘을 누르면 이곳에 저장됩니다.
          </p>
          <button
            onClick={onExploreWords}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>추천 단어 탐색하기</span>
          </button>
        </div>
      ) : (
        /* Empty filter results */
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-700 text-sm">
          검색 조건과 일치하는 단어가 없습니다.
        </div>
      )}
    </div>
  );
};
