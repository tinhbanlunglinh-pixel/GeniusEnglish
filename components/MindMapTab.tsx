
import React, { useState, useRef } from 'react';
import { generateMindMap, fileToBase64, generatePresentation, initializeGeminiChat } from '../services/geminiService';
import { MindMapData, MindMapMode, PresentationScript, PresentationLevel } from '../types';
import { MindMap } from './MindMap';
import { PresentationScriptView } from './PresentationScript';

export const MindMapTab: React.FC = () => {
  const [mode, setMode] = useState<MindMapMode>(MindMapMode.TOPIC);
  const [inputContent, setInputContent] = useState('');
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File upload state - Now supports multiple
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Presentation State
  const [presentation, setPresentation] = useState<PresentationScript | null>(null);
  const [presLevel, setPresLevel] = useState<PresentationLevel>('Very Basic');
  const [isGeneratingPres, setIsGeneratingPres] = useState(false);

  const handleGenerate = async () => {
    if (mode !== MindMapMode.IMAGE && !inputContent.trim()) return;
    if (mode === MindMapMode.IMAGE && selectedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    setMindMapData(null);
    setPresentation(null); // Reset presentation when generating new map

    try {
      let content: string | { data: string, mimeType: string }[] = inputContent;

      if (mode === MindMapMode.IMAGE && selectedFiles.length > 0) {
        const processedImages = await Promise.all(selectedFiles.map(async (file) => {
             const base64 = await fileToBase64(file);
             return {
                 data: base64,
                 mimeType: file.type || 'image/jpeg'
             };
        }));
        content = processedImages;
      }

      const result = await generateMindMap(content, mode);
      setMindMapData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePresentation = async () => {
      if (!mindMapData) return;
      setIsGeneratingPres(true);
      try {
          const script = await generatePresentation(mindMapData, presLevel);
          setPresentation(script);
          // Scroll to presentation
          setTimeout(() => {
             document.getElementById('pres-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      } catch (e) {
          console.error(e);
          alert("Couldn't generate script. Please try again.");
      } finally {
          setIsGeneratingPres(false);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Explicitly cast to File[] to avoid TS inference issues with Array.from on FileList
      const files: File[] = Array.from(e.target.files);
      setSelectedFiles(files);
      
      // Generate previews
      const newPreviews: string[] = [];
      files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if(ev.target?.result) {
                newPreviews.push(ev.target.result as string);
                // Update state only when we have all or handle async correctly
                if (newPreviews.length === files.length) {
                    setImagePreviews([...newPreviews]);
                }
            }
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const clearFiles = () => {
      setSelectedFiles([]);
      setImagePreviews([]);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center space-x-3 bg-white px-6 py-2 rounded-full shadow-sm mb-4 border border-indigo-100">
          <span className="text-2xl">🎨</span>
          <span className="text-sm font-bold text-indigo-400 tracking-wider uppercase">AI Learning Tool V2</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-indigo-600 font-display mb-3 drop-shadow-sm">
          Kids Mindmap Maker
        </h2>
        <p className="text-lg text-slate-500 max-w-lg mx-auto font-medium">
          Turn any topic, text, or pictures into a beautiful English vocabulary poster!
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        
        {/* Input Section */}
        <div className="bg-white rounded-[2rem] shadow-xl border-4 border-indigo-50 p-6 md:p-8 mb-8 animate-fade-in">
          
          {/* Mode Switcher */}
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-50 p-2 rounded-2xl">
            {[
              { id: MindMapMode.TOPIC, label: 'From Topic', icon: '💡' },
              { id: MindMapMode.TEXT, label: 'From Text', icon: '📝' },
              { id: MindMapMode.IMAGE, label: 'From Image', icon: '📸' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => { 
                    setMode(m.id as MindMapMode); 
                    setMindMapData(null); 
                    setPresentation(null);
                    setError(null);
                    clearFiles(); 
                    setInputContent('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
                  mode === m.id 
                    ? 'bg-indigo-500 text-white shadow-md transform scale-100' 
                    : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Input Fields */}
          <div className="space-y-6">
            {mode === MindMapMode.TOPIC && (
              <div className="space-y-2">
                <label className="text-sm font-black text-indigo-400 uppercase tracking-wide ml-1">Enter a Topic</label>
                <input
                  type="text"
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="e.g. In the Garden, Colors of Cars, My Family..."
                  className="w-full p-4 text-xl rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            )}

            {mode === MindMapMode.TEXT && (
              <div className="space-y-2">
                <label className="text-sm font-black text-indigo-400 uppercase tracking-wide ml-1">Paste your text</label>
                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="Paste a list or paragraph here (e.g. 'I see a red car, a blue bus, and a green bike...')"
                  rows={4}
                  className="w-full p-4 text-lg rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 resize-none"
                />
              </div>
            )}

            {mode === MindMapMode.IMAGE && (
               <div className="space-y-2">
                 <label className="text-sm font-black text-indigo-400 uppercase tracking-wide ml-1">Upload Posters/Images</label>
                 <div className="border-3 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-8 text-center hover:bg-indigo-50 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                    />
                    
                    {selectedFiles.length === 0 ? (
                       <div className="flex flex-col items-center text-slate-400">
                          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-indigo-300">
                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                          <span className="font-bold">Click to upload or drag & drop multiple images</span>
                       </div>
                    ) : (
                       <div className="flex flex-col items-center gap-4 relative z-10">
                          <div className="flex flex-wrap justify-center gap-2 max-h-48 overflow-y-auto">
                              {imagePreviews.map((src, i) => (
                                  <img key={i} src={src} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-indigo-200" />
                              ))}
                          </div>
                          <div className="bg-white px-4 py-1 rounded-full text-indigo-600 font-bold text-sm shadow-sm">
                             {selectedFiles.length} file(s) selected
                          </div>
                          <button onClick={(e) => { e.preventDefault(); clearFiles(); }} className="text-xs text-red-500 font-bold hover:underline z-50">Clear Selection</button>
                       </div>
                    )}
                 </div>
               </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || (mode === MindMapMode.IMAGE ? selectedFiles.length === 0 : !inputContent)}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-700 text-white rounded-xl font-black text-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99] active:translate-y-1 active:border-b-0"
            >
               {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extracting & Designing...
                  </span>
               ) : (
                  '🚀 Create Mind Map'
               )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 p-6 rounded-2xl text-center space-y-4 animate-fade-in border-2 border-red-100 mb-8 max-w-lg mx-auto">
            <p className="text-red-600 font-bold text-lg">{error}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm">
                🔑 Đổi API Key
              </button>
              <button onClick={() => {
                 setError(null);
                 initializeGeminiChat();
                 setTimeout(() => handleGenerate(), 100);
              }} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm">
                🔄 Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!mindMapData && !isLoading && !error && (
          <div className="text-center py-16 opacity-40">
            <div className="text-8xl mb-4 grayscale">🖼️</div>
            <p className="text-2xl font-bold text-slate-400">
              Your colorful mind map will appear here!
            </p>
          </div>
        )}

        {/* Result Canvas */}
        {mindMapData && (
          <div className="animate-fade-in flex flex-col items-center pb-20">
             <MindMap data={mindMapData} />
             
             {/* --- Presentation Generator Section --- */}
             <div className="w-full max-w-4xl mt-16 pt-10 border-t-4 border-dashed border-indigo-100" id="pres-section">
                <div className="text-center mb-8">
                   <h3 className="text-3xl font-black text-indigo-600 font-display mb-2">🎤 Kids Presenter Mode</h3>
                   <p className="text-slate-500 font-medium">Create a speech script for your mind map!</p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Difficulty</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                         {(['Very Basic', 'Basic', 'Intermediate', 'Advanced'] as PresentationLevel[]).map(l => (
                             <button
                               key={l}
                               onClick={() => setPresLevel(l)}
                               className={`py-2 px-3 rounded-lg text-sm font-bold border-2 transition-all ${
                                 presLevel === l 
                                 ? 'bg-indigo-500 text-white border-indigo-500' 
                                 : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200'
                               }`}
                             >
                               {l}
                             </button>
                         ))}
                      </div>
                   </div>
                   
                   <button 
                     onClick={handleGeneratePresentation}
                     disabled={isGeneratingPres}
                     className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:transform-none"
                   >
                     {isGeneratingPres ? 'Writing...' : '📝 Write Script'}
                   </button>
                </div>

                {presentation && <PresentationScriptView script={presentation} />}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
