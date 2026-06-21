
import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
// Fixed: Using 'generateMindMap' instead of the non-existent 'generateCreativeMindMap'
import { generateMindMap, fileToBase64 } from '../services/geminiService';
import { MindMapData, MindMapMode } from '../types';

export const CreativeMindMap: React.FC = () => {
  const [mode, setMode] = useState<MindMapMode>(MindMapMode.TOPIC);
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<MindMapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // In-memory history
  const [history, setHistory] = useState<MindMapData[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleGenerate = async () => {
    if (mode === MindMapMode.TOPIC && !inputText) return;
    if (mode === MindMapMode.TEXT && !inputText) return;
    if (mode === MindMapMode.IMAGE && selectedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      let content: string | { data: string, mimeType: string }[] = inputText;
      
      if (mode === MindMapMode.IMAGE) {
        const processedImages = await Promise.all(selectedFiles.map(async (file) => {
             const base64 = await fileToBase64(file);
             return { data: base64, mimeType: file.type || 'image/jpeg' };
        }));
        content = processedImages;
      }

      // Fixed: Using the correct function name 'generateMindMap' from services/geminiService.ts
      const result = await generateMindMap(content, mode);
      setData(result);
      setHistory(prev => [result, ...prev]);
    } catch (e) {
      console.error(e);
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImage = async () => {
    if (canvasRef.current === null) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true, backgroundColor: 'white' });
      const link = document.createElement('a');
      link.download = `ms-ly-mindmap-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Không thể lưu ảnh. Vui lòng thử lại.");
    }
  };

  return (
    <div className="w-full bg-white min-h-screen animate-fade-in font-sans pb-20">
      
      {/* --- BANNER (Top of Tab) --- */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 md:p-8 rounded-b-[2rem] shadow-xl mb-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-20 transform translate-x-10 -translate-y-10">
             <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
         </div>
         <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
             <div className="text-center md:text-left">
                 <h1 className="text-3xl md:text-5xl font-black font-display mb-2 drop-shadow-md">
                     Cộng đồng Ms Lý AI
                 </h1>
                 <p className="text-pink-100 font-bold text-lg mb-1">📞 0962859488</p>
                 <p className="text-sm opacity-90 max-w-lg">
                     Truy cập vào nhóm để nhận FREE nhiều App ứng dụng trong kinh doanh, trong công việc và trong giáo dục...
                 </p>
             </div>
             
             <div className="flex flex-col gap-3 w-full md:w-auto">
                 <a href="https://zalo.me/g/wupdcx020" target="_blank" rel="noreferrer" className="bg-white text-blue-600 px-6 py-3 rounded-full font-black hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2">
                    <span className="text-xl">💬</span> Tham gia nhóm Zalo
                 </a>
                 <a href="https://www.facebook.com/nguyen.ly.254892/" target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-6 py-3 rounded-full font-black hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 border-2 border-white/20">
                    <span className="text-xl">fb</span> Facebook Ms Lý
                 </a>
             </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
         {/* --- HEADER --- */}
         <div className="text-center mb-8">
             <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">CÔNG CỤ HỌC TẬP AI</span>
             <h2 className="text-4xl font-black text-slate-800 font-display mt-2">Creative Mindmap</h2>
             <p className="text-slate-500 mt-2">Biến mọi chủ đề, câu chuyện hoặc hình ảnh thành sơ đồ từ vựng tiếng Anh thú vị!</p>
         </div>

         {/* --- CONTROLS --- */}
         <div className="bg-slate-50 rounded-[2rem] p-6 border-4 border-slate-100 shadow-inner mb-8">
             {/* Tabs */}
             <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6 max-w-md mx-auto">
                 {[
                     { id: MindMapMode.TOPIC, label: 'Chủ đề' },
                     { id: MindMapMode.TEXT, label: 'Văn bản' },
                     { id: MindMapMode.IMAGE, label: 'Hình ảnh' }
                 ].map(m => (
                     <button
                        key={m.id}
                        onClick={() => { setMode(m.id); setError(null); setData(null); }}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${mode === m.id ? 'bg-indigo-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                     >
                        {m.label}
                     </button>
                 ))}
             </div>

             {/* Inputs */}
             <div className="max-w-2xl mx-auto space-y-4">
                 {mode === MindMapMode.TOPIC && (
                     <input 
                        type="text" 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Nhập chủ đề (ví dụ: Animals, Colors, Family...)"
                        className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none font-bold text-lg"
                     />
                 )}
                 {mode === MindMapMode.TEXT && (
                     <textarea 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Dán văn bản hoặc danh sách từ vựng vào đây..."
                        rows={3}
                        className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none font-medium"
                     />
                 )}
                 {mode === MindMapMode.IMAGE && (
                     <div className="border-3 border-dashed border-slate-300 rounded-xl p-8 text-center bg-white cursor-pointer hover:border-indigo-400 relative">
                         <input type="file" accept="image/*" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                         <span className="text-4xl block mb-2">📸</span>
                         <span className="font-bold text-slate-500">
                             {selectedFiles.length > 0 ? `${selectedFiles.length} ảnh đã chọn` : "Tải ảnh lên"}
                         </span>
                     </div>
                 )}

                 <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-black text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none"
                 >
                    {isLoading ? 'Giáo viên AI đang suy nghĩ kỹ...' : 'Tạo ngay! 🚀'}
                 </button>
             </div>
             
             {error && <p className="text-red-500 text-center font-bold mt-4">{error}</p>}
         </div>

         {/* --- CANVAS --- */}
         {data && (
             <div className="animate-fade-in flex flex-col items-center">
                 <div className="flex justify-end w-full max-w-4xl mb-4">
                     <button onClick={handleSaveImage} className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-emerald-600 transition-colors flex items-center gap-2">
                        💾 Lưu hình ảnh
                     </button>
                 </div>

                 <div 
                    ref={canvasRef}
                    className="bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-slate-50 relative overflow-hidden w-full max-w-4xl aspect-[4/3] flex items-center justify-center"
                 >
                     {/* Background Pattern */}
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                     
                     {/* SVG Connector Lines */}
                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                         {data.nodes.map((_, i) => {
                             // Dynamic calculations for positions
                             const total = data.nodes.length;
                             const angle = (i * (360 / total) - 90) * (Math.PI / 180);
                             const cx = 50 + 50 * Math.cos(angle) * 0.6; // 60% radius from center (50,50)
                             const cy = 50 + 50 * Math.sin(angle) * 0.6;
                             
                             // Convert to percentage strings for SVG
                             // Start from center (50%, 50%) to Node Center
                             return (
                                 <path 
                                    key={i}
                                    d={`M 50% 50% Q ${50 + (cx - 50) * 0.5}% ${50 + (cy - 50) * 0.5}% ${cx}% ${cy}%`}
                                    fill="none"
                                    stroke={data.nodes[i].color || '#cbd5e1'}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray="8 4"
                                    className="opacity-50"
                                 />
                             );
                         })}
                     </svg>

                     {/* Center Node */}
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center w-48 h-48 bg-white border-8 border-indigo-200 rounded-full flex flex-col items-center justify-center shadow-2xl p-2">
                         <div className="text-5xl mb-1">{data.center.emoji || '🌟'}</div>
                         <div className="font-black text-slate-800 text-xl leading-none uppercase">{data.center.title_en}</div>
                         <div className="font-bold text-indigo-500 text-sm mt-1">{data.center.title_vi}</div>
                     </div>

                     {/* Child Nodes */}
                     {data.nodes.map((node, i) => {
                         const total = data.nodes.length;
                         const angle = (i * (360 / total) - 90) * (Math.PI / 180);
                         // Position in percentage (0-100)
                         // Radius is roughly 35-40% of container width to fit comfortably
                         const x = 50 + 38 * Math.cos(angle); 
                         const y = 50 + 38 * Math.sin(angle);

                         return (
                             <div 
                                key={i}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center w-32 md:w-40"
                                style={{ left: `${x}%`, top: `${y}%` }}
                             >
                                 <div 
                                    className="bg-white p-2 rounded-2xl shadow-lg border-4 w-full aspect-square flex items-center justify-center mb-2 relative overflow-hidden group"
                                    style={{ borderColor: node.color || '#e2e8f0' }}
                                 >
                                     <span className="text-5xl select-none transform group-hover:scale-110 transition-transform">{node.emoji || '📌'}</span>
                                     <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">{i+1}</div>
                                 </div>
                                 <div className="text-center bg-white/90 backdrop-blur px-2 py-1 rounded-lg">
                                     <div className="font-black text-slate-800 text-lg leading-tight capitalize">{node.text_en}</div>
                                     <div className="font-bold text-sm" style={{ color: node.color || '#64748b' }}>{node.text_vi}</div>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
                 
                 <div className="mt-8 text-center text-slate-400 text-sm">
                     <p>Bản quyền Ms Lý AI - 0962859488</p>
                     <a href="https://www.facebook.com/nguyen.ly.254892/" target="_blank" rel="noreferrer" className="hover:text-blue-500">Facebook Ms Lý</a>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
