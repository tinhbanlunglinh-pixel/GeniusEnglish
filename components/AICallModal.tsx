
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { QAPair } from '../types';

interface AICallModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyContext: string;
  qaPairs?: QAPair[];
}

interface TranscriptItem {
  role: 'user' | 'teacher';
  text: string;
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const AICallModal: React.FC<AICallModalProps> = ({ isOpen, onClose, storyContext, qaPairs = [] }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [callTime, setCallTime] = useState(0); 
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  useEffect(() => {
    if (!isOpen) stopSession();
  }, [isOpen]);

  useEffect(() => {
    let interval: number | undefined;
    if (status === 'connected') {
      interval = window.setInterval(() => setCallTime(prev => prev + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const startCall = async () => {
    try {
      setStatus('connecting');
      setCallTime(0);
      setTranscripts([]);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      await inputCtx.resume();
      await outputCtx.resume();
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const apiKey = localStorage.getItem('api_key') || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const qaContext = qaPairs.map((p, i) => `Q${i+1}: ${p.question}, A${i+1}: ${p.answer}`).join('\n');

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              const pcmB64 = encodeBase64(new Uint8Array(int16.buffer));
              sessionPromise.then(session => session.sendRealtimeInput({ media: { data: pcmB64, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);

            // Gửi tín hiệu mồi để AI chào ngay khi bắt máy
            sessionPromise.then(session => {
              const wakeUpPcm = new Int16Array(4000).fill(0); // 250ms silence
              const wakeUpB64 = encodeBase64(new Uint8Array(wakeUpPcm.buffer));
              session.sendRealtimeInput({ media: { data: wakeUpB64, mimeType: 'audio/pcm;rate=16000' } });
            });
          },
          onmessage: async (msg: LiveServerMessage) => {
            const parts = msg.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  setIsSpeaking(true);
                  const ctx = outputAudioContextRef.current;
                  if (ctx) {
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    const audioBuffer = await decodeAudioData(decodeBase64(part.inlineData.data), ctx, 24000, 1);
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    const gain = ctx.createGain();
                    gain.gain.value = 2.5; 
                    source.connect(gain);
                    gain.connect(ctx.destination);
                    source.onended = () => {
                      audioSourcesRef.current.delete(source);
                      if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
                    };
                    audioSourcesRef.current.add(source);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                  }
                }
              }
            }
            if (msg.serverContent?.inputTranscription) currentInputTranscription.current += msg.serverContent.inputTranscription.text;
            if (msg.serverContent?.outputTranscription) currentOutputTranscription.current += msg.serverContent.outputTranscription.text;
            if (msg.serverContent?.turnComplete) {
              if (currentInputTranscription.current) setTranscripts(prev => [...prev, { role: 'user', text: currentInputTranscription.current }]);
              if (currentOutputTranscription.current) setTranscripts(prev => [...prev, { role: 'teacher', text: currentOutputTranscription.current }]);
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }
            if (msg.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => setStatus('disconnected'),
          onerror: (e) => { setStatus('error'); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `You are Cô Lợi, an energetic English teacher at Genius English Center.
          IMMEDIATE ACTION: GREET THE STUDENT INSTANTLY!
          Say: "Hello! Cô Lợi đây! Cô rất vui được gặp con! Are you ready for some English magic?"
          Then lead a speaking practice based on the lesson: ${qaContext}`
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e) { setStatus('error'); }
  };

  const stopSession = () => {
    if (sessionPromiseRef.current) sessionPromiseRef.current.then(s => { try { s.close(); } catch(e) {} });
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setStatus('idle');
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] max-w-4xl w-full h-[85vh] relative overflow-hidden shadow-2xl border-8 border-brand-100 flex flex-col">
        <div className="p-8 md:p-10 flex items-center justify-between border-b border-slate-100 bg-white">
            <div className="flex items-center gap-6">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 ${isSpeaking ? 'bg-gradient-to-tr from-pink-500 to-purple-600 scale-110 ring-8 ring-purple-100' : 'bg-gradient-to-tr from-blue-500 to-cyan-500'}`}>
                    <span className="text-4xl md:text-5xl">{isSpeaking ? '👩‍🏫' : '📞'}</span>
                </div>
                <div>
                    <h3 className="text-3xl md:text-4xl font-black text-slate-800 font-display">Cô Lợi Genius</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{status === 'connected' ? 'Đang nói chuyện' : status === 'connecting' ? 'Đang gọi...' : 'Sẵn sàng'}</p>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-4 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all transform hover:rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50 space-y-6">
            {status === 'idle' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
                    <div className="text-9xl animate-bounce-slow">👩‍🏫</div>
                    <button onClick={startCall} className="px-16 py-8 bg-green-500 text-white font-black text-3xl rounded-3xl shadow-2xl hover:bg-green-600 transform hover:-translate-y-2 transition-all flex items-center gap-4 mx-auto">
                        <span className="text-4xl">📞</span> GỌI CÔ LỢI
                    </button>
                </div>
            )}
            {status === 'connecting' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
                    <div className="relative">
                        <div className="w-40 h-40 bg-blue-100 rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-40 h-40 bg-blue-500 rounded-full flex items-center justify-center text-8xl relative z-10 shadow-2xl">📱</div>
                    </div>
                    <p className="text-4xl font-black text-slate-700 font-display">Đang nối máy...</p>
                </div>
            )}
            {transcripts.map((item, idx) => (
                <div key={idx} className={`flex ${item.role === 'teacher' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                    <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-xl border-2 ${item.role === 'teacher' ? 'bg-white border-blue-50 text-blue-900 rounded-tl-none' : 'bg-brand-400 border-brand-500 text-brand-900 rounded-tr-none'}`}>
                        <p className="font-bold text-2xl leading-relaxed">{item.text}</p>
                    </div>
                </div>
            ))}
            <div ref={transcriptEndRef} />
        </div>
        {status === 'connected' && (
            <div className="p-10 bg-white border-t flex flex-col items-center gap-6">
                <button onClick={onClose} className="w-full max-w-md py-6 bg-red-600 text-white font-black text-2xl rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 hover:bg-red-700 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="rotate-[135deg]"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1H7c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    Dừng học nói
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
