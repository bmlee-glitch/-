import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for fast lookups
const wordCache = new Map<string, any>();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // Word Analysis API
  app.post('/api/analyze-word', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({
          error: 'Gemini API 키가 설정되지 않았습니다. AI Studio 우측 상단의 Settings > Secrets 패널에서 GEMINI_API_KEY를 등록해주세요.',
        });
      }

      const { word } = req.body;
      if (!word || typeof word !== 'string' || !word.trim()) {
        return res.status(400).json({ error: '분석할 단어나 문장을 입력해주세요.' });
      }

      const cleanWord = word.trim().toLowerCase();

      // Return cached result if available
      if (wordCache.has(cleanWord)) {
        return res.json({ success: true, data: wordCache.get(cleanWord), cached: true });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are an expert English-Korean lexicographer and bilingual ESL educator.
Analyze the given English word or phrase thoroughly and practically.
Provide:
1. Canonical English word or phrase
2. IPA phonetic transcription and natural Korean phonetic guide [한글발음]
3. Parts of speech in Korean and English
4. CEFR level (A1 to C2)
5. Clear Korean meanings by priority
6. Deep nuance explanation in warm, friendly Korean
7. 2~3 practical usage tips in Korean
8. 4~5 diverse, realistic example sentences with natural Korean translations across situations (daily, business, news/academic)
9. Useful collocations with Korean translation
10. Synonyms with nuance differences in Korean
11. Antonyms with Korean translation
12. Memorable etymology / memory hook in Korean.
Output strictly in valid JSON.`;

      const prompt = `Analyze this English word or phrase for a Korean learner: "${word.trim()}". Return comprehensive JSON.`;

      // Use gemini-3.1-flash-lite for fast, reliable response under 3 seconds
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              koreanPronunciation: { type: Type.STRING },
              partsOfSpeech: { type: Type.ARRAY, items: { type: Type.STRING } },
              cefrLevel: { type: Type.STRING },
              koreanMeanings: { type: Type.ARRAY, items: { type: Type.STRING } },
              nuanceExplanation: { type: Type.STRING },
              usageTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    sentence: { type: Type.STRING },
                    koreanTranslation: { type: Type.STRING },
                    situation: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    highlightWord: { type: Type.STRING },
                  },
                  required: ['id', 'sentence', 'koreanTranslation', 'situation', 'difficulty'],
                },
              },
              collocations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    collocation: { type: Type.STRING },
                    korean: { type: Type.STRING },
                  },
                  required: ['collocation', 'korean'],
                },
              },
              synonyms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    korean: { type: Type.STRING },
                    difference: { type: Type.STRING },
                  },
                  required: ['word', 'korean', 'difference'],
                },
              },
              antonyms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    korean: { type: Type.STRING },
                  },
                  required: ['word', 'korean'],
                },
              },
              etymology: { type: Type.STRING },
            },
            required: [
              'word',
              'phonetic',
              'koreanPronunciation',
              'partsOfSpeech',
              'cefrLevel',
              'koreanMeanings',
              'nuanceExplanation',
              'usageTips',
              'examples',
              'collocations',
              'synonyms',
              'antonyms',
              'etymology',
            ],
          },
        },
      });

      const text = response.text?.trim() || '{}';
      const parsedData = JSON.parse(text);
      parsedData.generatedAt = Date.now();

      // Store in memory cache
      wordCache.set(cleanWord, parsedData);

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Error analyzing word:', err);
      return res.status(500).json({
        error: '단어 분석 중 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        details: err?.message || '알 수 없는 오류',
      });
    }
  });

  // Example Rewriting / Variation API (내가 공부한 예문 재작성)
  app.post('/api/rewrite-example', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: 'API 키가 필요합니다.' });
      }

      const { originalSentence, word, styleOrSituation } = req.body;
      if (!originalSentence) {
        return res.status(400).json({ error: '원문 문장을 제공해주세요.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `You are an English writing mentor.
Original English sentence: "${originalSentence}"
Target vocabulary word to keep or emphasize: "${word || ''}"
Desired adaptation / context: "${styleOrSituation || '내 상황에 맞게 실용적으로 재작성'}"

Rewrite this sentence naturally to fit the desired context or style, keeping the sentence grammatically accurate and natural for native speakers.
Provide:
1. rewrittenSentence: The adapted English sentence
2. koreanTranslation: Natural, idiomatic Korean translation
3. nuanceTip: A short Korean tip explaining why this expression is useful in this context.
Return valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rewrittenSentence: { type: Type.STRING },
              koreanTranslation: { type: Type.STRING },
              nuanceTip: { type: Type.STRING },
            },
            required: ['rewrittenSentence', 'koreanTranslation', 'nuanceTip'],
          },
        },
      });

      const data = JSON.parse(response.text?.trim() || '{}');
      return res.json({ success: true, data });
    } catch (err: any) {
      console.error('Rewrite error:', err);
      return res.status(500).json({ error: '예문 재작성 실패', details: err?.message });
    }
  });

  // Custom Situation Example Generator
  app.post('/api/custom-example', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: 'API 키가 필요합니다.' });
      }

      const { word, situation } = req.body;
      if (!word || !situation) {
        return res.status(400).json({ error: '단어와 상황을 모두 제공해주세요.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `Create 2 realistic English example sentences containing the word "${word}" specifically for the situation: "${situation}".
Include natural, idiomatic Korean translations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sentence: { type: Type.STRING },
                koreanTranslation: { type: Type.STRING },
                situation: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                highlightWord: { type: Type.STRING },
              },
              required: ['id', 'sentence', 'koreanTranslation', 'situation', 'difficulty'],
            },
          },
        },
      });

      const examples = JSON.parse(response.text?.trim() || '[]');
      return res.json({ success: true, examples });
    } catch (err: any) {
      console.error('Error generating custom example:', err);
      return res.status(500).json({
        error: '예문 생성 실패',
        details: err?.message,
      });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WordFlow Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
