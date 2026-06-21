import React, { useState, useEffect, useRef } from 'react';

interface CartoonGeneratorProps {
  topic?: string;
}

export const CartoonGenerator: React.FC<CartoonGeneratorProps> = ({ topic }) => {
  const [character, setCharacter] = useState(topic || '');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const mountedRef = useRef(false);

  const popularCharacters = ["Elsa", "Spider-Man", "Pikachu", "Doraemon", "Harry Potter", "Minion"];

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (topic) {
        setCharacter(topic);
        handleGenerate(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const handleGenerate = (subject: string = character) => {
    if (!subject) return;
    setLoading(true);
    setImageLoaded(false);
    
    // Create a very specific prompt for Chibi 3D style
    const prompt = `adorable 3d chibi render of ${subject} concept, pixar style animation, cute big eyes, volumetric lighting, 8k resolution, vibrant colors, 3d blender render, high detail, white background`;
    
    // Use Pollinations AI
    const seed = Math.floor(Math.random() * 10000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
    
    // Set URL immediately, but keep loading state true until onLoad fires
    if (mountedRef.current) {
        setGeneratedImage(url);
    }
  };

  const handleImageLoad = () => {
    if (mountedRef.current) {
        setLoading(false);
        setImageLoaded(true);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-purple-100 p-8 md:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400"></div>
      
      <div className="grid md:grid-cols-2 gap-8 items-center">
          
          <div className="order-2 md:order-1">
            <div className="mb-6">
                <h2 className="text-4xl font-black text-slate-800 font-display mb-2">
                    Magic 3D Cartoon Maker
                </h2>
                <p className="text-slate-500 text-lg">
                    {topic ? 'Look at this amazing 3D picture of our topic.' : 'Turn any character into a cute 3D Chibi toy!'}
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    placeholder="Type a character or topic..."
                    className="flex-1 p-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-lg font-bold text-slate-700"
                />
                <button 
                    onClick={() => handleGenerate(character)}
                    disabled={!character || loading}
                    className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 whitespace-nowrap"
                >
                    {loading ? '🎨 Painting...' : '✨ Create New'}
                </button>
                </div>

                {/* Quick Chips */}
                {!topic && (
                    <div className="flex flex-wrap gap-2">
                    {popularCharacters.map((char) => (
                        <button
                        key={char}
                        onClick={() => { setCharacter(char); handleGenerate(char); }}
                        className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200 hover:bg-purple-100 hover:scale-105 transition-all"
                        >
                        {char}
                        </button>
                    ))}
                    </div>
                )}
            </div>
          </div>

          {/* Display Area */}
          <div className="order-1 md:order-2">
            <div className="bg-slate-50 rounded-2xl border-4 border-dashed border-slate-200 aspect-square md:aspect-video flex items-center justify-center relative overflow-hidden group shadow-inner">
                {/* Loading State Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm animate-pulse">
                        <div className="text-6xl mb-4 animate-bounce">🪄</div>
                        <div className="text-purple-400 font-bold text-xl">Creating 3D Magic...</div>
                    </div>
                )}
                
                {/* Empty State */}
                {!generatedImage && !loading && (
                    <div className="text-slate-300 font-black text-2xl text-center px-4">
                        Your picture will appear here!
                    </div>
                )}

                {/* Image */}
                {generatedImage && (
                    <div className={`relative w-full h-full group ${loading ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
                        <img 
                            src={generatedImage} 
                            alt={character} 
                            className="w-full h-full object-cover md:object-contain rounded-xl shadow-sm transform transition-transform duration-700 group-hover:scale-105"
                            onLoad={handleImageLoad}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                        <a 
                            href={generatedImage} 
                            download={`ms-ly-english-${character}.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-4 right-4 bg-white text-purple-600 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-purple-50 flex items-center gap-2 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Download
                        </a>
                    </div>
                )}
            </div>
          </div>
      </div>
    </div>
  );
};