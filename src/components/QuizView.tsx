import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Volume2,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Layers,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavedWord } from '../types';
import { CURATED_CATEGORIES } from '../data/curatedWords';
import { speakText } from '../utils/speech';

interface QuizViewProps {
  savedWords: SavedWord[];
  speechAccent?: 'en-US' | 'en-GB';
  speechRate?: number;
  onExploreWords: () => void;
  onSelectWord?: (word: string) => void;
}

interface QuizQuestion {
  id: string;
  word: string;
  phonetic?: string;
  correctMeaning: string;
  options: string[];
  type: 'word-to-meaning' | 'meaning-to-word';
  exampleSnippet?: string;
}

export const QuizView: React.FC<QuizViewProps> = ({
  savedWords,
  speechAccent = 'en-US',
  speechRate = 0.95,
  onExploreWords,
  onSelectWord,
}) => {
  const [activeMode, setActiveMode] = useState<'flashcard' | 'multiple-choice'>('flashcard');

  // Prepare vocabulary pool (combine saved words or fallback to curated)
  const pool = React.useMemo(() => {
    if (savedWords.length >= 4) {
      return savedWords.map((w) => ({
        word: w.word,
        phonetic: w.phonetic,
        korean: w.koreanMeanings[0] || '',
        cefrLevel: w.cefrLevel || 'B1',
        exampleSnippet: w.fullData?.examples?.[0]?.sentence || '',
        exampleKorean: w.fullData?.examples?.[0]?.koreanTranslation || '',
      }));
    }
    // Curated fallback
    const allCurated = CURATED_CATEGORIES.flatMap((c) => c.words);
    return allCurated.map((w) => ({
      word: w.word,
      phonetic: '',
      korean: w.korean,
      cefrLevel: w.level,
      exampleSnippet: '',
      exampleKorean: '',
    }));
  }, [savedWords]);

  // Flashcard State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  // Multiple Choice Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Initialize Multiple Choice Quiz
  const generateQuestions = () => {
    if (pool.length < 4) return;
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffledPool.slice(0, Math.min(10, shuffledPool.length));

    const generated: QuizQuestion[] = selected.map((item, idx) => {
      // Pick 3 wrong meanings from other items
      const otherMeanings = pool
        .filter((p) => p.word !== item.word)
        .map((p) => p.korean)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [item.korean, ...otherMeanings].sort(() => 0.5 - Math.random());

      return {
        id: `q-${idx}`,
        word: item.word,
        phonetic: item.phonetic,
        correctMeaning: item.korean,
        options,
        type: 'word-to-meaning',
        exampleSnippet: item.exampleSnippet,
      };
    });

    setQuestions(generated);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setStreak(0);
    setIsQuizFinished(false);
  };

  useEffect(() => {
    if (activeMode === 'multiple-choice') {
      generateQuestions();
    }
  }, [activeMode, pool]);

  // Flashcard next
  const handleCardNext = (mastered: boolean) => {
    if (mastered) {
      setMasteredCount((prev) => prev + 1);
    }
    setIsFlipped(false);
    if (currentCardIndex < pool.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      confetti({ particleCount: 70, spread: 70 });
      setCurrentCardIndex(0);
    }
  };

  // Quiz option select
  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
    setIsAnswerSubmitted(true);

    const currentQ = questions[currentQuestionIndex];
    if (opt === currentQ.correctMeaning) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
      });
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizFinished(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const currentCard = pool[currentCardIndex] || pool[0];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Banner and Mode Switch */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">
              단어 복습 &amp; 퀴즈
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700">
            {savedWords.length < 4
              ? '저장된 단어가 적어 핵심 추천 단어로 퀴즈가 진행됩니다.'
              : `저장한 단어 ${savedWords.length}개를 기반으로 퀴즈를 생성했습니다.`}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveMode('flashcard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'flashcard'
                ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>플래시카드</span>
          </button>
          <button
            onClick={() => setActiveMode('multiple-choice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'multiple-choice'
                ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4지선다 퀴즈</span>
          </button>
        </div>
      </div>

      {/* FLASHCARD MODE */}
      {activeMode === 'flashcard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-2">
            <span>
              카드 {currentCardIndex + 1} / {pool.length}
            </span>
            <span>완벽 암기: {masteredCount}개</span>
          </div>

          {/* Flashcard Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer bg-white rounded-3xl p-8 sm:p-12 border-2 border-indigo-100 shadow-md hover:shadow-lg transition-all min-h-[300px] flex flex-col justify-between items-center text-center relative group"
          >
            {/* Front/Back Tag */}
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {isFlipped ? '뒷면 (뜻 & 예문)' : '앞면 (카드를 클릭하면 뜻이 보여요)'}
            </span>

            {/* Front: English Word */}
            {!isFlipped ? (
              <div className="my-auto space-y-3">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {currentCard.cefrLevel}
                </span>
                <h3 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {currentCard.word}
                </h3>
                {currentCard.phonetic && (
                  <p className="text-sm font-mono text-indigo-600">{currentCard.phonetic}</p>
                )}
                <div className="pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(currentCard.word, {
                        lang: speechAccent,
                        rate: speechRate,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>발음 듣기</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Back: Korean Meaning and Example */
              <div className="my-auto space-y-4">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
                  {currentCard.korean}
                </h3>
                {currentCard.exampleSnippet && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs sm:text-sm">
                    <p className="font-semibold text-slate-900 mb-1">
                      {currentCard.exampleSnippet}
                    </p>
                    {currentCard.exampleKorean && (
                      <p className="text-slate-700">{currentCard.exampleKorean}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWord?.(currentCard.word);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-indigo-600 underline"
                >
                  상세 예문 &amp; 뉘앙스 보기
                </button>
              </div>
            )}

            <div className="text-xs text-slate-600 font-medium group-hover:text-indigo-600">
              클릭하여 카드 뒤집기 🔄
            </div>
          </div>

          {/* Action Buttons: Hard vs Mastered */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleCardNext(false)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              다음에 다시 보기 (Hard)
            </button>
            <button
              onClick={() => handleCardNext(true)}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-colors"
            >
              외웠어요! (Mastered) ✓
            </button>
          </div>
        </div>
      )}

      {/* MULTIPLE CHOICE QUIZ MODE */}
      {activeMode === 'multiple-choice' && (
        <div>
          {!isQuizFinished && questions.length > 0 ? (
            <div className="space-y-4">
              {/* Status Header */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-2">
                <span>
                  문제 {currentQuestionIndex + 1} / {questions.length}
                </span>
                <div className="flex items-center gap-3">
                  {streak > 1 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Flame className="w-4 h-4 fill-amber-500" />
                      <span>{streak}연속 정답!</span>
                    </span>
                  )}
                  <span className="text-indigo-600">점수: {score}점</span>
                </div>
              </div>

              {/* Question Card */}
              {(() => {
                const q = questions[currentQuestionIndex];
                return (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        알맞은 한글 뜻을 고르세요
                      </span>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
                          {q.word}
                        </h3>
                        <button
                          onClick={() =>
                            speakText(q.word, {
                              lang: speechAccent,
                              rate: speechRate,
                            })
                          }
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                      {q.phonetic && (
                        <p className="text-xs font-mono text-slate-700">{q.phonetic}</p>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, idx) => {
                        const isChosen = selectedOption === opt;
                        const isCorrect = opt === q.correctMeaning;

                        let style = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';

                        if (isAnswerSubmitted) {
                          if (isCorrect) {
                            style = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                          } else if (isChosen && !isCorrect) {
                            style = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                          } else {
                            style = 'bg-slate-50 border-slate-100 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(opt)}
                            disabled={isAnswerSubmitted}
                            className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {isAnswerSubmitted && isCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {isAnswerSubmitted && isChosen && !isCorrect && (
                              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Question Button */}
                    {isAnswerSubmitted && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors"
                        >
                          <span>다음 문제</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : isQuizFinished ? (
            /* Quiz Result Screen */
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-md space-y-6">
              <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Award className="w-10 h-10 text-amber-500" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">
                  퀴즈 완료! 축하합니다 🎉
                </h3>
                <p className="text-sm text-slate-700">
                  총 {questions.length}문제 중 {Math.round(score / 10)}문제를 맞혔습니다.
                </p>
              </div>

              <div className="text-4xl font-extrabold text-indigo-600">{score}점</div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={generateQuestions}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 풀기</span>
                </button>
                <button
                  onClick={onExploreWords}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
                >
                  새로운 단어 탐색하기
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-700">문제를 불러오는 중입니다...</div>
          )}
        </div>
      )}
    </div>
  );
};
