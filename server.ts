import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasKey: Boolean(apiKey) });
  });

  // Word Analysis API
  app.post('/api/analyze-word', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({
          error: 'Gemini API 키가 설정되지 않았습니다. AI Studio 우측 상단의 Settings > Secrets 패널에서 GEMINI_API_KEY를 직접 등록해주세요.',
        });
      }

      const { word } = req.body;
      if (!word || typeof word !== 'string' || !word.trim()) {
        return res.status(400).json({ error: '분석할 단어나 문장을 입력해주세요.' });
      }

      const cleanWord = word.trim();
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are a world-class English-Korean bilingual lexicographer and ESL educator.
When the user gives an English word, idiom, phrase, or spoken query, analyze it thoroughly.
If the input was spoken or mistyped (e.g., "resilence" or "perseverence"), detect and use the correct canonical English word.
Provide accurate IPA phonetic symbols, Korean phonetic approximation, parts of speech with Korean names, CEFR level (A1 to C2), Korean definitions, nuances in Korean, practical usage tips, diverse real-world example sentences with natural Korean translations, collocations, synonyms, antonyms, and a memorable etymology/origin tip in Korean.
Output strictly in valid JSON adhering to the specified schema.`;

      const prompt = `Analyze this English word/phrase for a Korean learner: "${cleanWord}".
Return a comprehensive lexical analysis with high-quality, practical example sentences and natural Korean translations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: 'Canonical English word or phrase' },
              phonetic: { type: Type.STRING, description: 'IPA phonetic transcription e.g. /rɪˈzɪliənt/' },
              koreanPronunciation: { type: Type.STRING, description: 'Korean phonetic transcription in brackets e.g. [리질리언트]' },
              partsOfSpeech: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of parts of speech in Korean and English e.g. ["형용사 (Adjective)"]',
              },
              cefrLevel: {
                type: Type.STRING,
                description: 'CEFR level: A1, A2, B1, B2, C1, or C2',
              },
              koreanMeanings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Clear Korean meanings arranged by priority',
              },
              nuanceExplanation: {
                type: Type.STRING,
                description: 'Detailed explanation of subtle nuances, emotional color, and how native speakers view this word compared to general synonyms (written in warm, professional Korean)',
              },
              usageTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 practical Korean tips on prepositions, common grammar mistakes, or formality level',
              },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    sentence: { type: Type.STRING, description: 'Natural English example sentence' },
                    koreanTranslation: { type: Type.STRING, description: 'Natural, idiomatic Korean translation' },
                    situation: { type: Type.STRING, description: 'Context scenario e.g. 일상 대화, 비즈니스/직장, 뉴스/시사, 여행/식당' },
                    difficulty: { type: Type.STRING, description: '기초, 중급, or 고급' },
                    highlightWord: { type: Type.STRING, description: 'The exact form of the word used in the sentence' },
                  },
                  required: ['id', 'sentence', 'koreanTranslation', 'situation', 'difficulty'],
                },
                description: '4 to 6 diverse and realistic example sentences with context situations and Korean translations',
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
                description: '3 to 5 common English collocations or phrases with Korean translation',
              },
              synonyms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    korean: { type: Type.STRING },
                    difference: { type: Type.STRING, description: 'Short Korean explanation of nuance difference' },
                  },
                  required: ['word', 'korean', 'difference'],
                },
                description: '2 to 4 synonyms with nuance comparison',
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
                description: '1 to 3 antonyms with Korean translation',
              },
              etymology: {
                type: Type.STRING,
                description: 'Short interesting etymology (word roots) or memory hook in Korean',
              },
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

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Error analyzing word:', err);
      return res.status(500).json({
        error: '단어 분석 중 오류가 발생했습니다.',
        details: err?.message || '알 수 없는 오류',
      });
    }
  });

  // Custom Situation Example Generator
  app.post('/api/custom-example', async (req, res) => {
    try {
      const { word, situation } = req.body;
      if (!word || !situation) {
        return res.status(400).json({ error: '단어와 상황을 모두 제공해주세요.' });
      }

      const prompt = `Create 2 realistic English example sentences containing the word "${word}" specifically for the situation: "${situation}".
Include natural, idiomatic Korean translations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
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
    console.log(`WordFlow Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
