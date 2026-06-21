
import React, { useState, useRef } from 'react';
import { MultipleChoiceQ, ScrambleQ, FillInputQ, ErrorIdQ, PracticeContent } from '../types';
import { toPng } from 'html-to-image';

interface ScoreState {
    [key: string]: boolean;
}

const normalize = (str: string): string => {
    return str.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
};

const getClassification = (score: number) => {
    if (score >= 9) return { text: "XUẤT SẮC", color: "text-amber-500", label: "Platinum Student" };
    if (score >= 8) return { text: "GIỎI", color: "text-blue-500", label: "Gold Scholar" };
    if (score >= 6.5) return { text: "KHÁ", color: "text-emerald-500", label: "Silver Achiever" };
    if (score >= 5) return { text: "TRUNG BÌNH", color: "text-slate-500", label: "Rising Star" };
    return { text: "CẦN CỐ GẮNG", color: "text-rose-500", label: "English Explorer" };
};

const FeedbackDisplay: React.FC<{ status: 'correct' | 'wrong' | null, explanation?: string }> = ({ status, explanation }) => {
    if (status === null) return null;
    return (
        <div className="mt-4 animate-fade-in">
            {status === 'correct' ? (
                <div className="bg-green-100 border-2 border-green-500 rounded-xl p-3 flex items-center gap-3">
                    <div className="bg-green-500 text-white rounded-full p-1 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-green-700 font-black">Tuyệt vời! Đáp án chính xác.</p>
                </div>
            ) : (
                <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3 flex items-center gap-3">
                    <div className="bg-red-500 text-white rounded-full p-1 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <div>
                        <p className="text-red-700 font-black">Cố gắng lên nhé!</p>
                        {explanation && <p className="text-red-800 text-xs mt-1"><b>💡 Hướng dẫn:</b> {explanation}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const MultipleChoiceCard: React.FC<{ q: MultipleChoiceQ, index: number, onAnswer: (correct: boolean) => void }> = ({ q, index, onAnswer }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const check = (idx: number) => {
        if (submitted) return;
        const correct = idx === q.correctAnswer;
        setSelected(idx);
        setSubmitted(true);
        onAnswer(correct);
    };
    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-brand-200 transition-colors">
            <div className="flex gap-3 mb-4">
                <span className="bg-brand-100 text-brand-700 font-black px-3 py-1 rounded-lg h-fit border border-brand-200 shrink-0">Câu {index}</span>
                <p className="font-bold text-lg text-slate-800">{q.question}</p>
            </div>
            <div className="grid gap-3">
                {(q.options || []).map((opt, i) => (
                    <button key={i} onClick={() => check(i)} disabled={submitted} className={`w-full text-left p-4 rounded-xl font-bold border-2 transition-all ${submitted ? (i === q.correctAnswer ? 'bg-green-100 border-green-500' : (i === selected ? 'bg-red-100 border-red-500' : 'bg-slate-50 border-slate-200')) : (i === selected ? 'bg-brand-100 border-brand-400' : 'bg-white border-slate-200 hover:border-brand-300')}`}>{opt}</button>
                ))}
            </div>
            <FeedbackDisplay status={submitted ? (selected === q.correctAnswer ? 'correct' : 'wrong') : null} explanation={q.explanation} />
        </div>
    );
};

const ScrambleCard: React.FC<{ q: ScrambleQ, index: number, onAnswer: (correct: boolean) => void }> = ({ q, index, onAnswer }) => {
    const [currentOrder, setCurrentOrder] = useState<string[]>([]);
    const [available, setAvailable] = useState<string[]>(q.scrambled || []);
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [submitted, setSubmitted] = useState(false);
    const check = () => {
        if (submitted) return;
        const isCorrect = normalize(currentOrder.join(' ')) === normalize(q.correctSentence);
        setSubmitted(true);
        setStatus(isCorrect ? 'correct' : 'wrong');
        onAnswer(isCorrect);
    };
    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-orange-200 transition-colors">
            <div className="flex gap-3 mb-2">
                <span className="bg-orange-100 text-orange-700 font-black px-3 py-1 rounded-lg shrink-0">Câu {index}</span>
                <p className="text-slate-500 text-xs font-bold uppercase py-1">Sắp xếp câu</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl mb-4 italic text-slate-600 border border-orange-100">"{q.translation}"</div>
            <div className={`min-h-[60px] p-4 rounded-xl border-2 mb-4 flex flex-wrap gap-2 ${status === 'correct' ? 'bg-green-50 border-green-500' : (status === 'wrong' ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-200')}`}>
                {currentOrder.map((word, i) => (
                    <button key={i} onClick={() => !submitted && (setAvailable([...available, word]), setCurrentOrder(currentOrder.filter((_, idx) => idx !== i)))} className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200 hover:bg-slate-50">{word}</button>
                ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {available.map((word, i) => (
                    <button key={i} onClick={() => !submitted && (setCurrentOrder([...currentOrder, word]), setAvailable(available.filter((_, idx) => idx !== i)))} className="bg-brand-100 px-3 py-1 rounded border border-brand-300 font-bold hover:bg-brand-200 transition-colors">{word}</button>
                ))}
            </div>
            {!submitted && <button onClick={check} className="bg-brand-500 text-brand-900 px-6 py-3 rounded-xl font-black w-full shadow-lg hover:bg-brand-600 active:scale-95 transition-all">Kiểm tra kết quả 🔍</button>}
            <FeedbackDisplay status={status === 'idle' ? null : status} explanation={q.explanation} />
            {submitted && status === 'wrong' && <p className="mt-3 p-3 bg-green-50 text-green-800 rounded-xl border border-green-200 font-bold">Đáp án đúng: {q.correctSentence}</p>}
        </div>
    );
};

const FillBlankCard: React.FC<{ q: FillInputQ, index: number, onAnswer: (correct: boolean) => void }> = ({ q, index, onAnswer }) => {
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [submitted, setSubmitted] = useState(false);
    const check = () => {
        if (submitted) return;
        const isCorrect = normalize(input) === normalize(q.correctAnswer);
        setSubmitted(true);
        setStatus(isCorrect ? 'correct' : 'wrong');
        onAnswer(isCorrect);
    };
    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-2 right-2 text-6xl opacity-10 pointer-events-none">{q.clueEmoji}</div>
            <div className="flex gap-3 mb-4">
                <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg shrink-0">Câu {index}</span>
                <p className="font-bold text-lg">{q.question.replace('___', '______')}</p>
            </div>
            <div className="flex gap-2 relative z-10">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} disabled={submitted} placeholder="Nhập từ còn thiếu..." className="flex-1 p-4 border-2 rounded-xl font-bold focus:border-blue-500 outline-none" />
                {!submitted && <button onClick={check} className="bg-blue-500 text-white px-8 rounded-xl font-black hover:bg-blue-600 transition-all">Check</button>}
            </div>
            <FeedbackDisplay status={status === 'idle' ? null : status} explanation={q.explanation} />
            {submitted && status === 'wrong' && <p className="mt-2 text-green-700 font-bold">Đáp án: {q.correctAnswer}</p>}
        </div>
    );
};

const ErrorIdCard: React.FC<{ q: ErrorIdQ, index: number, onAnswer: (correct: boolean) => void }> = ({ q, index, onAnswer }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const handleCheck = (idx: number) => {
        if (submitted) return;
        const correct = idx === q.correctOptionIndex;
        setSelected(idx);
        setSubmitted(true);
        onAnswer(correct);
    };
    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-red-200 transition-colors">
            <div className="flex gap-3 mb-4">
                <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded-lg shrink-0">Câu {index}</span>
                <p className="font-bold text-lg">Tìm lỗi sai: "{q.sentence}"</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {(q.options || []).map((opt, i) => (
                    <button key={i} onClick={() => handleCheck(i)} disabled={submitted} className={`p-4 border-2 rounded-xl font-bold transition-all ${submitted ? (i === q.correctOptionIndex ? 'bg-green-100 border-green-500 text-green-700' : (i === selected ? 'bg-red-100 border-red-500 text-red-700' : 'bg-slate-50 border-slate-200')) : 'bg-slate-50 border-slate-200 hover:border-red-300'}`}>{String.fromCharCode(65 + i)}. {opt}</button>
                ))}
            </div>
            {submitted && <p className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-2xl font-black text-green-800">Sửa đúng: {q.correction}</p>}
            <FeedbackDisplay status={submitted ? (selected === q.correctOptionIndex ? 'correct' : 'wrong') : null} explanation={q.explanation} />
        </div>
    );
};

export const PracticeSection: React.FC<{ content: PracticeContent }> = ({ content }) => {
    const [name, setName] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [scoreMap, setScoreMap] = useState<ScoreState>({});
    const [isFinished, setIsFinished] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);
    
    const correctCount = Object.values(scoreMap).filter(v => v === true).length;
    const answeredCount = Object.keys(scoreMap).length;
    const totalQuestions = 30;
    
    const scoreOutOfTen = parseFloat(((correctCount / totalQuestions) * 10).toFixed(1));
    const classification = getClassification(scoreOutOfTen);

    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();

    const downloadCertificate = async () => {
        if (certRef.current === null) return;
        try {
            const dataUrl = await toPng(certRef.current, { 
              cacheBust: true, 
              backgroundColor: '#fff', 
              pixelRatio: 3,
              style: {
                fontFamily: 'Lexend, sans-serif'
              }
            });
            const link = document.createElement('a');
            link.download = `GiayChungNhan-${name}-${scoreOutOfTen}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error(err);
            alert("Không thể lưu ảnh. Vui lòng thử lại.");
        }
    };

    if (!isStarted) {
        return (
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl border-b-8 border-brand-400 max-w-xl mx-auto text-center animate-fade-in my-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-300 via-brand-500 to-brand-300"></div>
                <div className="text-8xl mb-6 animate-bounce-slow drop-shadow-lg">🎓</div>
                <h2 className="text-4xl font-black text-slate-800 mb-2 font-display">Sẵn sàng thử thách?</h2>
                <p className="text-slate-500 mb-8 font-medium italic">Vượt qua các câu hỏi để nhận Chứng Nhận từ Cô Lợi!</p>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-brand-600 uppercase tracking-widest mb-2 text-left">Tên của học viên</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập họ và tên..." className="w-full p-5 text-2xl rounded-2xl border-4 border-brand-100 focus:border-brand-400 outline-none text-center font-black text-slate-700 bg-brand-50/50" />
                    </div>
                    <button onClick={() => name.trim() && setIsStarted(true)} disabled={!name.trim()} className="w-full py-6 bg-brand-500 text-brand-900 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-brand-400 transform active:scale-95 transition-all disabled:opacity-50 disabled:grayscale">
                        CHINH PHỤC NGAY 🚀
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in pb-24 mt-10">
            {!isFinished ? (
              <>
                <div className="bg-brand-400 p-6 rounded-[2.5rem] shadow-xl sticky top-24 z-30 flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-brand-500">
                    <div className="text-left">
                        <h2 className="text-2xl font-black text-brand-900 leading-none">Học viên: {name}</h2>
                        <p className="text-brand-800 text-xs font-bold uppercase tracking-widest mt-1">Hệ thống giáo dục Cô Lợi Genius English</p>
                    </div>
                    <div className="flex-1 w-full max-w-lg mx-4">
                        <div className="flex justify-between text-xs font-black mb-2 text-brand-900">
                            <span>TIẾN ĐỘ HOÀN THÀNH</span>
                            <span>{answeredCount}/{totalQuestions} CÂU</span>
                        </div>
                        <div className="bg-white/40 h-5 rounded-full border-2 border-brand-900/20 overflow-hidden shadow-inner">
                            <div className="h-full bg-brand-900 transition-all duration-1000 ease-out shadow-lg" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-brand-900 text-brand-300 px-6 py-3 rounded-2xl font-black text-lg flex items-center gap-3 border-2 border-brand-800 shadow-lg">
                        <span className="text-brand-400 text-sm">ĐÚNG:</span> {correctCount}
                    </div>
                </div>

                <div className="grid gap-10 max-w-4xl mx-auto px-2">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-brand-400 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-brand-500 font-black">A</div>
                            <h3 className="text-2xl font-black text-brand-800 font-display">TRẮC NGHIỆM TỔNG HỢP</h3>
                        </div>
                        {content.multipleChoice.map((q, i) => <MultipleChoiceCard key={q.id} q={q} index={i+1} onAnswer={c => setScoreMap(p => ({...p, [q.id]: c}))} />)}
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-orange-400 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-orange-500 font-black">B</div>
                            <h3 className="text-2xl font-black text-orange-800 font-display">SẮP XẾP CÂU HOÀN CHỈNH</h3>
                        </div>
                        {content.scramble.map((q, i) => <ScrambleCard key={q.id} q={q} index={i+1+content.multipleChoice.length} onAnswer={c => setScoreMap(p => ({...p, [q.id]: c}))} />)}
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-400 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-blue-500 font-black">C</div>
                            <h3 className="text-2xl font-black text-blue-800 font-display">ĐIỀN TỪ CÒN THIẾU</h3>
                        </div>
                        {content.fillBlank.map((q, i) => <FillBlankCard key={q.id} q={q} index={i+1+content.multipleChoice.length+content.scramble.length} onAnswer={c => setScoreMap(p => ({...p, [q.id]: c}))} />)}
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-400 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-red-500 font-black">D</div>
                            <h3 className="text-2xl font-black text-red-800 font-display">THỬ THÁCH TÌM LỖ SAI</h3>
                        </div>
                        {content.errorIdentification.map((q, i) => <ErrorIdCard key={q.id} q={q} index={i+1+content.multipleChoice.length+content.scramble.length+content.fillBlank.length} onAnswer={c => setScoreMap(p => ({...p, [q.id]: c}))} />)}
                    </div>
                </div>

                <div className="text-center pt-12 pb-20">
                    <button 
                        onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setIsFinished(true); }} 
                        className="bg-brand-500 text-brand-900 px-20 py-8 rounded-[3rem] font-black text-3xl shadow-2xl transform hover:-translate-y-2 hover:bg-brand-400 transition-all border-b-8 border-brand-700 active:translate-y-0 active:border-b-0"
                    >
                        🏁 XEM GIẤY CHỨNG NHẬN
                    </button>
                    {answeredCount < totalQuestions && <p className="mt-4 text-brand-600 font-bold animate-pulse">Bạn có thể xem chứng nhận ngay bây giờ hoặc tiếp tục làm bài!</p>}
                </div>
              </>
            ) : (
                <div className="flex flex-col items-center gap-12 animate-fade-in py-16 px-4">
                    {/* Certificate Component - Fixed Width for consistent export */}
                    <div ref={certRef} className="relative w-[1000px] h-[720px] bg-white border-[25px] border-double border-brand-400 p-12 shadow-2xl overflow-hidden flex flex-col items-center justify-center select-none font-display">
                        {/* Background Decoration */}
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 2.5px, transparent 2.5px)', backgroundSize: '45px 45px' }}></div>
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-100 rounded-full blur-[100px] opacity-40"></div>
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-100 rounded-full blur-[100px] opacity-40"></div>
                        
                        {/* Frame Inside */}
                        <div className="relative z-10 w-full text-center border-[6px] border-brand-200 p-8 h-full flex flex-col items-center justify-between shadow-inner bg-white/60">
                            <div className="space-y-1">
                                <h1 className="text-5xl font-black text-brand-600 uppercase tracking-[0.2em] mb-1 drop-shadow-sm">CERTIFICATE</h1>
                                <p className="text-sm text-slate-400 font-extrabold uppercase tracking-[0.3em]">OF EXCELLENT ACHIEVEMENT</p>
                            </div>

                            <div className="my-2">
                                <p className="text-lg text-slate-500 italic mb-2 font-normal">Trân trọng trao tặng học viên:</p>
                                <h2 className="text-6xl font-black text-slate-800 border-b-4 border-brand-400 inline-block px-10 pb-2 uppercase tracking-tight leading-none">{name}</h2>
                            </div>

                            <div className="space-y-4 w-full">
                                <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-semibold">
                                    Đã hoàn thành xuất sắc các thử thách tại<br/>
                                    <span className="text-brand-600 font-black">Trung tâm Genius English</span>
                                </p>
                                
                                <div className="flex justify-center items-center gap-12 py-4 bg-brand-50/70 rounded-[2rem] border-2 border-brand-100 shadow-inner px-10 max-w-2xl mx-auto">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">ĐIỂM SỐ</p>
                                        <p className="text-5xl font-black text-brand-600 drop-shadow-sm">{scoreOutOfTen.toFixed(1)} <span className="text-xl text-slate-400">/ 10</span></p>
                                    </div>
                                    <div className="w-0.5 h-12 bg-brand-200"></div>
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">XẾP LOẠI</p>
                                        <div className="flex flex-col items-center">
                                            <p className={`text-3xl font-black ${classification.color} uppercase tracking-tighter drop-shadow-sm`}>{classification.text}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between w-full items-end mt-4 px-10">
                                <div className="text-left">
                                    <p className="text-slate-800 font-black text-lg mb-1">
                                      Ngày {day}/{month}/{year}
                                    </p>
                                    <div className="w-40 h-0.5 bg-slate-200 rounded-full"></div>
                                    <p className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Thời gian cấp</p>
                                </div>
                                <div className="relative text-center">
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-28 h-28 border-[8px] border-brand-100 rounded-full opacity-10 flex items-center justify-center rotate-12 -z-10">
                                        <span className="text-7xl text-brand-400 opacity-20">★</span>
                                    </div>
                                    <p className="text-brand-600 font-black italic text-3xl mb-1 drop-shadow-sm">Ms. Lợi Phùng</p>
                                    <div className="w-56 h-0.5 bg-brand-500 rounded-full mx-auto"></div>
                                    <div className="mt-2">
                                        <p className="text-xs font-black text-brand-700 uppercase tracking-[0.15em]">Phùng Lợi</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Giám đốc Trung tâm Genius English</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-6 left-6 w-20 h-20 opacity-[0.05] grayscale pointer-events-none">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                        <button onClick={downloadCertificate} className="flex-1 py-6 bg-emerald-500 text-white px-10 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 transform hover:-translate-y-2 border-b-8 border-emerald-700 active:translate-y-0 active:border-b-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            TẢI CHỨNG NHẬN
                        </button>
                        <button onClick={() => { setIsFinished(false); setIsStarted(false); setScoreMap({}); setName(''); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="flex-1 py-6 bg-slate-200 text-slate-600 px-10 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-slate-300 transition-all border-b-8 border-slate-400 active:translate-y-0 active:border-b-0">
                            🔄 LÀM BÀI TẬP KHÁC
                        </button>
                    </div>
                    {answeredCount < totalQuestions && (
                      <button 
                        onClick={() => setIsFinished(false)}
                        className="text-brand-600 font-black hover:underline text-lg"
                      >
                        Tiếp tục làm bài để cải thiện điểm số ✍️
                      </button>
                    )}
                </div>
            )}
        </div>
    );
};
