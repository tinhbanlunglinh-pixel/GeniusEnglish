
import React, { useState } from 'react';
import { generateMindMapPrompt, fileToBase64, initializeGeminiChat } from '../services/geminiService';
import { MindMapMode } from '../types';

export const MindMapPromptGenerator: React.FC = () => {
  const [mode, setMode] = useState<MindMapMode>(MindMapMode.TOPIC);
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      setSelectedFiles(files);
      const newPreviews: string[] = [];
      files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if(ev.target?.result) {
                newPreviews.push(ev.target.result as string);
                if (newPreviews.length === files.length) setImagePreviews([...newPreviews]);
            }
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const handleGenerate = async () => {
    if (mode !== MindMapMode.IMAGE && !inputText.trim()) return;
    if (mode === MindMapMode.IMAGE && selectedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    setGeneratedPrompt('');

    try {
      let content: string | { data: string, mimeType: string }[] = inputText;
      if (mode === MindMapMode.IMAGE) {
        const processedImages = await Promise.all(selectedFiles.map(async (file) => {
             const base64 = await fileToBase64(file);
             return { data: base64, mimeType: file.type || 'image/jpeg' };
        }));
        content = processedImages;
      }
      const result = await generateMindMapPrompt(content, mode);
      setGeneratedPrompt(result);
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra khi tạo câu lệnh.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-brand-50 min-h-screen pb-20 animate-fade-in font-display">
      <div className="text-center py-10 px-4">
        <div className="inline-flex gap-4 text-4xl mb-4 animate-bounce-slow">🧠🎨✨</div>
        <h1 className="text-4xl md:text-5xl font-black text-indigo-600 mb-2">Tony Buzan Prompt Generator</h1>
        <p className="text-slate-500 font-bold text-lg">Tạo câu lệnh AI để vẽ sơ đồ tư duy chuẩn quốc tế!</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2rem] p-8 border-4 border-indigo-200 shadow-xl">
            <h2 className="text-2xl font-black text-indigo-500 mb-6 flex items-center gap-2"><span>💡</span> Input Content</h2>
            <div className="flex bg-slate-50 p-2 rounded-xl mb-6">
                {[
                    { id: MindMapMode.TOPIC, label: 'Topic', icon: '🌟' },
                    { id: MindMapMode.TEXT, label: 'Text', icon: '📝' },
                    { id: MindMapMode.IMAGE, label: 'Image', icon: '📸' },
                ].map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${mode === m.id ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                        <span>{m.icon}</span><span className="hidden sm:inline">{m.label}</span>
                    </button>
                ))}
            </div>
            <div className="mb-6">
                {mode === MindMapMode.IMAGE ? (
                    <div className="border-3 border-dashed border-indigo-200 bg-indigo-50 rounded-2xl p-8 text-center relative">
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                        <span className="text-4xl block mb-2">🖼️</span>
                        <span className="font-bold text-indigo-400">{selectedFiles.length > 0 ? `Đã chọn ${selectedFiles.length} ảnh` : "Tải ảnh lên"}</span>
                    </div>
                ) : (
                    <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder={mode === MindMapMode.TOPIC ? "Nhập chủ đề..." : "Dán văn bản bài học..."} className="w-full h-40 p-4 rounded-2xl border-2 border-slate-200 outline-none font-sans text-slate-700 resize-none bg-slate-50" />
                )}
            </div>
            <button onClick={handleGenerate} disabled={isLoading} className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-600 transition-all">
                {isLoading ? '🤖 Đang thiết kế prompt...' : '🚀 TẠO CÂU LỆNH TONY BUZAN'}
            </button>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border-4 border-emerald-200 shadow-xl">
            <h2 className="text-2xl font-black text-emerald-500 mb-6 flex items-center gap-2"><span>📄</span> AI Prompt Result</h2>
            <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 h-[400px] overflow-y-auto mb-6 font-mono text-sm text-slate-700 leading-relaxed">
                {error ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-4xl">⚠️</span>
                    <p className="text-red-600 font-bold">{error}</p>
                    <div className="flex gap-4 mt-2">
                      <button onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))} className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-colors">
                        🔑 Đổi API Key
                      </button>
                      <button onClick={() => {
                        setError(null);
                        initializeGeminiChat();
                        setTimeout(() => handleGenerate(), 100);
                      }} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors">
                        🔄 Thử lại
                      </button>
                    </div>
                  </div>
                ) : generatedPrompt ? (
                  <p className="whitespace-pre-wrap">{generatedPrompt}</p>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300">Kết quả sẽ xuất hiện ở đây...</div>
                )}
            </div>
            {generatedPrompt && (
                <button onClick={() => { navigator.clipboard.writeText(generatedPrompt); alert("Đã copy!"); }} className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl shadow-lg hover:bg-emerald-600">📋 COPY PROMPT</button>
            )}
        </div>
      </div>
    </div>
  );
};
