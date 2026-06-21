import React, { useState } from 'react';
import { UploadZone } from './UploadZone';
import { StoryDisplay } from './StoryDisplay';
import { AppState, LoadingStep, CharacterProfile, AppMode, EnglishLevel, ImageRatio } from '../types';
import { 
  fileToBase64, 
  analyzeImageAndCreateContent, 
  generateStoryImage, 
  generateAudioFromContent,
  initializeGeminiChat
} from '../services/geminiService';

// --- Character Configuration ---
const CHARACTERS: CharacterProfile[] = [
  {
    id: 'doraemon',
    name: 'Doraemon',
    emoji: '🐱',
    promptContext: 'Doraemon, Nobita, and their friends',
    stylePrompt: 'anime style, vibrant colors, Doraemon Fujiko F. Fujio art style',
    colorClass: 'bg-blue-500'
  },
  {
    id: 'superman',
    name: 'Superman',
    emoji: '🦸',
    promptContext: 'Superman saving the day',
    stylePrompt: 'classic American comic book style, DC comics art style, vibrant, bold lines',
    colorClass: 'bg-blue-700'
  },
  {
    id: 'luffy',
    name: 'Luffy',
    emoji: '👒',
    promptContext: 'Monkey D. Luffy from One Piece',
    stylePrompt: 'One Piece anime style, Eiichiro Oda art style, adventurous',
    colorClass: 'bg-red-600'
  },
  {
    id: 'zoro',
    name: 'Zoro',
    emoji: '⚔️',
    promptContext: 'Roronoa Zoro from One Piece',
    stylePrompt: 'One Piece anime style, cool, sharp green aesthetic',
    colorClass: 'bg-green-600'
  },
  {
    id: 'chopper',
    name: 'Chopper',
    emoji: '🦌',
    promptContext: 'Tony Tony Chopper from One Piece',
    stylePrompt: 'One Piece anime style, cute, chibi, vibrant',
    colorClass: 'bg-pink-500'
  },
  {
    id: 'shin',
    name: 'Shin',
    emoji: '🖍️',
    promptContext: 'Shin-chan (Crayon Shin-chan)',
    stylePrompt: 'Crayon Shin-chan art style, simple, funny, hand-drawn look',
    colorClass: 'bg-yellow-500'
  },
  {
    id: 'tom_jerry',
    name: 'Tom & Jerry',
    emoji: '🐭',
    promptContext: 'Tom the cat and Jerry the mouse',
    stylePrompt: 'classic 1950s cartoon style, Hanna-Barbera art style, slapstick',
    colorClass: 'bg-gray-500'
  },
  {
    id: 'pua',
    name: 'Pua',
    emoji: '🐷',
    promptContext: 'Pua the pig (from Moana)',
    stylePrompt: 'Disney 3D animation style, cute, tropical background',
    colorClass: 'bg-pink-300'
  },
  {
    id: 'jack_jack',
    name: 'Jack-Jack',
    emoji: '👶',
    promptContext: 'Jack-Jack Parr (The Incredibles)',
    stylePrompt: 'Pixar 3D animation style, The Incredibles art style',
    colorClass: 'bg-red-500'
  }
];

const INITIAL_STATE: AppState = {
  selectedCharacter: CHARACTERS[0],
  selectedLevel: EnglishLevel.STARTER,
  selectedMode: AppMode.ANALYSIS,
  selectedRatio: '1:1',
  customTopic: '',
  customText: '',
  customPrompt: '',
  originalImages: [],
  generatedImage: null,
  audioUrl: null,
  contentResult: null,
  isLoading: false,
  loadingStep: LoadingStep.IDLE,
  error: null
};

export const MagicStory: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleCharacterSelect = (char: CharacterProfile) => {
      setState(prev => ({ ...prev, selectedCharacter: char }));
  };

  const handleFilesSelect = (files: File[]) => {
    setPendingFiles(files);
    setIsConfiguring(true);
  };

  const handleStartMagic = async () => {
    try {
      setIsConfiguring(false);
      setState(prev => ({
        ...prev,
        originalImages: [],
        generatedImage: null,
        audioUrl: null,
        contentResult: null,
        error: null,
        isLoading: true,
        loadingStep: LoadingStep.ANALYZING
      }));

      console.log("Starting Magic Story generation...");

      // Convert all files to base64
      const imagePromises = pendingFiles.map(file => fileToBase64(file));
      const base64Images = await Promise.all(imagePromises);
      
      const originalImageUrls = base64Images.map((b64, idx) => `data:${pendingFiles[idx].type};base64,${b64}`);
      
      setState(prev => ({ ...prev, originalImages: originalImageUrls }));

      // Step 1: Analyze & Generate Content
      console.log("Analyzing images and creating story content...");
      const contentResult = await analyzeImageAndCreateContent(
        base64Images, 
        pendingFiles.length > 0 ? pendingFiles[0].type : "image/jpeg",
        state.selectedCharacter,
        state.selectedMode,
        state.selectedLevel,
        state.customPrompt,
        state.customTopic,
        state.customText
      );
      
      if (!contentResult || !contentResult.storyEnglish) {
          throw new Error("Dữ liệu trả về từ AI không hợp lệ hoặc thiếu nội dung câu truyện.");
      }

      setState(prev => ({
        ...prev,
        contentResult,
        loadingStep: LoadingStep.GENERATING_IMAGE
      }));

      // Step 2: Generate Image
      console.log("Generating magic scene image...");
      const generatedImage = await generateStoryImage(
        contentResult.imagePrompt, 
        state.selectedCharacter.stylePrompt,
        state.selectedRatio
      );
      
      setState(prev => ({
        ...prev,
        generatedImage,
        loadingStep: LoadingStep.GENERATING_AUDIO
      }));

      // Step 3: Generate Audio (Optional)
      const audioUrl = await generateAudioFromContent(contentResult);

      setState(prev => ({
        ...prev,
        audioUrl,
        isLoading: false,
        loadingStep: LoadingStep.COMPLETED
      }));

    } catch (error: any) {
      console.error("Magic Story Error:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingStep: LoadingStep.IDLE,
        error: error.message || "Oops! We couldn't process that magic. Please try again."
      }));
    }
  };

  const handleReset = () => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setPendingFiles([]);
    setIsConfiguring(false);
    setState(prev => ({
        ...INITIAL_STATE,
        selectedCharacter: prev.selectedCharacter,
        selectedLevel: prev.selectedLevel,
        selectedMode: prev.selectedMode,
        selectedRatio: prev.selectedRatio,
        customTopic: '',
        customText: '',
        customPrompt: ''
    }));
  };

  return (
    <div className="w-full">
        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 p-6 rounded-2xl text-center space-y-4 animate-fade-in border-2 border-red-100 mx-auto max-w-4xl mb-8" role="alert">
            <div className="flex flex-col items-center gap-2">
                <span className="text-4xl mb-2">⚠️</span>
                <p className="font-black text-red-700 text-xl">Lỗi tạo nội dung</p>
                <p className="text-red-600 font-medium text-lg">{state.error}</p>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm">
                🔑 Đổi API Key
              </button>
              <button onClick={() => {
                 setState(s => ({...s, error: null}));
                 initializeGeminiChat();
                 setTimeout(() => handleStartMagic(), 100);
              }} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-sm">
                🔄 Thử lại
              </button>
              <button 
                  onClick={() => setState(s => ({...s, error: null}))}
                  className="px-6 py-2 bg-transparent text-red-600 font-bold hover:bg-red-100 rounded-xl transition-colors"
              >
                  Đóng
              </button>
            </div>
          </div>
        )}

        {/* --- STATE 1: SELECTION & UPLOAD --- */}
        {!state.contentResult && !state.isLoading && !isConfiguring && (
          <div className="space-y-12 animate-fade-in max-w-5xl mx-auto">
            
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-slate-800 font-display mb-3">Turn Books into Magic Stories!</h2>
                <p className="text-slate-500 text-lg">Select a character and upload a picture or type your content.</p>
            </div>

            {/* Character Selector */}
            <section>
              <h3 className="text-center text-xl font-black text-brand-600 mb-6 uppercase tracking-widest">1. Choose Your Hero</h3>
              <div className="flex flex-wrap justify-center gap-6">
                {CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => handleCharacterSelect(char)}
                    className={`
                      flex flex-col items-center p-4 rounded-3xl border-4 transition-all transform duration-200
                      ${state.selectedCharacter.id === char.id 
                        ? 'border-brand-400 bg-white shadow-xl scale-110 -translate-y-2' 
                        : 'border-transparent bg-white/50 hover:bg-white hover:shadow-lg opacity-70 hover:opacity-100 hover:scale-105'}
                    `}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner ${char.colorClass} text-white mb-2`}>
                      {char.emoji}
                    </div>
                    <span className="text-base font-bold text-slate-700">{char.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Inputs & Uploads */}
            <section className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
               <div className="space-y-6">
                  <h3 className="text-center text-xl font-black text-brand-600 mb-6 uppercase tracking-widest">2. What's the Story about?</h3>
                  <div className="space-y-4">
                     <input 
                        type="text" 
                        placeholder="Magic Topic (e.g. My Happy Family)" 
                        className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-brand-400 outline-none font-bold"
                        value={state.customTopic}
                        onChange={(e) => setState(s => ({...s, customTopic: e.target.value}))}
                     />
                     <textarea 
                        placeholder="Lesson Content or Story Idea (Optional)..." 
                        rows={4}
                        className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-brand-400 outline-none font-medium resize-none"
                        value={state.customText}
                        onChange={(e) => setState(s => ({...s, customText: e.target.value}))}
                     />
                  </div>
                  { (state.customTopic || state.customText) && (
                     <button 
                        onClick={() => setIsConfiguring(true)}
                        className="w-full py-4 bg-brand-500 text-white font-black text-xl rounded-2xl shadow-lg hover:bg-brand-600 transition-all"
                     >
                        🚀 Next Step
                     </button>
                  )}
               </div>

               <div>
                  <h3 className="text-center text-xl font-black text-brand-600 mb-6 uppercase tracking-widest">OR Upload Pages</h3>
                  <UploadZone 
                      onFilesSelect={handleFilesSelect} 
                      isLoading={state.isLoading}
                      fileCount={pendingFiles.length}
                    />
               </div>
            </section>
          </div>
        )}

        {/* --- STATE 2: CONFIGURATION MODAL --- */}
        {isConfiguring && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full p-8 relative overflow-hidden animate-bounce-in">
               <div className="absolute top-0 left-0 w-full h-3 bg-brand-400"></div>
               
               <h2 className="text-3xl font-black text-center mb-8 font-display text-slate-800">Customize Your Magic</h2>

               <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Mode Selector */}
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-wide">Magic Mode</label>
                    <div className="flex flex-col gap-3">
                      <label className={`
                          flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${state.selectedMode === AppMode.ANALYSIS ? 'border-brand-400 bg-brand-50 shadow-sm' : 'border-slate-100 hover:border-brand-200'}
                        `}>
                          <input 
                            type="radio" 
                            name="mode" 
                            className="hidden"
                            checked={state.selectedMode === AppMode.ANALYSIS}
                            onChange={() => setState(s => ({...s, selectedMode: AppMode.ANALYSIS}))}
                           />
                          <span className="text-3xl mr-4">📝</span>
                          <div>
                            <div className="font-bold text-slate-800 text-lg">Analysis & Practice</div>
                            <div className="text-xs text-slate-500 font-medium">Extract Q&A, and Vocab.</div>
                          </div>
                      </label>

                      <label className={`
                          flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${state.selectedMode === AppMode.CREATIVE ? 'border-brand-400 bg-brand-50 shadow-sm' : 'border-slate-100 hover:border-brand-200'}
                        `}>
                          <input 
                            type="radio" 
                            name="mode" 
                            className="hidden"
                            checked={state.selectedMode === AppMode.CREATIVE}
                            onChange={() => setState(s => ({...s, selectedMode: AppMode.CREATIVE}))}
                           />
                          <span className="text-3xl mr-4">✨</span>
                          <div>
                            <div className="font-bold text-slate-800 text-lg">Story Adventure</div>
                            <div className="text-xs text-slate-500 font-medium">Create a fun story using the words.</div>
                          </div>
                      </label>
                    </div>
                  </div>

                  {/* Right Column: Level & Ratio */}
                  <div className="space-y-6">
                    
                    {/* Level Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-black text-slate-400 uppercase tracking-wide">English Level</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(EnglishLevel).map((level) => (
                          <label key={level} className={`
                            flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-center
                            ${state.selectedLevel === level ? 'border-brand-400 bg-brand-50 text-brand-700 font-bold' : 'border-slate-100 text-slate-500 font-medium'}
                          `}>
                            <input 
                              type="radio" 
                              name="level" 
                              className="hidden" 
                              checked={state.selectedLevel === level} 
                              onChange={() => setState(s => ({...s, selectedLevel: level}))}
                            />
                            <span className="text-sm">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Image Ratio Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-black text-slate-400 uppercase tracking-wide">Image Size</label>
                      <div className="flex flex-wrap gap-2">
                        {(['1:1', '16:9', '9:16'] as ImageRatio[]).map((ratio) => (
                          <label key={ratio} className={`
                            flex items-center justify-center px-4 py-2 rounded-xl border-2 cursor-pointer transition-all
                            ${state.selectedRatio === ratio ? 'border-brand-400 bg-brand-50 text-brand-700 font-bold' : 'border-slate-100 text-slate-500 font-medium'}
                          `}>
                            <input 
                              type="radio" 
                              name="ratio" 
                              className="hidden" 
                              checked={state.selectedRatio === ratio} 
                              onChange={() => setState(s => ({...s, selectedRatio: ratio}))}
                            />
                            <span className="text-xs">{ratio}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
               </div>

               {/* Custom Prompt (Optional) */}
               <div className="mb-8 animate-fade-in">
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-wide mb-2">
                    Custom Instructions (Optional)
                  </label>
                  <textarea 
                    placeholder="E.g., Make the story funny. Focus on school vocabulary."
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none transition-all resize-none text-slate-700 font-medium"
                    rows={3}
                    value={state.customPrompt}
                    onChange={(e) => setState(s => ({...s, customPrompt: e.target.value}))}
                  />
               </div>
               
               <div className="flex gap-4 pt-4">
                 <button 
                    onClick={() => setIsConfiguring(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                  >
                   Cancel
                 </button>
                 <button 
                    onClick={handleStartMagic}
                    className="flex-1 py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-xl shadow-lg shadow-brand-200 transform hover:-translate-y-1 transition-all"
                  >
                   ✨ Generate Magic
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* --- STATE 3: LOADING --- */}
        {state.isLoading && (
          <div className="mt-20 text-center space-y-8">
            <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-brand-400 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-6xl animate-bounce-slow">
                  {state.selectedCharacter.emoji}
                </div>
            </div>
            <div>
                <h2 className="text-4xl font-black text-brand-600 animate-pulse font-display mb-2">
                {state.loadingStep}
                </h2>
                <p className="text-slate-500 text-lg font-medium">Please wait while we perform magic on your content...</p>
            </div>
          </div>
        )}

        {/* --- STATE 4: RESULT --- */}
        {state.contentResult && state.generatedImage && (
          <StoryDisplay
            contentResult={state.contentResult}
            generatedImage={state.generatedImage}
            originalImages={state.originalImages}
            audioUrl={state.audioUrl}
            onReset={handleReset}
          />
        )}
    </div>
  );
};