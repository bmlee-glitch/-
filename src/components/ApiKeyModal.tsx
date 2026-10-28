import React, { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react';
import { getStoredApiKey, saveStoredApiKey, testGeminiApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  initialMessage?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  initialMessage,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getStoredApiKey());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      saveStoredApiKey('');
      onKeySaved('');
      setStatusMessage({ type: 'success', text: 'API 키가 삭제되었습니다. (기본 서버 모드로 전환)' });
      setTimeout(onClose, 800);
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    const isValid = await testGeminiApiKey(key);
    setIsTesting(false);

    if (isValid) {
      saveStoredApiKey(key);
      onKeySaved(key);
      setStatusMessage({ type: 'success', text: '✓ 유효한 Gemini API 키입니다. 성공적으로 저장되었습니다!' });
      setTimeout(onClose, 1000);
    } else {
      setStatusMessage({
        type: 'error',
        text: '유효하지 않은 API 키이거나 네트워크 오류입니다. 키를 다시 확인해주세요.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-lg">Gemini API 키 직접 설정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {initialMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">안내</p>
                <p>{initialMessage}</p>
              </div>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <strong>Netlify 등 외부 웹사이트</strong>에 배포하여 사용하실 때는 별도의 백엔드 서버가 없으므로, <strong>본인의 Gemini API 키</strong>를 입력하셔야 정상 동작합니다.
          </p>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Gemini API Key 입력
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... 로 시작하는 API 키를 입력하세요"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-500 pr-10"
              />
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={() => setApiKeyInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  지우기
                </button>
              )}
            </div>
          </div>

          {/* Test Status feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Get Key Link */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">API 키가 없으신가요?</span>
              <span className="text-[11px] text-slate-700">Google AI Studio에서 무료로 1초 만에 발급받을 수 있습니다.</span>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-indigo-600 hover:bg-slate-50 font-bold shrink-0 shadow-2xs"
            >
              <span>키 발급받기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-700 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              입력하신 키는 외부 서버로 전송되지 않으며, 현재 사용 중인 브라우저의 로컬 저장소(localStorage)에만 안전하게 보관됩니다.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            닫기
          </button>
          <button
            onClick={handleSaveAndTest}
            disabled={isTesting}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>키 검증 중...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>검증 및 저장</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
