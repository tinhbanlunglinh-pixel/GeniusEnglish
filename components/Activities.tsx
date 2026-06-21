
import React, { useState } from 'react';
import { MatchingPair, FillBlankQuestion, VocabularyItem } from '../types';
import { speakEnglish } from '../utils/tts';

interface ActivitiesProps {
  matching: MatchingPair[];
  fillInBlank: FillBlankQuestion[];
  flashcards: VocabularyItem[];
}

export const Activities: React.FC<ActivitiesProps> = ({ matching, fillInBlank, flashcards }) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'matching' | 'fill'>('flashcards');

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border-4 border-white ring-1 ring-slate-200 overflow-hidden">
      {/* Colorful Tabs */}
      <div className="flex bg-slate-50 p-2 gap-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wide transition-all transform ${
            activeTab === 'flashcards' 
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg scale-100' 
              : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 scale-95'
          }`}
        >
          🎴 Flashcards
        </button>
        <button 
          onClick={() => setActiveTab('matching')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wide transition-all transform ${
            activeTab === 'matching' 
              ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg scale-100' 
              : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 scale-95'
          }`}
        >
          🧩 Matching
        </button>
        <button 
          onClick={() => setActiveTab('fill')}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wide transition-all transform ${
            activeTab === 'fill' 
              ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg scale-100' 
              : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 scale-95'
          }`}
        >
          ✏️ Fill Blanks
        </button>
      </div>

      <div className="p-4 md:p-8 bg-slate-50/50 min-h-[500px] flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="w-full z-10">
           {activeTab === 'flashcards' && <FlashcardGame items={flashcards || []} />}
           {activeTab === 'matching' && <MatchingGame pairs={matching || []} />}
           {activeTab === 'fill' && <FillBlankGame questions={fillInBlank || []} />}
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const FlashcardGame: React.FC<{ items: VocabularyItem[] }> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!items || items.length === 0) return <div className="text-center text-slate-400 font-bold">No items available</div>;

  const next = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % items.length), 300);
  };

  const prev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length), 300);
  };

  const current = items[currentIndex];

  const playAudio = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    speakEnglish(text);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-8">
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer w-full aspect-[3/4] md:aspect-[4/3] perspective-1000 group relative"
      >
        <div 
          className="relative w-full h-full transition-transform duration-700 transform-style-3d" 
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div 
            className="absolute w-full h-full backface-hidden bg-white rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-8 border-b-8 border-brand-500 ring-4 ring-white" 
            style={{ backfaceVisibility: 'hidden' }}
          >
             <div className="absolute top-4 left-4 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
               Card {currentIndex + 1}/{items.length}
             </div>
             
             <div className="flex-1 flex flex-col items-center justify-center w-full">
                <span className="text-5xl md:text-7xl font-black text-slate-800 mb-6 tracking-tight text-center break-words w-full">{current.word}</span>
                <span className="text-xl text-brand-600 font-mono bg-brand-50 px-4 py-1.5 rounded-lg border border-brand-100 shadow-sm">/{current.ipa}/</span>
                <button 
                  onClick={(e) => playAudio(current.word, e)}
                  className="mt-10 p-5 rounded-full bg-brand-400 text-white hover:bg-brand-500 transition-all transform hover:scale-110 shadow-lg hover:shadow-brand-300/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>
             </div>
          </div>

          <div 
            className="absolute w-full h-full backface-hidden bg-gradient-to-br from-brand-400 to-brand-600 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col ring-4 ring-brand-200" 
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="h-[50%] w-full bg-white p-2 relative flex items-center justify-center">
              <span className="text-[8rem] select-none">{current.emoji || '✨'}</span>
            </div>
            <div className="h-[50%] p-6 flex flex-col items-center justify-center text-white text-center">
               <h3 className="text-3xl font-black mb-2 text-yellow-300 drop-shadow-md">{current.meaning}</h3>
               <div className="relative w-full">
                 <p className="text-lg font-medium opacity-90 leading-snug px-8 italic border-l-4 border-yellow-300/50 pl-4">
                   "{current.example}"
                 </p>
                 <button 
                    onClick={(e) => playAudio(current.example, e)}
                    className="absolute -right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-all backdrop-blur-sm"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button onClick={prev} className="p-4 rounded-full bg-white border-b-4 border-slate-200 hover:bg-slate-50 hover:border-brand-400 hover:text-brand-500 transition-all active:border-b-0 active:translate-y-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button onClick={next} className="p-4 rounded-full bg-white border-b-4 border-slate-200 hover:bg-slate-50 hover:border-brand-400 hover:text-brand-500 transition-all active:border-b-0 active:translate-y-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
};

const MatchingGame: React.FC<{ pairs: MatchingPair[] }> = ({ pairs }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());

  if (!pairs || pairs.length === 0) return <div className="text-center text-slate-400 font-bold">No pairs available</div>;

  const handleLeftClick = (id: string) => {
    if (matchedIds.has(id)) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id: string) => {
    if (matchedIds.has(id)) return;
    if (selectedLeft === id) {
      const newMatched = new Set(matchedIds);
      newMatched.add(id);
      setMatchedIds(newMatched);
      setSelectedLeft(null);
    } else {
      setSelectedLeft(null); 
    }
  };

  if (matchedIds.size === pairs.length && pairs.length > 0) {
     return (
       <div className="flex flex-col items-center justify-center h-full py-10 animate-fade-in text-center">
         <div className="text-8xl mb-6 animate-bounce">🏆</div>
         <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600 mb-2">Awesome Job!</h3>
         <button onClick={() => setMatchedIds(new Set())} className="mt-8 px-8 py-4 bg-brand-500 text-white font-black text-lg rounded-2xl hover:bg-brand-600 shadow-xl">Play Again</button>
       </div>
     )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-8 h-full w-full max-w-4xl mx-auto">
      <div className="space-y-4">
        {pairs.map(p => (
          <button
            key={`l-${p.id}`}
            disabled={matchedIds.has(p.id)}
            onClick={() => handleLeftClick(p.id)}
            className={`w-full p-4 md:p-6 rounded-2xl border-b-4 text-left transition-all font-bold shadow-sm flex items-center justify-between
              ${matchedIds.has(p.id) ? 'opacity-30 bg-slate-100 border-transparent grayscale' : 
                selectedLeft === p.id ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-brand-100 scale-105 z-10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-brand-300'
              }
            `}
          >
            <span className="text-lg">{p.left}</span>
            {matchedIds.has(p.id) && <span className="text-green-500">✓</span>}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {pairs.map(p => (
          <button
            key={`r-${p.id}`}
            disabled={matchedIds.has(p.id)}
            onClick={() => handleRightClick(p.id)}
            className={`w-full p-4 md:p-6 rounded-2xl border-b-4 text-left transition-all font-medium shadow-sm flex items-center justify-between
              ${matchedIds.has(p.id) ? 'opacity-30 bg-emerald-50 border-transparent grayscale' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300'}
            `}
          >
             <span className="text-lg">{p.right}</span>
             {matchedIds.has(p.id) && <span className="text-emerald-500">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

const FillBlankGame: React.FC<{ questions: FillBlankQuestion[] }> = ({ questions }) => {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  if (!questions || questions.length === 0) return <div className="text-center text-slate-400 font-bold">No questions available</div>;

  const handleOption = (opt: string) => {
    if (opt === questions[index].answer) {
      setFeedback('correct');
      speakEnglish("Correct!");
      setTimeout(() => {
        setFeedback(null);
        if (index < questions.length - 1) setIndex(index + 1);
      }, 1500);
    } else {
      setFeedback('wrong');
      speakEnglish("Try again");
    }
  };

  const q = questions[index];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto w-full">
      <div className="w-full h-3 bg-slate-200 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-brand-500 transition-all duration-500" style={{ width: `${((index) / questions.length) * 100}%` }}></div>
      </div>
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border-b-8 border-slate-100 w-full text-center mb-10 relative">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-brand-100 text-brand-800 px-4 py-1 rounded-full text-sm font-black uppercase tracking-wider">
            Câu hỏi {index + 1}
        </div>
        <h3 className="text-3xl md:text-4xl font-bold text-slate-700 leading-relaxed font-display">
            {(q?.sentence || '').split('___').map((part, i, arr) => (
            <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                <span className={`inline-flex min-w-[120px] border-b-4 mx-3 px-3 py-1 rounded-lg items-center justify-center transition-all duration-300 ${feedback === 'correct' ? 'border-green-500 text-green-700 bg-green-100 scale-110' : 'border-slate-300 bg-slate-100 text-transparent'}`}>
                    {feedback === 'correct' ? q.answer : '?'}
                </span>
                )}
            </React.Fragment>
            ))}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {(q?.options || []).map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOption(opt)}
            disabled={feedback === 'correct'}
            className={`p-6 rounded-2xl border-b-4 text-2xl font-bold transition-all transform hover:-translate-y-1
              ${feedback === 'wrong' ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-brand-50 hover:border-brand-300'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
