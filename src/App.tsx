import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceSearchBar } from './components/VoiceSearchBar';
import { WordResultView } from './components/WordResultView';
import { SavedVocabularyView } from './components/SavedVocabularyView';
import { StudiedSentencesView } from './components/StudiedSentencesView';
import { QuizView } from './components/QuizView';
import { CuratedDiscovery } from './components/CuratedDiscovery';
import { SpeakingModal } from './components/SpeakingModal';
import { RewriteExampleModal } from './components/RewriteExampleModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { WordAnalysis, SavedWord, StudiedSentence, ExampleItem } from './types';
import { analyzeWord, getStoredApiKey } from './services/geminiService';
import { AlertCircle, Loader2, Sparkles, Key } from 'lucide-react';

const SAVED_WORDS_STORAGE_KEY = 'wordflow_saved_words_v1';
const STUDIED_SENTENCES_STORAGE_KEY = 'wordflow_studied_sentences_v1';
const SPEECH_ACCENT_KEY = 'wordflow_speech_accent';
const SPEECH_RATE_KEY = 'wordflow_speech_rate';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'vocab' | 'studied' | 'quiz'>('search');
  const [searchedWord, setSearchedWord] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<WordAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gemini API Key state (for Netlify and user-provided key)
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [apiKeyModalNotice, setApiKeyModalNotice] = useState<string>('');

  // Settings
  const [speechAccent, setSpeechAccent] = useState<'en-US' | 'en-GB'>('en-US');
  const [speechRate, setSpeechRate] = useState<number>(0.95);

  // Saved Words & Studied Sentences
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [studiedSentences, setStudiedSentences] = useState<StudiedSentence[]>([]);

  // Speaking Coach Modal
  const [speakingModal, setSpeakingModal] = useState<{
    isOpen: boolean;
    targetText: string;
    phonetic?: string;
    meaning?: string;
  }>({
    isOpen: false,
    targetText: '',
  });

  // Rewrite Example Modal
  const [rewriteModal, setRewriteModal] = useState<{
    isOpen: boolean;
    example: ExampleItem | null;
    word: string;
  }>({
    isOpen: false,
    example: null,
    word: '',
  });

  // Load saved state on mount
  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem(SAVED_WORDS_STORAGE_KEY);
      if (storedSaved) {
        setSavedWords(JSON.parse(storedSaved));
      }

      const storedSentences = localStorage.getItem(STUDIED_SENTENCES_STORAGE_KEY);
      if (storedSentences) {
        setStudiedSentences(JSON.parse(storedSentences));
      }

      const storedAccent = localStorage.getItem(SPEECH_ACCENT_KEY);
      if (storedAccent === 'en-US' || storedAccent === 'en-GB') {
        setSpeechAccent(storedAccent);
      }

      const storedRate = localStorage.getItem(SPEECH_RATE_KEY);
      if (storedRate) {
        setSpeechRate(parseFloat(storedRate));
      }

      const storedKey = getStoredApiKey();
      if (storedKey) {
        setUserApiKey(storedKey);
      }
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }
  }, []);

  // Save changes to localStorage
  const saveSavedWords = (updated: SavedWord[]) => {
    setSavedWords(updated);
    try {
      localStorage.setItem(SAVED_WORDS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save words to localStorage:', e);
    }
  };

  const saveStudiedSentences = (updated: StudiedSentence[]) => {
    setStudiedSentences(updated);
    try {
      localStorage.setItem(STUDIED_SENTENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save studied sentences to localStorage:', e);
    }
  };

  const handleSetAccent = (accent: 'en-US' | 'en-GB') => {
    setSpeechAccent(accent);
    localStorage.setItem(SPEECH_ACCENT_KEY, accent);
  };

  const handleSetRate = (rate: number) => {
    setSpeechRate(rate);
    localStorage.setItem(SPEECH_RATE_KEY, rate.toString());
  };

  // Perform word search using hybrid geminiService (supporting Netlify & AI Studio)
  const handleSearchWord = async (word: string) => {
    if (!word || !word.trim()) return;
    const cleanWord = word.trim();
    setSearchedWord(cleanWord);
    setIsLoading(true);
    setErrorMessage(null);
    setActiveTab('search');

    try {
      const data = await analyzeWord(cleanWord, userApiKey);
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Search error:', err);
      const msg = err.message || '';
      if (msg.includes('STATIC_HOST_NEEDS_API_KEY')) {
        setApiKeyModalNotice(
          'Netlify 등 외부 웹사이트에서는 백엔드 서버가 없으므로 본인의 Gemini API 키를 직접 입력해주셔야 정상 동작합니다.'
        );
        setIsApiKeyModalOpen(true);
        setErrorMessage(
          'Netlify 등 정적 호스팅 환경입니다. 상단의 [API 키] 버튼을 눌러 본인의 Gemini API 키를 입력하시면 즉시 정상 작동합니다.'
        );
      } else {
        setErrorMessage(msg || '단어 분석 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current word is saved
  const isCurrentWordSaved = Boolean(
    analysisData &&
      savedWords.some(
        (w) => w.word.toLowerCase() === analysisData.word.toLowerCase()
      )
  );

  // Toggle Save current word
  const handleToggleSaveCurrent = () => {
    if (!analysisData) return;

    const existingIndex = savedWords.findIndex(
      (w) => w.word.toLowerCase() === analysisData.word.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = savedWords.filter((_, idx) => idx !== existingIndex);
      saveSavedWords(updated);
    } else {
      const newSavedItem: SavedWord = {
        id: `word-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        word: analysisData.word,
        phonetic: analysisData.phonetic,
        koreanMeanings: analysisData.koreanMeanings,
        cefrLevel: analysisData.cefrLevel,
        examplesCount: analysisData.examples.length,
        savedAt: Date.now(),
        isFavorite: false,
        fullData: analysisData,
      };
      saveSavedWords([newSavedItem, ...savedWords]);
    }
  };

  // Toggle favorite for an item in SavedVocabulary
  const handleToggleFavorite = (id: string) => {
    const updated = savedWords.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    saveSavedWords(updated);
  };

  // Remove saved word
  const handleRemoveSavedWord = (id: string) => {
    const updated = savedWords.filter((w) => w.id !== id);
    saveSavedWords(updated);
  };

  // Studied sentences set of saved texts for fast badge checking
  const savedSentenceTexts = new Set(
    studiedSentences.map((s) => s.originalSentence)
  );

  // Quick save an example from WordResultView
  const handleQuickSaveExample = (example: ExampleItem, word: string) => {
    const existingIndex = studiedSentences.findIndex(
      (s) => s.originalSentence === example.sentence
    );

    if (existingIndex >= 0) {
      // Toggle off
      const updated = studiedSentences.filter((_, idx) => idx !== existingIndex);
      saveStudiedSentences(updated);
    } else {
      const newItem: StudiedSentence = {
        id: `studied-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        word,
        originalSentence: example.sentence,
        originalKorean: example.koreanTranslation,
        situation: example.situation,
        savedAt: Date.now(),
        isBookmarked: true,
      };
      saveStudiedSentences([newItem, ...studiedSentences]);
    }
  };

  // Open Rewrite Modal for an example
  const handleOpenRewriteModal = (example: ExampleItem, word: string) => {
    setRewriteModal({
      isOpen: true,
      example,
      word,
    });
  };

  // Save to Studied Vault from Rewrite Modal
  const handleSaveToVault = (item: StudiedSentence) => {
    const existingIndex = studiedSentences.findIndex(
      (s) => s.id === item.id || s.originalSentence === item.originalSentence
    );

    if (existingIndex >= 0) {
      const updated = [...studiedSentences];
      updated[existingIndex] = item;
      saveStudiedSentences(updated);
    } else {
      saveStudiedSentences([item, ...studiedSentences]);
    }
  };

  // Remove studied sentence
  const handleRemoveStudiedSentence = (id: string) => {
    const updated = studiedSentences.filter((s) => s.id !== id);
    saveStudiedSentences(updated);
  };

  // Edit studied sentence (open in rewrite modal)
  const handleEditStudiedSentence = (item: StudiedSentence) => {
    setRewriteModal({
      isOpen: true,
      example: {
        id: item.id,
        sentence: item.customSentence || item.originalSentence,
        koreanTranslation: item.customKorean || item.originalKorean,
        situation: item.situation,
        difficulty: '중급',
      },
      word: item.word,
    });
  };

  // Open speaking coach modal
  const handleOpenSpeakingCoach = (
    targetText: string,
    phonetic?: string,
    meaning?: string
  ) => {
    setSpeakingModal({
      isOpen: true,
      targetText,
      phonetic,
      meaning,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Global Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedWords.length}
        studiedCount={studiedSentences.length}
        speechAccent={speechAccent}
        setSpeechAccent={handleSetAccent}
        speechRate={speechRate}
        setSpeechRate={handleSetRate}
        onOpenApiKeyModal={() => {
          setApiKeyModalNotice('');
          setIsApiKeyModalOpen(true);
        }}
        hasCustomApiKey={Boolean(userApiKey)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Search Bar section (visible on 'search' tab) */}
        {activeTab === 'search' && (
          <div className="mb-8">
            <VoiceSearchBar
              onSearch={handleSearchWord}
              isLoading={isLoading}
              initialWord={searchedWord}
            />
          </div>
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                "{searchedWord}" 단어를 정밀 분석하고 있습니다...
              </h3>
              <p className="text-xs text-slate-700 mt-1">
                Gemini AI가 상황별 실전 예문과 최적의 한글 번역, 뉘앙스를 정리 중입니다.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!isLoading && errorMessage && activeTab === 'search' && (
          <div className="max-w-2xl mx-auto my-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold mb-1">단어 분석 안내</p>
              <p className="leading-relaxed">{errorMessage}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={() => handleSearchWord(searchedWord)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                >
                  다시 시도하기
                </button>
                <button
                  onClick={() => {
                    setApiKeyModalNotice('Netlify 환경에서는 본인의 Gemini API 키를 입력하셔야 백엔드 없이도 즉시 동작합니다.');
                    setIsApiKeyModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-100/50 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Gemini API 키 직접 입력하기</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Search & Explore */}
        {!isLoading && activeTab === 'search' && (
          <>
            {analysisData ? (
              <WordResultView
                data={analysisData}
                isSaved={isCurrentWordSaved}
                onToggleSave={handleToggleSaveCurrent}
                onPracticeSpeaking={handleOpenSpeakingCoach}
                onRewriteExample={handleOpenRewriteModal}
                onQuickSaveExample={handleQuickSaveExample}
                savedSentenceIds={savedSentenceTexts}
                speechAccent={speechAccent}
                speechRate={speechRate}
                onSelectWord={handleSearchWord}
              />
            ) : (
              <CuratedDiscovery
                onSelectWord={handleSearchWord}
                onVoiceSearchPrompt={() => {}}
              />
            )}
          </>
        )}

        {/* Tab 2: Saved Vocabulary Book */}
        {activeTab === 'vocab' && (
          <SavedVocabularyView
            savedWords={savedWords}
            onSelectWord={(word) => {
              setActiveTab('search');
              handleSearchWord(word);
            }}
            onRemoveWord={handleRemoveSavedWord}
            onToggleFavorite={handleToggleFavorite}
            onStartQuiz={() => setActiveTab('quiz')}
            onExploreWords={() => setActiveTab('search')}
            speechAccent={speechAccent}
            speechRate={speechRate}
          />
        )}

        {/* Tab 3: Studied Sentences Vault (공부한 예문 보관함) */}
        {activeTab === 'studied' && (
          <StudiedSentencesView
            sentences={studiedSentences}
            onRemoveSentence={handleRemoveStudiedSentence}
            onEditSentence={handleEditStudiedSentence}
            onPracticeSpeaking={handleOpenSpeakingCoach}
            onExploreWords={() => setActiveTab('search')}
            speechAccent={speechAccent}
            speechRate={speechRate}
          />
        )}

        {/* Tab 4: Quiz & Review */}
        {activeTab === 'quiz' && (
          <QuizView
            savedWords={savedWords}
            speechAccent={speechAccent}
            speechRate={speechRate}
            onExploreWords={() => setActiveTab('search')}
            onSelectWord={(word) => {
              setActiveTab('search');
              handleSearchWord(word);
            }}
          />
        )}
      </main>

      {/* Speaking Evaluation Coach Modal */}
      <SpeakingModal
        isOpen={speakingModal.isOpen}
        onClose={() => setSpeakingModal({ isOpen: false, targetText: '' })}
        targetText={speakingModal.targetText}
        phonetic={speakingModal.phonetic}
        koreanMeaning={speakingModal.meaning}
        speechAccent={speechAccent}
        speechRate={speechRate}
      />

      {/* Rewrite Example Modal */}
      <RewriteExampleModal
        isOpen={rewriteModal.isOpen}
        onClose={() =>
          setRewriteModal({ isOpen: false, example: null, word: '' })
        }
        example={rewriteModal.example}
        word={rewriteModal.word}
        onSaveToVault={handleSaveToVault}
        speechAccent={speechAccent}
        speechRate={speechRate}
      />

      {/* Gemini API Key Modal (for Netlify / user custom key) */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(key) => setUserApiKey(key)}
        initialMessage={apiKeyModalNotice}
      />
    </div>
  );
}
