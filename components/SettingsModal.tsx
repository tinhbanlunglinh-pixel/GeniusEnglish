import React, { useState, useEffect } from 'react';
import { initializeGeminiChat } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('api_key') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('api_key', apiKey.trim());
      initializeGeminiChat(apiKey.trim());
    } else {
      localStorage.removeItem('api_key');
      initializeGeminiChat(); // Fallback to env
    }
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border-4 border-brand-200">
        <div className="p-6 border-b border-slate-100 bg-brand-50 flex justify-between items-center">
          <h2 className="text-2xl font-black text-brand-900 font-display flex items-center gap-2">
            <span>⚙️</span> Cài đặt Hệ thống
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-black text-brand-700 mb-2 uppercase tracking-wide">
              Gemini API Key
            </label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập API Key của bạn..."
              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none font-medium text-slate-700 transition-all"
            />
            <p className="mt-2 text-xs text-slate-500 font-medium">
              Nếu không nhập, hệ thống sẽ sử dụng Key mặc định. Hãy sử dụng Key riêng nếu hệ thống báo lỗi Quota (hết giới hạn).
            </p>
          </div>
          
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};
