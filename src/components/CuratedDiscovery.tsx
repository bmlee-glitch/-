import React from 'react';
import { Sparkles, ArrowRight, Mic, Volume2 } from 'lucide-react';
import { CURATED_CATEGORIES } from '../data/curatedWords';

interface CuratedDiscoveryProps {
  onSelectWord: (word: string) => void;
  onVoiceSearchPrompt: () => void;
}

export const CuratedDiscovery: React.FC<CuratedDiscoveryProps> = ({
  onSelectWord,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      {/* Voice Prompt Feature Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini 3.8 Flash AI 실시간 단어 분석</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              궁금한 영어 단어를 얘기해보세요!
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              마이크 버튼을 누르고 단어를 말하면 AI가 품사, 발음기호, 원어민 뉘앙스, 그리고 일상/비즈니스 실전 예문과 자연스러운 한글 번역을 완벽하게 분석해 드립니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-xs space-y-1.5 w-full md:w-64">
              <span className="font-bold text-amber-300 block">💡 이렇게 말해보세요:</span>
              <p className="text-white/90">"Resilient"</p>
              <p className="text-white/90">"Serendipity"</p>
              <p className="text-white/90">"Procrastinate"</p>
            </div>
          </div>
        </div>
      </div>

      {/* Themed Curated Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              오늘의 테마별 추천 영어 단어
            </h3>
            <p className="text-xs text-slate-700">
              단어를 클릭하면 상황별 예문과 한글 번역이 즉시 분석됩니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CURATED_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-700">{cat.description}</p>
                  </div>
                </div>
              </div>

              {/* Words Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cat.words.map((item) => (
                  <button
                    key={item.word}
                    onClick={() => onSelectWord(item.word)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 text-xs sm:text-sm tracking-tight">
                        {item.word}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.level}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-700 truncate block">
                      {item.korean}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
