import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, model: string) => void;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Nhanh, dự phòng' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Thông minh, mặc định' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Ổn định, dự phòng' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview');

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('api_key') || '');
      setSelectedModel(localStorage.getItem('selected_model') || 'gemini-3-pro-preview');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(apiKey.trim(), selectedModel);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border-4 border-brand-200">
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
            <p className="mt-3 text-sm text-slate-600 font-medium">
              Bạn chưa có API Key? <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">Vào đây để lấy Key miễn phí</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-black text-brand-700 mb-2 uppercase tracking-wide">
              Mô hình AI (Model)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MODELS.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModel === m.id ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-slate-200 hover:border-brand-300'}`}
                >
                  <div className="font-bold text-slate-800">{m.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 mt-4"
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};
