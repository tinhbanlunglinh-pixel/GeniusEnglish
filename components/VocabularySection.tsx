
import React, { useState } from 'react';
import { VocabularyItem } from '../types';
import { speakEnglish } from '../utils/tts';

interface VocabularySectionProps {
  items: VocabularyItem[];
}

export const VocabularySection: React.FC<VocabularySectionProps> = ({ items = [] }) => {
  const [showMeaning, setShowMeaning] = useState(true);

  const playAudio = (text: string) => {
    speakEnglish(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Vocabulary List</h2>
        <button
          onClick={() => setShowMeaning(!showMeaning)}
          className="text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-600 font-medium"
        >
          {showMeaning ? 'Hide Meaning' : 'Show Meaning'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 hover:shadow-md transition-shadow duration-200 items-start">
              <div className="shrink-0 relative group mt-1 w-24 h-24 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center">
                 <span className="text-6xl select-none">{item.emoji || '📝'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-brand-900 truncate">{item.word}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500 text-sm font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">/{item.ipa}/</span>
                      <span className="text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-bold uppercase">{item.type}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => playAudio(item.word)}
                    className="p-2.5 rounded-full bg-brand-100 text-brand-600 hover:bg-brand-500 hover:text-white transition-all transform active:scale-95 shadow-sm"
                    title="Listen to word"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>
                </div>
                
                <div className={`mt-3 transition-all duration-300 ${showMeaning ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  <p className="text-accent-600 font-bold text-lg leading-tight">{item.meaning}</p>
                </div>

                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 relative group/example">
                  <p className="text-slate-600 text-sm italic leading-relaxed pr-2 md:pr-8 font-medium">
                    "{item.example}"
                  </p>
                  {showMeaning && item.sentenceMeaning && (
                    <p className="text-slate-400 text-xs mt-1 border-t border-slate-200 pt-1">
                      {item.sentenceMeaning}
                    </p>
                  )}
                  <button 
                    onClick={() => playAudio(item.example)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white text-slate-400 hover:text-brand-500 hover:bg-brand-50 border border-slate-200 shadow-sm transition-all"
                    title="Listen to sentence"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>
                </div>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};
