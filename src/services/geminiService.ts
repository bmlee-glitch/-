import { WordAnalysis, ExampleItem } from '../types';

export const API_KEY_STORAGE_KEY = 'wordflow_user_gemini_api_key';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

export function saveStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

// Test if an API key is valid
export async function testGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }],
      }),
    });
    const data = await res.json();
    return Boolean(data.candidates && data.candidates.length > 0);
  } catch (e) {
    return false;
  }
}

// Direct client-side Gemini call for Netlify / static hosting
async function callGeminiDirect(prompt: string, systemInstruction: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message ||
        `Gemini API 오류 (상태 코드: ${response.status}). API 키를 확인해주세요.`
    );
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API로부터 응답 텍스트를 받지 못했습니다.');
  }

  return JSON.parse(text);
}

export async function analyzeWord(word: string, customApiKey?: string): Promise<WordAnalysis> {
  const apiKey = (customApiKey || getStoredApiKey()).trim();

  // If user provided their own API key (e.g. on Netlify), call Google Gemini directly!
  if (apiKey) {
    const systemInstruction = `You are a world-class English-Korean bilingual lexicographer and ESL educator.
When the user gives an English word, idiom, phrase, or spoken query, analyze it thoroughly.
Provide:
- word: Canonical English word
- phonetic: IPA transcription
- koreanPronunciation: Korean phonetic transcription in brackets [한글발음]
- partsOfSpeech: array of parts of speech in English & Korean e.g. ["adjective (형용사)"]
- cefrLevel: A1, A2, B1, B2, C1, or C2
- koreanMeanings: array of clear Korean definitions
- nuanceExplanation: detailed nuance breakdown in warm Korean
- usageTips: array of practical Korean usage tips
- examples: array of 4~5 objects { id, sentence, koreanTranslation, situation, difficulty, highlightWord }
- collocations: array of { collocation, korean }
- synonyms: array of { word, korean, difference }
- antonyms: array of { word, korean }
- etymology: memory hook / origin story in Korean
Return strictly valid JSON.`;

    const prompt = `Analyze this English word/phrase for a Korean learner: "${word}". Output JSON.`;
    const parsedData = await callGeminiDirect(prompt, systemInstruction, apiKey);
    parsedData.generatedAt = Date.now();
    return parsedData;
  }

  // Otherwise, try calling the local server backend route (/api/analyze-word)
  const res = await fetch('/api/analyze-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });

  const text = await res.text();

  // Check if server returned HTML (happens on static hosts like Netlify where /api/* routes do not exist)
  if (text.includes('<!DOCTYPE') || text.includes('<html')) {
    throw new Error(
      'STATIC_HOST_NEEDS_API_KEY: Netlify 등 정적 호스팅 환경에서는 백엔드 서버가 없으므로 [API 키 설정]에서 본인의 Gemini API 키를 직접 입력해주셔야 정상 동작합니다.'
    );
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error('서버 응답을 처리할 수 없습니다: ' + text.slice(0, 80));
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error || '단어를 분석하지 못했습니다.');
  }

  return json.data;
}

export async function rewriteExampleSentence(
  originalSentence: string,
  word: string,
  styleOrSituation: string,
  customApiKey?: string
): Promise<{ rewrittenSentence: string; koreanTranslation: string; nuanceTip: string }> {
  const apiKey = (customApiKey || getStoredApiKey()).trim();

  if (apiKey) {
    const prompt = `Rewrite this English sentence: "${originalSentence}" containing the word "${word}".
Target style/situation: "${styleOrSituation}".
Output JSON with:
- rewrittenSentence: string
- koreanTranslation: string
- nuanceTip: string`;

    return await callGeminiDirect(prompt, 'You are an English writing mentor.', apiKey);
  }

  const res = await fetch('/api/rewrite-example', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalSentence, word, styleOrSituation }),
  });

  const text = await res.text();
  if (text.includes('<!DOCTYPE') || text.includes('<html')) {
    throw new Error('STATIC_HOST_NEEDS_API_KEY');
  }

  const json = JSON.parse(text);
  if (!json.success || !json.data) {
    throw new Error(json.error || '예문 재작성 실패');
  }

  return json.data;
}
