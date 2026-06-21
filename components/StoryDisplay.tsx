
import React, { useState, useEffect, useRef } from 'react';
import { ContentResult, QAPair, ReadingMCQ } from '../types';
import { AICallModal } from './AICallModal';
import { toPng } from 'html-to-image';
import { speakEnglish } from '../utils/tts';

interface StoryDisplayProps {
  contentResult: ContentResult;
  generatedImage: string;
  originalImages: string[];
  audioUrl: string | null;
  onReset: () => void;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  contentResult, 
  generatedImage, 
  originalImages, 
  audioUrl, 
  onReset 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  const storyText = contentResult?.storyEnglish || "";
  const words = storyText ? storyText.split(/\s+/).filter(w => w.length > 0) : [];
  const wordOffsets = useRef<number[]>([]);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const qaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let currentOffset = 0;
    const offsets: number[] = [];
    words.forEach(word => {
        offsets.push(currentOffset);
        currentOffset += word.length + 1;
    });
    wordOffsets.current = offsets;
  }, [storyText]);

  const playAudio = () => {
    if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setActiveWordIndex(-1);
        return;
    }
    if (!storyText) return;
    setIsPlaying(true);
    
    speakEnglish(
      storyText,
      () => {
        setIsPlaying(false);
        setActiveWordIndex(-1);
      },
      (event) => {
        if (event.name === 'word') {
            const charIndex = event.charIndex;
            const index = wordOffsets.current.findIndex((offset, i) => {
                const nextOffset = wordOffsets.current[i + 1] || Infinity;
                return charIndex >= offset && charIndex < nextOffset;
            });
            if (index !== -1) setActiveWordIndex(index);
        }
      }
    );
  };

  const downloadImage = async (ref: React.RefObject<HTMLDivElement>, name: string) => {
    if (ref.current === null) return;
    try {
      const dataUrl = await toPng(ref.current, { 
        cacheBust: true, 
        backgroundColor: 'white',
        pixelRatio: 2 // High resolution
      });
      const link = document.createElement('a');
      link.download = `${name}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Could not export. Please try again.");
    }
  };

  const handleSelectAnswer = (qIdx: number, oIdx: number) => {
    if (submittedQuiz) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    contentResult.readingQuiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswerIndex) score++;
    });
    return score;
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-white ring-1 ring-blue-100 animate-fade-in pb-10">
       
       <AICallModal 
         isOpen={isCallModalOpen} 
         onClose={() => setIsCallModalOpen(false)} 
         storyContext={storyText} 
         qaPairs={contentResult.qaPairs}
       />

       {/* Top: Image & Story */}
       <div className="grid md:grid-cols-2">
          {/* Image Side */}
          <div className="bg-gray-900 relative min-h-[400px] flex items-center justify-center group overflow-hidden">
             <img 
               src={generatedImage} 
               alt="Magic Story Scene" 
               className="w-full h-full object-cover absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-700 transform group-hover:scale-105" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             
             <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
                <button 
                  onClick={playAudio}
                  className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all transform active:scale-95
                    ${isPlaying ? 'bg-red-500 text-white' : 'bg-brand-400 text-white hover:bg-brand-500'}
                  `}
                >
                   {isPlaying ? (
                     <><span className="animate-pulse">⏹ Dừng đọc</span></>
                   ) : (
                     <><span className="text-xl">🔊</span> Nghe câu truyện</>
                   )}
                </button>
                
                <button 
                   onClick={() => setIsCallModalOpen(true)}
                   className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl bg-purple-500 text-white hover:bg-purple-600 transition-all transform active:scale-95"
                >
                    <span className="text-xl">🎙️</span> Gọi Cô Giáo AI
                </button>
             </div>
          </div>

          {/* Story Side */}
          <div className="p-8 md:p-12 overflow-y-auto max-h-[700px] bg-gradient-to-br from-blue-50 to-white relative">
             <div className="sticky top-0 z-10 flex justify-between items-center mb-6 pb-4 border-b border-blue-100 bg-white/80 backdrop-blur-sm pt-2">
                <h2 className="text-3xl font-black text-blue-900 font-comic">Magic Story ✨</h2>
                <button 
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="text-sm font-bold px-3 py-1.5 rounded-lg border-2 border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                    {showTranslation ? 'Ẩn tiếng Việt' : 'Xem tiếng Việt'}
                </button>
             </div>

             <div className="prose prose-xl leading-relaxed font-medium text-slate-700 mb-8">
                <p>
                    {words.map((word, index) => (
                        <span 
                            key={index} 
                            className={`inline-block transition-colors duration-200 rounded px-0.5 mx-0.5
                                ${index === activeWordIndex ? 'bg-brand-400 text-white scale-110 shadow-sm' : ''}
                            `}
                        >
                            {word}
                        </span>
                    ))}
                </p>
             </div>
             
             <div className={`overflow-hidden transition-all duration-500 ${showTranslation ? 'max-h-96 opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
                <div className="bg-blue-100/50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="text-blue-800 font-bold uppercase text-xs tracking-wider mb-2">Bản dịch tiếng Việt</h4>
                    <p className="text-blue-900 text-lg leading-relaxed">{contentResult?.translatedText || "Không có bản dịch"}</p>
                </div>
             </div>

             <div className="pt-6 border-t-2 border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-slate-400 uppercase text-xs mb-2">Văn bản gốc trích xuất</h3>
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-500 italic">
                     {contentResult?.originalText?.substring(0, 100) || "Không trích xuất được văn bản"}...
                   </div>
                </div>
                <button 
                  onClick={() => downloadImage(worksheetRef, 'genius-worksheet')}
                  className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex flex-col items-center gap-1"
                >
                   <span>📄</span>
                   <span className="text-[10px] uppercase">Export Worksheet</span>
                </button>
             </div>
          </div>
       </div>

       {/* Bottom: Q&A Section */}
       <div className="p-8 bg-brand-50 border-t-8 border-brand-100">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-brand-900 font-display flex items-center gap-2">
                 <span>📝</span> 10 Câu hỏi luyện nói
              </h2>
              <button 
                onClick={() => downloadImage(qaRef, 'genius-qa')}
                className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                 📥 Tải bộ Q&A
              </button>
           </div>

           <div className="grid md:grid-cols-2 gap-4" ref={qaRef}>
              <div className="md:col-span-2 bg-white p-6 rounded-3xl border-4 border-brand-200 shadow-lg relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-right opacity-30 select-none">
                     <p className="text-xs font-black text-brand-500">GENIUS ENGLISH</p>
                     <p className="text-[8px] font-bold text-slate-400">Cô Lợi - 0379370329</p>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-12 h-12 bg-brand-400 rounded-full flex items-center justify-center text-2xl shadow-sm">🗣️</div>
                     <div>
                        <h3 className="text-xl font-black text-slate-800">Speaking Challenge</h3>
                        <p className="text-sm text-slate-400 font-bold">Thực hành hỏi đáp cùng Cô Giáo AI</p>
                     </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                     {(contentResult.qaPairs || []).map((pair, idx) => (
                        <div key={idx} className="border-b border-slate-100 pb-2">
                           <p className="text-brand-700 font-black text-sm">Q{idx+1}: {pair.question}</p>
                           <p className="text-slate-500 text-xs italic mt-1 font-medium">A: {pair.answer}</p>
                        </div>
                     ))}
                  </div>
              </div>
           </div>
       </div>

       {/* New Reading Comprehension Section */}
       <div className="p-4 md:p-12 bg-slate-50 border-t-8 border-brand-100">
           <div className="max-w-4xl mx-auto">
               <div className="text-center mb-10">
                   <h2 className="text-4xl font-black text-slate-800 font-display mb-2">📖 Thử thách Đọc hiểu</h2>
                   <p className="text-slate-500 text-lg">Đọc kỹ câu truyện và chọn đáp án chính xác nhé!</p>
               </div>

               <div className="space-y-8">
                  {contentResult.readingQuiz?.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white p-8 rounded-3xl shadow-lg border-2 border-slate-100 transition-all">
                       <h3 className="text-xl font-black text-slate-800 mb-6 flex items-start gap-3">
                          <span className="bg-brand-400 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">{qIdx + 1}</span>
                          {q.question}
                       </h3>
                       <div className="grid gap-3">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = quizAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctAnswerIndex === oIdx;
                            let btnClass = "w-full text-left p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-between ";
                            
                            if (submittedQuiz) {
                              if (isCorrect) btnClass += "bg-green-50 border-green-500 text-green-700";
                              else if (isSelected) btnClass += "bg-red-50 border-red-500 text-red-700";
                              else btnClass += "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                            } else {
                              if (isSelected) btnClass += "bg-brand-50 border-brand-400 text-brand-700 shadow-md";
                              else btnClass += "bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-brand-200";
                            }

                            return (
                              <button 
                                key={oIdx} 
                                onClick={() => handleSelectAnswer(qIdx, oIdx)}
                                className={btnClass}
                              >
                                <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                {submittedQuiz && isCorrect && <span className="text-xl">✅</span>}
                                {submittedQuiz && isSelected && !isCorrect && <span className="text-xl">❌</span>}
                              </button>
                            );
                          })}
                       </div>
                       {submittedQuiz && (
                         <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm italic text-blue-700">
                           <span className="font-black not-italic">Giải thích:</span> {q.explanation}
                         </div>
                       )}
                    </div>
                  ))}
               </div>

               <div className="mt-12 flex flex-col items-center gap-4">
                  {!submittedQuiz ? (
                    <button 
                      onClick={() => setSubmittedQuiz(true)}
                      disabled={Object.keys(quizAnswers).length < (contentResult.readingQuiz?.length || 0)}
                      className="px-12 py-4 bg-brand-400 text-white font-black text-2xl rounded-2xl shadow-xl hover:bg-brand-500 transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                       Nộp bài 🏁
                    </button>
                  ) : (
                    <div className="text-center animate-bounce-in">
                        <div className="bg-white px-10 py-6 rounded-3xl border-4 border-brand-400 shadow-2xl">
                           <p className="text-xl font-bold text-slate-500 uppercase tracking-widest mb-1">Điểm của con</p>
                           <h4 className="text-6xl font-black text-brand-500">{calculateScore()} / {contentResult.readingQuiz?.length}</h4>
                        </div>
                        <button 
                          onClick={() => { setQuizAnswers({}); setSubmittedQuiz(false); }}
                          className="mt-6 text-brand-600 font-black hover:underline"
                        >
                          Làm lại bài tập
                        </button>
                    </div>
                  )}
               </div>
           </div>

           <div className="mt-20 text-center">
             <button 
               onClick={onReset}
               className="bg-white border-2 border-slate-200 hover:border-brand-400 hover:text-brand-600 text-slate-500 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-sm hover:shadow-md"
             >
                🔄 Tạo một câu truyện mới
             </button>
          </div>
       </div>

       {/* HIDDEN WORKSHEET FOR EXPORT */}
       <div className="fixed -left-[10000px] top-0">
          <div 
            ref={worksheetRef} 
            className="w-[800px] p-10 bg-white flex flex-col gap-8 font-sans"
          >
             <div className="flex justify-between items-start border-b-4 border-brand-400 pb-6">
                <div>
                   <h1 className="text-4xl font-black text-brand-900 font-display">MAGIC STORY WORKSHEET</h1>
                   <p className="text-slate-500 font-bold">Genius English Center - Cô Lợi (0379370329)</p>
                </div>
                <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-4xl">🐱</div>
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                   <div className="rounded-2xl overflow-hidden border-4 border-slate-100 shadow-sm">
                      <img src={generatedImage} alt="Illustration" className="w-full h-auto" />
                   </div>
                   <div className="bg-brand-50 p-4 rounded-xl">
                      <h3 className="font-black text-brand-900 mb-2 uppercase text-xs">Vocabulary Check</h3>
                      <div className="grid grid-cols-1 gap-2">
                         {contentResult?.vocabulary?.map((v, i) => (
                            <div key={i} className="text-sm flex justify-between">
                               <span className="font-bold">{v.word} {v.emoji}</span>
                               <span className="text-slate-400 italic">{v.meaning}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-col gap-4">
                   <h2 className="text-2xl font-black text-slate-800 border-b-2 border-slate-100 pb-2">The Story</h2>
                   <p className="text-lg leading-relaxed text-slate-700 font-medium">
                      {contentResult?.storyEnglish || ""}
                   </p>
                   <div className="mt-4 p-4 bg-slate-50 rounded-xl border-l-4 border-blue-400">
                      <h4 className="font-black text-xs text-blue-600 mb-1 uppercase tracking-widest">Dịch nghĩa</h4>
                      <p className="text-sm text-slate-600 italic leading-relaxed">
                         {contentResult?.translatedText || ""}
                      </p>
                   </div>
                </div>
             </div>

             <div className="border-t-2 border-slate-100 pt-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">Reading Comprehension Questions</h2>
                <div className="grid grid-cols-1 gap-4">
                   {contentResult?.qaPairs?.slice(0, 5).map((qa, i) => (
                      <div key={i} className="flex gap-4 items-start">
                         <div className="w-6 h-6 rounded-full bg-brand-400 text-white flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                         <div className="flex flex-col gap-1 border-b border-slate-50 pb-2 w-full">
                            <p className="font-bold text-slate-700">{qa.question}</p>
                            <p className="text-slate-300">Answer: ____________________________________________________</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-4">
                © Genius English Center - Thắp sáng tiềm năng cùng Cô Lợi
             </div>
          </div>
       </div>
    </div>
  );
};
