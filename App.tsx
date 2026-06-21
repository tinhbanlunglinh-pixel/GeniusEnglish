
import React, { useState, useEffect } from 'react';
import { generateLessonPlan, fileToBase64, initializeGeminiChat } from './services/geminiService';
import { exportLessonPlanToWord } from './services/exportService';
import { LessonPlan, ProficiencyLevel, QuizDifficulty } from './types';
import { VocabularySection } from './components/VocabularySection';
import { PracticeSection } from './components/PracticeSection';
import { CartoonGenerator } from './components/CartoonGenerator';
import { InfographicPoster } from './components/InfographicPoster';
import { SettingsModal } from './components/SettingsModal';
import { MindMapPromptGenerator } from './components/MindMapPromptGenerator';

function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'prompt'>('planner');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings as EventListener);
    
    // Tự động mở Setting nếu chưa có API Key
    if (!localStorage.getItem('api_key')) {
      setIsSettingsOpen(true);
    }
    
    return () => window.removeEventListener('open-settings', handleOpenSettings as EventListener);
  }, []);
  
  // Lesson Planner State
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<ProficiencyLevel>('Starter');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [uploadedImages, setUploadedImages] = useState<{data: string, mimeType: string}[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: {data: string, mimeType: string}[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        newImages.push({ data: base64, mimeType: file.type || 'image/jpeg' });
      }
      setUploadedImages(prev => [...prev, ...newImages]);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!topic && uploadedImages.length === 0) return;
    setLoading(true);
    setError(null);
    setLesson(null);
    try {
      const data = await generateLessonPlan(topic, level, difficulty, uploadedImages);
      setLesson(data);
    } catch (err) {
      console.error("Lesson Generation Error:", err);
      setError("Không thể tạo bài học. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col font-sans">
      <header className="bg-brand-400 border-b-4 border-brand-500 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-0 md:h-20 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer select-none overflow-hidden border-2 border-brand-100" onClick={() => setActiveTab('planner')}>
              <img src="https://i.postimg.cc/FRgG3qSw/409332660-1038772744108136-6635348450087051296-n.jpg" alt="Cô Lợi" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black text-brand-900 tracking-tight leading-none font-display">Genius English</h1>
              <span className="text-[10px] md:text-xs font-bold text-brand-800 uppercase tracking-widest opacity-80">Cô Lợi - Thắp sáng tiềm năng</span>
            </div>
          </div>
          <div className="flex bg-brand-500 rounded-full p-1 gap-1 overflow-x-auto no-scrollbar max-w-full shadow-inner">
             <button onClick={() => setActiveTab('planner')} className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'planner' ? 'bg-white text-brand-700 shadow-sm' : 'text-brand-100 hover:bg-brand-600'}`}>Lesson Planner</button>
             <button onClick={() => setActiveTab('prompt')} className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-1 ${activeTab === 'prompt' ? 'bg-white text-brand-700 shadow-sm' : 'text-brand-100 hover:bg-brand-600'}`}>🌈 Prompt Gen</button>
             <a href="https://www.tienganhchotreem.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full font-bold text-sm text-brand-100 hover:bg-brand-600 transition-all flex items-center gap-1 whitespace-nowrap">
                📚 Truyện tiếng Anh cho bé
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
             </a>
          </div>
          <div className="shrink-0 flex items-center mt-2 md:mt-0">
             <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 shadow-md border-2 border-slate-700">
               ⚙️ Cài đặt
               <span className="text-brand-300 text-xs font-medium tracking-wide">(Lấy API key để sử dụng app)</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 flex-grow w-full relative">
        {/* Tab Lesson Planner - Persist State using hidden */}
        <div className={activeTab === 'planner' ? 'block' : 'hidden'}>
            <div className="w-full">
                {!lesson && (
                  <div className="bg-white rounded-[2rem] shadow-xl p-8 md:p-12 mb-8 max-w-3xl mx-auto border-b-8 border-brand-200 animate-fade-in">
                    <div className="text-center mb-8">
                      <div className="text-6xl mb-4 animate-bounce-slow">👩‍🏫</div>
                      <h2 className="text-4xl font-black text-slate-800 mb-3 font-display">Genius Planner!</h2>
                      <p className="text-slate-500">Soạn bài dạy đỉnh cao cùng Cô Lợi.</p>
                    </div>
                    <div className="space-y-8">
                      <div>
                        <label className="block text-sm font-black text-brand-600 mb-2 uppercase tracking-wide">Chủ đề bài học</label>
                        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Nhập chủ đề..." className="w-full p-5 text-xl rounded-2xl border-2 border-slate-200 outline-none font-bold text-slate-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-black text-brand-600 mb-2 uppercase tracking-wide">Hoặc tải lên hình ảnh sách</label>
                        <div className="border-3 border-dashed border-brand-200 bg-brand-50 rounded-2xl p-8 text-center hover:bg-brand-50 hover:border-brand-400 transition-all cursor-pointer relative">
                          <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" />
                          <div className="text-slate-500 flex flex-col items-center">
                            <span className="text-4xl mb-2">📸</span>
                            <span className="font-bold text-brand-800/60">{uploadedImages.length > 0 ? `Đã chọn ${uploadedImages.length} ảnh` : "Tải ảnh trang sách"}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-black text-brand-600 mb-2 uppercase tracking-wide">Trình độ mục tiêu</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Starter', 'Mover', 'Flyer'] as ProficiencyLevel[]).map(l => (
                            <button key={l} onClick={() => setLevel(l)} className={`py-3 rounded-xl font-black text-sm border-b-4 ${level === l ? 'bg-orange-500 border-orange-700 text-white shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <button onClick={handleGenerate} disabled={loading || (!topic && uploadedImages.length === 0)} className="w-full py-5 bg-brand-400 border-b-4 border-brand-600 text-brand-900 rounded-2xl font-black text-2xl shadow-xl hover:bg-brand-300">
                        {loading ? "Đang phân tích..." : "🚀 TẠO BÀI DẠY"}
                      </button>
                      {error && (
                        <div className="bg-red-50 p-6 rounded-2xl text-center space-y-4 animate-fade-in border-2 border-red-100">
                          <p className="text-red-600 font-bold text-lg">{error}</p>
                          <div className="flex justify-center gap-4">
                            <button onClick={() => setIsSettingsOpen(true)} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm">
                              🔑 Đổi API Key
                            </button>
                            <button onClick={() => {
                              setError(null);
                              initializeGeminiChat(localStorage.getItem('api_key') || undefined);
                              setTimeout(() => handleGenerate(), 100);
                            }} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm">
                              🔄 Thử lại
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {lesson && (
                  <div className="space-y-12 animate-fade-in pb-20">
                    <div className="text-center py-8">
                      <span className="inline-block px-4 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-black uppercase mb-4">{lesson.level}</span>
                      <h1 className="text-5xl md:text-7xl font-black text-slate-800 font-display capitalize">{lesson.topic}</h1>
                      <button 
                        onClick={() => exportLessonPlanToWord(lesson)} 
                        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-full font-black text-lg shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all mx-auto flex items-center gap-2"
                      >
                        📄 Tải Giáo án (Word)
                      </button>
                    </div>
                    
                    <CartoonGenerator topic={lesson.topic} />
                    <InfographicPoster lesson={lesson} />
                    
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl overflow-hidden border-4 border-slate-100">
                        <div className="bg-brand-400 p-5 md:p-8 border-b-4 border-brand-500">
                            <h2 className="text-3xl md:text-4xl font-black text-brand-900 font-display">Kiến thức & Thực hành</h2>
                        </div>
                        <div className="p-4 md:p-12 space-y-8 md:space-y-12">
                            <VocabularySection items={lesson.vocabulary} />
                            
                            <div className="bg-brand-50 border-l-4 md:border-l-8 border-brand-400 p-5 md:p-8 rounded-r-xl">
                                <h3 className="text-sm font-black text-brand-600 uppercase mb-2">Ngữ pháp (Tiếng Việt)</h3>
                                <p className="text-xl md:text-2xl font-bold font-display text-slate-700">{lesson.grammar.explanation}</p>
                                <div className="mt-4 space-y-2">
                                    {lesson.grammar.examples.map((ex, i) => (
                                        <p key={i} className="text-slate-500 italic font-medium">• {ex}</p>
                                    ))}
                                </div>
                            </div>
                            
                            <PracticeSection content={lesson.practice} />
                        </div>
                    </div>
                    
                    <div className="text-center">
                      <button onClick={() => { setLesson(null); setTopic(''); setUploadedImages([]); }} className="text-slate-400 hover:text-brand-500 font-black text-lg flex items-center gap-2 mx-auto">🔄 Soạn bài khác</button>
                    </div>
                  </div>
                )}
            </div>
        </div>
        
        {/* Prompt Gen Tab */}
        {activeTab === 'prompt' && <MindMapPromptGenerator />}
      </main>
      <footer className="bg-brand-400 text-brand-900 border-t-8 border-brand-500 py-12 mt-auto">
         <div className="max-w-6xl mx-auto px-4 text-center">
            <h3 className="font-display font-black text-2xl mb-2">Genius English Center - Cô Lợi</h3>
            <p className="font-bold opacity-90 mb-4">📞 0379370329 • Facebook: Phùng Lợi</p>
            <div className="flex justify-center gap-6">
               <a href="https://www.facebook.com/loi.nguyenphung" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all border-2 border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
                  Facebook Cô Lợi
               </a>
             </div>
          </div>
       </footer>
       <SettingsModal 
         isOpen={isSettingsOpen} 
         onClose={() => setIsSettingsOpen(false)} 
         onSave={(key, model) => {
           if (key) localStorage.setItem('api_key', key);
           else localStorage.removeItem('api_key');
           localStorage.setItem('selected_model', model);
           setIsSettingsOpen(false);
           
           if (error) {
             setError(null);
             initializeGeminiChat(key || undefined);
             setTimeout(() => handleGenerate(), 100);
           } else {
             initializeGeminiChat(key || undefined);
           }
         }} 
       />
    </div>
  );
}

export default App;
