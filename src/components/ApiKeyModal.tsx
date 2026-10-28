import React, { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle, ExternalLink, ShieldCheck, Loader2, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { getStoredApiKey, saveStoredApiKey, testGeminiApiKey, cleanApiKey } from '../services/geminiService';

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
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getStoredApiKey());
      setStatusMessage(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (forceSave = false) => {
    const cleaned = cleanApiKey(apiKeyInput);

    if (!cleaned) {
      saveStoredApiKey('');
      onKeySaved('');
      setStatusMessage({ type: 'success', text: 'API 키가 삭제되었습니다. (기본 서버 모드로 전환)' });
      setTimeout(onClose, 800);
      return;
    }

    if (forceSave) {
      saveStoredApiKey(cleaned);
      onKeySaved(cleaned);
      setStatusMessage({ type: 'success', text: 'API 키가 저장되었습니다.' });
      setTimeout(onClose, 900);
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    const result = await testGeminiApiKey(cleaned);
    setIsTesting(false);

    if (result.isValid) {
      saveStoredApiKey(cleaned);
      onKeySaved(cleaned);
      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(onClose, 1000);
    } else {
      setStatusMessage({
        type: 'error',
        text: 'API 키 검증 실패',
        details: result.message,
      });
    }
  };

  const handleDirectSave = () => {
    const cleaned = cleanApiKey(apiKeyInput);
    if (cleaned) {
      saveStoredApiKey(cleaned);
      onKeySaved(cleaned);
      setStatusMessage({ type: 'success', text: '검증을 건너뛰고 키를 저장했습니다.' });
      setTimeout(onClose, 900);
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
                <p className="font-bold mb-0.5">배포 환경 안내</p>
                <p>{initialMessage}</p>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Gemini API Key 입력
              </label>
              <span className="text-[11px] text-slate-700">
                <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-bold">AQ...</code> 또는 <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-bold">AIzaSy...</code> 키 모두 지원
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setStatusMessage(null);
                }}
                placeholder="AQ... 또는 AIzaSy... 키를 붙여넣으세요"
                className="w-full pl-4 pr-20 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title={showPassword ? '키 숨기기' : '키 보기'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyInput('');
                      setStatusMessage(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
            {apiKeyInput && (
              <p className="text-[11px] text-slate-700 mt-1 pl-1 flex items-center gap-1.5">
                <span>입력된 글자 수: <strong className="text-indigo-600">{apiKeyInput.trim().length}자</strong></span>
                {apiKeyInput.trim().startsWith('AQ') && (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    ✓ Google AI Studio 정식 키 형식(AQ...) 감지됨
                  </span>
                )}
                {apiKeyInput.trim().startsWith('AIzaSy') && (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    ✓ Google Cloud 정식 키 형식(AIzaSy...) 감지됨
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Error / Success message with detailed guidance */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs space-y-1 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {statusMessage.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              {statusMessage.details && (
                <p className="text-rose-700 pl-5.5 leading-relaxed font-mono text-[11px]">
                  {statusMessage.details}
                </p>
              )}

              {statusMessage.type === 'error' && (
                <div className="pt-2 pl-5.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDirectSave}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline"
                  >
                    → 검증 무시하고 그대로 저장하기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Step Guide to Get a Free Key */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold flex items-center gap-1 text-indigo-900">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>100% 무료 Gemini API 키 발급 방법 (10초 소요)</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 shrink-0 shadow-2xs"
              >
                <span>키 발급 페이지 열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
              <li>위 버튼을 눌러 Google AI Studio에 구글 계정으로 로그인합니다.</li>
              <li><strong>"Create API key"</strong>(API 키 만들기) 버튼을 클릭합니다.</li>
              <li>생성된 <strong className="text-indigo-800">AIzaSy...</strong>로 시작하는 키를 복사하여 위 입력창에 붙여넣으세요.</li>
            </ol>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              입력하신 키는 개발자나 서버로 전송되지 않으며, 현재 사용 중인 브라우저(localStorage)에만 안전하게 보관됩니다.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            닫기
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestAndSave(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs transition-colors"
              title="검증을 건너뛰고 바로 저장합니다"
            >
              바로 저장하기
            </button>
            <button
              onClick={() => handleTestAndSave(false)}
              disabled={isTesting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>검증 중...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>검증 후 저장</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
