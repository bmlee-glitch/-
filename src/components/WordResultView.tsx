import React, { useState } from 'react';
import {
  Volume2,
  Bookmark,
  BookmarkCheck,
  Mic,
  Sparkles,
  Layers,
  Lightbulb,
  BookOpen,
  ArrowRight,
  PlusCircle,
  Loader2,
  Check,
  Share2,
} from 'lucide-react';
import { WordAnalysis, ExampleItem } from '../types';
import { speakText } from '../utils/speech';

interface WordResultViewProps {
  data: WordAnalysis;
  isSaved: boolean;
  onToggleSave: () => void;
  onPracticeSpeaking: (targetText: string, phonetic?: string, meaning?: string) => void;
  onRewriteExample: (example: ExampleItem, word: string) => void;
  onQuickSaveExample: (example: ExampleItem, word: string) => void;
  savedSentenceIds: Set<string>;
  speechAccent?: 'en-US' | 'en-GB';
  speechRate?: number;
  onSelectWord?: (word: string) => void;
}

export const WordResultView: React.FC<WordResultViewProps> = ({
  data,
  isSaved,
  onToggleSave,
  onPracticeSpeaking,
  onRewriteExample,
  onQuickSaveExample,
  savedSentenceIds,
  speechAccent = 'en-US',
  speechRate = 0.95,
  onSelectWord,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<string>('all');
  const [customScenario, setCustomScenario] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [additionalExamples, setAdditionalExamples] = useState<ExampleItem[]>([]);
  const [copiedText, setCopiedText] = useState(false);

  // Play audio for word or sentence
  const handlePlayAudio = (text: string, id: string) => {
    setPlayingId(id);
    speakText(text, {
      lang: speechAccent,
      rate: speechRate,
      onEnd: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  };

  // Situations list for filtering
  const allExamples = [...data.examples, ...additionalExamples];
  const uniqueSituations = Array.from(new Set(allExamples.map((ex) => ex.situation))).filter(Boolean);

  const filteredExamples =
    selectedSituation === 'all'
      ? allExamples
      : allExamples.filter((ex) => ex.situation === selectedSituation);

  // CEFR color mapping
  const getCefrBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'B1':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'B2':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'C1':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'C2':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Generate custom situation example
  const handleGenerateCustomExample = async (scenario: string) => {
    if (!scenario.trim()) return;
    setIsGeneratingCustom(true);
    try {
      const res = await fetch('/api/custom-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: data.word, situation: scenario.trim() }),
      });
      const result = await res.json();
      if (result.success && result.examples) {
        setAdditionalExamples((prev) => [...prev, ...result.examples]);
        setCustomScenario('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleShare = () => {
    const textToCopy = `${data.word} (${data.phonetic})\n뜻: ${data.koreanMeanings.join(', ')}\n\n예문:\n${data.examples
      .slice(0, 2)
      .map((e) => `• ${e.sentence}\n  ${e.koreanTranslation}`)
      .join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Helper to highlight target word in example sentence
  const renderHighlightedSentence = (sentence: string, targetWord: string) => {
    if (!sentence) return null;
    const cleanWord = targetWord.toLowerCase().replace(/[^a-z]/g, '');
    const words = sentence.split(/(\s+|[.,!?;:'"()])/);

    return words.map((part, index) => {
      const normalizedPart = part.toLowerCase().replace(/[^a-z]/g, '');
      const isMatch =
        cleanWord &&
        (normalizedPart === cleanWord ||
          (cleanWord.length > 4 &&
            (normalizedPart.startsWith(cleanWord.slice(0, -2)) ||
              cleanWord.startsWith(normalizedPart))));

      if (isMatch) {
        return (
          <span
            key={index}
            className="font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded-sm border-b-2 border-indigo-400"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner Card: Word, Pronunciation, Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-100/40 via-sky-100/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div>
            {/* Parts of speech & CEFR Level */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {data.cefrLevel && (
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.8 rounded-full border shadow-2xs ${getCefrBadge(
                    data.cefrLevel
                  )}`}
                >
                  CEFR {data.cefrLevel}
                </span>
              )}
              {data.partsOfSpeech?.map((pos, idx) => (
                <span
                  key={idx}
                  className="text-xs font-semibold px-2.5 py-0.8 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {pos}
                </span>
              ))}
            </div>

            {/* Word Heading */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                {data.word}
              </h1>

              {/* Main TTS Speaker Button */}
              <button
                onClick={() => handlePlayAudio(data.word, 'main-word')}
                title="발음 듣기"
                className={`p-2.5 sm:p-3 rounded-2xl transition-all shadow-sm ${
                  playingId === 'main-word'
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Phonetic and Hangul guide */}
            <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-sm text-slate-700">
              {data.phonetic && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                  {data.phonetic}
                </span>
              )}
              {data.koreanPronunciation && (
                <span className="font-medium text-indigo-600">
                  한글 발음: {data.koreanPronunciation}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Practice, Save, Share */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            {/* Speaking Practice */}
            <button
              onClick={() =>
                onPracticeSpeaking(
                  data.word,
                  data.phonetic,
                  data.koreanMeanings[0]
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 font-bold text-xs sm:text-sm border border-indigo-200/80 transition-all shadow-2xs"
            >
              <Mic className="w-4 h-4 text-indigo-600" />
              <span>발음 연습</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={onToggleSave}
              className={`p-2.5 rounded-xl border transition-all ${
                isSaved
                  ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={isSaved ? '단어장에서 제거' : '단어장에 저장'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-5 h-5 fill-amber-500 text-amber-600" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>

            {/* Share / Copy */}
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              title="단어 및 예문 복사"
            >
              {copiedText ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Korean Meanings List */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            주요 한글 뜻 (Korean Definitions)
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.koreanMeanings?.map((meaning, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-900 font-bold text-sm sm:text-base shadow-2xs"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-extrabold">
                  {idx + 1}
                </span>
                <span>{meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nuance & Practical Tips Dual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nuance Explanation */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 rounded-3xl p-6 border border-indigo-100/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-indigo-900 font-extrabold text-base">
              <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>원어민 어감 &amp; 뉘앙스 해설</span>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal">
              {data.nuanceExplanation}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-100/60 flex items-center justify-between text-xs text-indigo-700 font-medium">
            <span>✨ 원어민의 자연스러운 감각으로 이해하기</span>
          </div>
        </div>

        {/* Usage Tips & Grammar Insights */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-slate-900 font-extrabold text-base">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>실전 활용 꿀팁 &amp; 주의점</span>
            </div>
            <ul className="space-y-2.5">
              {data.usageTips?.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>📌 시험 및 실전 회화 공통 체크포인트</span>
          </div>
        </div>
      </div>

      {/* Situational Example Sentences Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900">
                상황별 실전 예문 &amp; 한글 번역 ({filteredExamples.length})
              </h3>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              문장을 클릭하거나 스피커를 누르면 원어민 속도로 들을 수 있습니다.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedSituation('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedSituation === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 보기
            </button>
            {uniqueSituations.map((sit) => (
              <button
                key={sit}
                onClick={() => setSelectedSituation(sit)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedSituation === sit
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sit}
              </button>
            ))}
          </div>
        </div>

        {/* Example Cards List */}
        <div className="space-y-3.5">
          {filteredExamples.map((item, index) => {
            const isSentencePlaying = playingId === `example-${item.id || index}`;
            return (
              <div
                key={item.id || index}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isSentencePlaying
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 shadow-sm'
                    : 'bg-slate-50/80 hover:bg-slate-50 border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {item.situation || '실전 대화'}
                    </span>
                    {item.difficulty && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        {item.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Actions for this sentence */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handlePlayAudio(item.sentence, `example-${item.id || index}`)
                      }
                      title="이 문장 듣기"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSentencePlaying
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-600 hover:bg-indigo-100'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        onPracticeSpeaking(
                          item.sentence,
                          undefined,
                          item.koreanTranslation
                        )
                      }
                      title="문장 따라 읽기 훈련 (Shadowing)"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* English Sentence */}
                <p className="text-base sm:text-lg font-medium text-slate-900 leading-snug mb-1.5">
                  {renderHighlightedSentence(item.sentence, data.word)}
                </p>

                {/* Korean Translation */}
                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed mb-3">
                  {item.koreanTranslation}
                </p>

                {/* Example Card Action Footer */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQuickSaveExample(item, data.word)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        savedSentenceIds.has(item.sentence)
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                      title={savedSentenceIds.has(item.sentence) ? '보관함에 저장됨' : '예문 보관함에 저장'}
                    >
                      <BookmarkCheck className={`w-3.5 h-3.5 ${savedSentenceIds.has(item.sentence) ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span>{savedSentenceIds.has(item.sentence) ? '보관됨' : '예문 보관'}</span>
                    </button>

                    <button
                      onClick={() => onRewriteExample(item, data.word)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                      title="내 상황에 맞게 다시 쓰고 저장하기"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>내 상황으로 재작성</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${item.sentence}\n${item.koreanTranslation}`);
                      alert('예문이 복사되었습니다.');
                    }}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    복사
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Situation Generator */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              내가 원하는 상황으로 맞춤 예문 추가 생성
            </h4>
          </div>
          <p className="text-xs text-slate-700 mb-3">
            예: "영문 비즈니스 이메일 작성 시", "공항 체크인 카운터에서", "외국인 친구와 주말 약속 잡을 때"
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              placeholder="예: 공항에서 분실물 문의할 때"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateCustomExample(customScenario);
                }
              }}
            />
            <button
              onClick={() => handleGenerateCustomExample(customScenario)}
              disabled={isGeneratingCustom || !customScenario.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isGeneratingCustom ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 예문 생성 중...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>예문 만들기</span>
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-slate-600">추천 상황:</span>
            {['면접 자기소개', '식당 주문', '영문 이메일 결론', '친구에게 조언할 때'].map(
              (preset) => (
                <button
                  key={preset}
                  onClick={() => handleGenerateCustomExample(preset)}
                  disabled={isGeneratingCustom}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 transition-colors"
                >
                  +{preset}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Collocations & Word Combinations */}
      {data.collocations && data.collocations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              함께 자주 쓰이는 짝궁 표현 (Collocations)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.collocations.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handlePlayAudio(item.collocation, `colloc-${idx}`)}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 cursor-pointer group transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">
                    {item.collocation}
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-xs text-slate-700">{item.korean}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synonyms & Antonyms Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Synonyms with nuance diff */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="font-extrabold text-base text-slate-900 mb-3 flex items-center justify-between">
            <span>유의어 &amp; 뉘앙스 차이 (Synonyms)</span>
            <span className="text-xs text-indigo-600 font-semibold">단어 클릭 시 탐색</span>
          </h3>
          <div className="space-y-2.5">
            {data.synonyms?.map((syn, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => onSelectWord?.(syn.word)}
                    className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>{syn.word}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-slate-600 font-medium">{syn.korean}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{syn.difference}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Antonyms */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="font-extrabold text-base text-slate-900 mb-3 flex items-center justify-between">
            <span>반의어 (Antonyms)</span>
            <span className="text-xs text-rose-600 font-semibold">반대 표현</span>
          </h3>
          <div className="space-y-2.5">
            {data.antonyms?.map((ant, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between"
              >
                <div>
                  <button
                    onClick={() => onSelectWord?.(ant.word)}
                    className="text-sm font-bold text-slate-900 hover:text-rose-600 flex items-center gap-1 hover:underline"
                  >
                    <span>{ant.word}</span>
                    <ArrowRight className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
                <span className="text-xs text-rose-700 font-medium">{ant.korean}</span>
              </div>
            ))}
          </div>

          {/* Etymology & Origin Card */}
          {data.etymology && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs">
              <span className="font-extrabold text-amber-900 flex items-center gap-1.5 mb-1 text-xs">
                💡 어원 &amp; 오래 기억하는 비법 (Etymology)
              </span>
              <p className="text-amber-950 leading-relaxed">{data.etymology}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
