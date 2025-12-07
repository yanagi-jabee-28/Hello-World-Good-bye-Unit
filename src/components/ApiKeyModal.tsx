
import React, { useState } from 'react';
import { Key, Save, ExternalLink, X, AlertTriangle } from 'lucide-react';
import { setApiKey } from '../utils/apiKey';
import { Sound } from '../utils/sound';

interface Props {
  onClose: () => void;
}

export const ApiKeyModal: React.FC<Props> = ({ onClose }) => {
  const [inputKey, setInputKey] = useState('');
  
  const handleSave = () => {
    if (!inputKey.trim()) return;
    setApiKey(inputKey.trim());
    Sound.play('success');
    onClose();
  };

  const handleSkip = () => {
    Sound.play('button_click');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-[fadeIn_0.3s]">
      <div className="max-w-md w-full border-2 border-green-600 bg-black shadow-[0_0_50px_rgba(34,197,94,0.3)] p-6 relative">
        
        <div className="flex items-center gap-3 mb-4 text-green-500 border-b border-green-900 pb-2">
          <Key size={24} />
          <h2 className="text-xl font-bold tracking-widest">SYSTEM AUTH</h2>
        </div>

        <div className="space-y-4 font-mono text-sm text-gray-300">
          <p>
            本システム(AI分析/TTS)の利用には<br/>
            <span className="text-green-400 font-bold">Google Gemini API Key</span> が必要です。
          </p>
          
          <div className="bg-green-900/10 border border-green-800 p-3 rounded text-xs">
            <div className="flex items-start gap-2 text-yellow-400 mb-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>APIキーはブラウザ(Local Storage)にのみ保存され、外部サーバーには送信されません。</span>
            </div>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 underline mt-1"
            >
              <ExternalLink size={12} />
              APIキーを取得 (Google AI Studio)
            </a>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">Input API Key</label>
            <input 
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-gray-900 border border-green-700 text-green-100 p-3 rounded focus:outline-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!inputKey}
              className="flex-1 bg-green-700 hover:bg-green-600 text-black font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={16} />
              AUTHENTICATE
            </button>
            <button
              onClick={handleSkip}
              className="px-4 border border-gray-700 text-gray-500 hover:text-gray-300 hover:bg-gray-900 transition-colors fs-xs"
            >
              SKIP (機能制限)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
