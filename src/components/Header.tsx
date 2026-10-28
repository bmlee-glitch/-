import React from 'react';
import { Volume2, Sparkles, BookOpen, Search, HelpCircle, Settings2, Key } from 'lucide-react';

interface HeaderProps {
  activeTab: 'search' | 'vocab' | 'studied' | 'quiz';
  setActiveTab: (tab: 'search' | 'vocab' | 'studied' | 'quiz') => void;
  savedCount: number;
  studiedCount: number;
  speechAccent: 'en-US' | 'en-GB';
  setSpeechAccent: (accent: 'en-US' | 'en-GB') => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  onOpenApiKeyModal: () => void;
  hasCustomApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  studiedCount,
  speechAccent,
  setSpeechAccent,
  speechRate,
  setSpeechRate,
  onOpenApiKeyModal,
  hasCustomApiKey,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('search')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                WordFlow
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase">
                AI Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-700 hidden sm:block">
              음성 단어 인식 · 상황별 예문 · 한글 번역
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">단어 탐색</span>
            <span className="sm:hidden">탐색</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${
              activeTab === 'vocab'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>단어장</span>
            {savedCount > 0 && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'vocab'
                    ? 'bg-white text-indigo-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('studied')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${
              activeTab === 'studied'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>공부한 예문</span>
            {studiedCount > 0 && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'studied'
                    ? 'bg-white text-indigo-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {studiedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">퀴즈 &amp; 복습</span>
            <span className="sm:hidden">퀴즈</span>
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              hasCustomApiKey
                ? 'bg-emerald-50 border-emerald-300 text-emerald-750'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            }`}
            title="Gemini API 키 직접 설정"
          >
            <Key className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">API 키</span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasCustomApiKey ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            ></span>
          </button>

          {/* Settings Button */}
          <div className="relative ml-0.5 sm:ml-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="발음 및 음성 설정"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-xs space-y-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    <Volume2 className="w-4 h-4 text-indigo-600" /> 음성 발음 설정
                  </span>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1.5">
                    영어 억양 (Accent)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSpeechAccent('en-US')}
                      className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-colors ${
                        speechAccent === 'en-US'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🇺🇸 미국식 (US)
                    </button>
                    <button
                      onClick={() => setSpeechAccent('en-GB')}
                      className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-colors ${
                        speechAccent === 'en-GB'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🇬🇧 영국식 (UK)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 font-medium">재생 속도</label>
                    <span className="text-indigo-600 font-semibold">{speechRate}x</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0.75, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSpeechRate(rate)}
                        className={`py-1 rounded-md text-center font-medium border transition-colors ${
                          speechRate === rate
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-700 leading-normal bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                  <p className="font-bold text-indigo-950 mb-0.5">🔑 Gemini API 키 안내</p>
                  <p>
                    API 키는 Google AI Studio의 <strong className="text-indigo-700">Settings &gt; Secrets</strong> 패널에서 직접 입력 및 안전하게 관리하실 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
