export interface ExampleItem {
  id: string;
  sentence: string;
  koreanTranslation: string;
  situation: string;
  difficulty: '기초' | '중급' | '고급';
  highlightWord?: string;
}

export interface CollocationItem {
  collocation: string;
  korean: string;
}

export interface SynonymItem {
  word: string;
  korean: string;
  difference: string;
}

export interface AntonymItem {
  word: string;
  korean: string;
}

export interface WordAnalysis {
  word: string;
  phonetic: string;
  koreanPronunciation: string;
  partsOfSpeech: string[];
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  koreanMeanings: string[];
  nuanceExplanation: string;
  usageTips: string[];
  examples: ExampleItem[];
  collocations: CollocationItem[];
  synonyms: SynonymItem[];
  antonyms: AntonymItem[];
  etymology: string;
  generatedAt: number;
}

export interface SavedWord {
  id: string;
  word: string;
  phonetic: string;
  koreanMeanings: string[];
  cefrLevel: string;
  examplesCount: number;
  savedAt: number;
  isFavorite: boolean;
  notes?: string;
  fullData?: WordAnalysis;
}

export interface PronunciationAttempt {
  target: string;
  spoken: string;
  score: number;
  feedback: string;
  date: number;
}
