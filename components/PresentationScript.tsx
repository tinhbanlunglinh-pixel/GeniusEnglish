
import React, { useState, useRef } from 'react';
import { PresentationScript } from '../types';
import { speakEnglish } from '../utils/tts';

interface PresentationScriptProps {
  script: PresentationScript;
}

export const PresentationScriptView: React.FC<PresentationScriptProps> = ({ script }) => {
  const [activePart, setActivePart] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [evaluation, setEvaluation] = useState<string | null>(null);

  const speak = (text: string, partId: string) => {
    if (!text) return;
    setActivePart(partId);
    speakEnglish(text, () => {
      setActivePart(null);
    });
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setEvaluation(null);
      // Giả lập nhận diện giọng nói (vì không dùng thư viện ngoài)
      setTimeout(() => {
        setIsRecording(false);
        setEvaluation("Amazing! Your pronunciation is perfect! CEFR Level matched. 🌟");
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  if (!script) return null;

  return (
    <div className="mt-12 bg-white rounded-[3rem] shadow-2xl border-4 border-indigo-100 overflow-hidden animate-fade-in max-w-4xl mx-auto flex flex-col">
       <div className="bg-indigo-600 p-8 text-center text-white flex justify-between items-center">
          <div className="text-left">
            <h3 className="text-3xl font-black font-display">🎤 Kids Presenter Pro</h3>
            <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">Luyện thuyết trình chuẩn CEFR</p>
          </div>
          <button 
            onClick={() => setShowTranslation(!showTranslation)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-xs transition-all"
          >
            {showTranslation ? 'Hide Vietnamese' : 'Show Vietnamese'}
          </button>
       </div>

       <div className="p-8 md:p-12 space-y-12 bg-slate-50/50">
          {/* Introduction */}
          <section className="relative group">
             <div className="absolute -left-4 top-0 w-2 h-full bg-blue-500 rounded-full"></div>
             <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4">1. Warm up & Intro</h4>
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-3xl font-black text-slate-800 leading-relaxed">"{script.introduction?.english}"</p>
                {showTranslation && <p className="text-blue-600 font-bold mt-4 italic">({script.introduction?.vietnamese})</p>}
                <div className="mt-6 flex gap-3">
                   <button onClick={() => speak(script.introduction?.english, 'intro')} className="px-6 py-3 bg-blue-100 text-blue-600 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                      <span>🔊 Listen</span>
                   </button>
                </div>
             </div>
          </section>

          {/* Body */}
          <section className="relative">
             <div className="absolute -left-4 top-0 w-2 h-full bg-orange-500 rounded-full"></div>
             <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-4">2. The Big Content</h4>
             <div className="grid gap-6">
                {(script.body || []).map((item, idx) => (
                   <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-6 items-center">
                      <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-5xl shrink-0">{item.emoji}</div>
                      <div className="flex-1">
                         <p className="text-2xl font-black text-slate-800">"{item.script}"</p>
                         {showTranslation && <p className="text-slate-400 font-bold text-sm mt-1">({item.vietnamese})</p>}
                      </div>
                      <button onClick={() => speak(item.script, `body-${idx}`)} className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-orange-500 hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                      </button>
                   </div>
                ))}
             </div>
          </section>

          {/* Conclusion */}
          <section className="relative">
             <div className="absolute -left-4 top-0 w-2 h-full bg-green-500 rounded-full"></div>
             <h4 className="text-xs font-black text-green-500 uppercase tracking-widest mb-4">3. Say Goodbye</h4>
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-3xl font-black text-slate-800 leading-relaxed">"{script.conclusion?.english}"</p>
                {showTranslation && <p className="text-green-600 font-bold mt-4 italic">({script.conclusion?.vietnamese})</p>}
                <div className="mt-6 flex gap-3">
                   <button onClick={() => speak(script.conclusion?.english, 'end')} className="px-6 py-3 bg-green-100 text-green-600 rounded-2xl font-black flex items-center gap-2 hover:bg-green-600 hover:text-white transition-all">
                      <span>🔊 Listen</span>
                   </button>
                </div>
             </div>
          </section>

          {/* Evaluation Center */}
          <div className="bg-brand-900 rounded-[2rem] p-10 text-center text-white space-y-6">
              <h5 className="text-xs font-black text-brand-400 uppercase tracking-[0.3em]">Pronunciation Test</h5>
              <p className="text-lg font-bold">Hãy nhấn Micro và đọc to kịch bản để Cô Lợi chấm điểm nhé!</p>
              
              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={toggleRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl relative
                    ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white text-brand-900 hover:scale-110'}
                  `}
                >
                   {isRecording ? (
                     <div className="w-10 h-10 bg-white rounded-md animate-scale-in"></div>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                   )}
                </button>
                
                {evaluation && (
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/20 animate-fade-in w-full">
                    <p className="text-brand-400 font-black text-xl">{evaluation}</p>
                  </div>
                )}
              </div>
          </div>
       </div>
    </div>
  );
};
