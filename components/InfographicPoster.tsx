
import React from 'react';
import { LessonPlan, ProficiencyLevel } from '../types';
import { SmartImage } from './SmartImage';

interface InfographicPosterProps {
  lesson: LessonPlan;
}

export const InfographicPoster: React.FC<InfographicPosterProps> = ({ lesson }) => {
  const { topic, level, vocabulary = [], grammar } = lesson;
  const grammarExamples = grammar?.examples || [];

  // --- Theme Configuration based on Level ---
  const getTheme = (lvl: ProficiencyLevel) => {
    switch (lvl) {
      case 'Starter':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          accent: 'text-amber-600',
          cardBg: 'bg-white',
          cardBorder: 'border-orange-100',
          headerGradient: 'from-amber-200 to-orange-100',
          icon: '🌞'
        };
      case 'Mover':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          accent: 'text-sky-600',
          cardBg: 'bg-white',
          cardBorder: 'border-blue-100',
          headerGradient: 'from-sky-200 to-blue-100',
          icon: '☁️'
        };
      case 'Flyer':
        return {
          bg: 'bg-fuchsia-50',
          border: 'border-fuchsia-200',
          accent: 'text-fuchsia-600',
          cardBg: 'bg-white',
          cardBorder: 'border-purple-100',
          headerGradient: 'from-fuchsia-200 to-purple-100',
          icon: '✨'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          accent: 'text-slate-600',
          cardBg: 'bg-white',
          cardBorder: 'border-slate-100',
          headerGradient: 'from-slate-200 to-gray-100',
          icon: '📚'
        };
    }
  };

  const theme = getTheme(level);

  // Main Image Generation - Using Icon Style
  const mainPrompt = `simple flat vector icon of ${topic}, white background, colorful, minimal design`;
  const mainImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(mainPrompt)}?width=400&height=400&nologo=true&seed=main`;

  return (
    <div className="w-full py-8 animate-fade-in">
      {/* Container - simulating a printed poster */}
      <div className={`
        relative w-full max-w-4xl mx-auto rounded-[3rem] shadow-2xl overflow-hidden 
        border-[12px] ${theme.border} ${theme.bg}
      `}>
        {/* Decorative corner tape */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-12 bg-white/50 backdrop-blur border-2 border-slate-200/50 shadow-sm rotate-1 z-20"></div>

        {/* --- Header Section --- */}
        <div className={`relative h-64 bg-gradient-to-b ${theme.headerGradient} flex items-center justify-center p-6 border-b-4 ${theme.border} border-dashed`}>
           <div className="absolute top-4 left-6 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest text-slate-500 shadow-sm">
              {level} Level {theme.icon}
           </div>

           <div className="flex items-center gap-6 z-10 mt-4">
              <div className="w-40 h-40 bg-white rounded-full border-8 border-white shadow-lg overflow-hidden flex-shrink-0 rotate-3 p-4">
                 <SmartImage 
                   src={mainImgUrl} 
                   alt={topic} 
                   className="w-full h-full object-contain" 
                 />
              </div>
              <div className="text-center md:text-left">
                 <div className="text-sm font-bold opacity-60 uppercase tracking-widest mb-1">Topic of the day</div>
                 <h1 className={`text-5xl md:text-6xl font-black ${theme.accent} drop-shadow-sm font-display capitalize`}>
                    {topic}
                 </h1>
              </div>
           </div>
           
           {/* Background Patterns */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
        </div>

        {/* --- Content Body --- */}
        <div className="p-8 md:p-10 grid md:grid-cols-12 gap-10">
           
           {/* Left Column: Vocabulary (Limit to 6 for space) */}
           <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <div className={`w-10 h-10 rounded-xl ${theme.bg} border-2 ${theme.border} flex items-center justify-center text-xl`}>📖</div>
                 <h2 className={`text-2xl font-black ${theme.accent} font-display`}>New Words</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {vocabulary.slice(0, 6).map((item, idx) => (
                     <div key={idx} className={`flex items-center gap-4 bg-white p-3 rounded-2xl border-2 ${theme.cardBorder} shadow-sm hover:scale-105 transition-transform`}>
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-3xl">
                           {item.emoji || '🔸'}
                        </div>
                        <div>
                           <div className="font-black text-slate-700 text-lg leading-none mb-1">{item.word}</div>
                           <div className="text-xs text-slate-400 font-mono">/{item.ipa}/</div>
                           <div className={`text-xs font-bold ${theme.accent} mt-0.5`}>{item.meaning}</div>
                        </div>
                     </div>
                 ))}
              </div>
           </div>

           {/* Right Column: Grammar & Sentences */}
           <div className="md:col-span-7 flex flex-col gap-8">
              
              {/* Grammar Note */}
              <div className="relative">
                 <div className="absolute -top-3 -left-2 text-4xl rotate-12 z-10">📌</div>
                 <div className="bg-yellow-100 rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-md rounded-br-md p-6 shadow-md border border-yellow-200 transform -rotate-1">
                    <h3 className="font-black text-yellow-700 text-xl mb-3 flex items-center gap-2">
                       Grammar Tip: <span className="underline decoration-wavy decoration-yellow-400">{grammar?.topic || 'Grammar'}</span>
                    </h3>
                    <p className="text-slate-700 font-medium leading-relaxed">
                       {grammar?.explanation || 'Learn this structure!'}
                    </p>
                 </div>
              </div>

              {/* Sentence Patterns */}
              <div>
                 <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${theme.bg} border-2 ${theme.border} flex items-center justify-center text-xl`}>💬</div>
                    <h2 className={`text-2xl font-black ${theme.accent} font-display`}>Sentences</h2>
                 </div>

                 <div className="space-y-4">
                    {grammarExamples.slice(0, 3).map((ex, i) => (
                       <div key={i} className="flex gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center font-bold ${theme.accent} border-2 ${theme.border}`}>
                             {i + 1}
                          </div>
                          <div className={`flex-1 bg-white p-4 rounded-2xl rounded-tl-none border-2 ${theme.cardBorder} shadow-sm relative`}>
                             <p className="text-slate-700 font-bold text-lg">"{ex}"</p>
                          </div>
                       </div>
                    ))}
                    {/* Fallback if grammar examples are empty, use vocab examples */}
                    {grammarExamples.length === 0 && vocabulary.slice(0, 2).map((v, i) => (
                       <div key={`v-${i}`} className="flex gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center font-bold ${theme.accent} border-2 ${theme.border}`}>
                             {i + 1}
                          </div>
                          <div className={`flex-1 bg-white p-4 rounded-2xl rounded-tl-none border-2 ${theme.cardBorder} shadow-sm relative`}>
                             <p className="text-slate-700 font-bold text-lg">"{v.example}"</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>

        {/* --- Footer --- */}
        <div className={`bg-white/50 p-4 text-center border-t-4 ${theme.border} border-dashed`}>
           <p className={`font-black ${theme.accent} text-sm uppercase tracking-widest`}>
              Great Job! You are a {level} Star! ★
           </p>
        </div>

      </div>
    </div>
  );
};
