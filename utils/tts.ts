/**
 * High quality TTS (Text to Speech) helper using Web Speech API (speechSynthesis)
 * Optimized for natural, warm male/female native English voices.
 */

// We keep a small cache of voices or listen to onvoiceschanged.
let cachedVoices: SpeechSynthesisVoice[] = [];

const getVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  if (cachedVoices.length > 0) return cachedVoices;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
  return voices;
};

// Listen to voiceschanged event to update cache
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Searches for a premium, highly expressive native American/British English female voice.
 * Prioritizes natural/neural sounding voices with excellent pitch and warm tones.
 */
export const getPremiumFemaleVoice = (): SpeechSynthesisVoice | null => {
  const voices = getVoices();
  if (voices.length === 0) return null;

  // Prioritized list of beautiful native female voices across platforms
  const prioritizedKeywords = [
    'samantha',      // iOS/macOS (excellent, warm and expressive)
    'ava',           // iOS/macOS (ultra clear, expressive)
    'google us'      // Google Chrome US English Female (exceptionally clear)
  ];

  // Try standard premium ones
  for (const keyword of prioritizedKeywords) {
    const found = voices.find(v => 
      v.lang.startsWith('en-') && 
      v.name.toLowerCase().includes(keyword)
    );
    if (found) return found;
  }

  // Next, look for general high-quality natural/neural/microsoft Susan or Zira
  const fallbackKeywords = [
    'natural',
    'microsoft susan',
    'microsoft hazel', // UK English (lovely warm accent)
    'microsoft zira',
    'siri',
    'female',
    'en-us',
    'en-gb'
  ];

  for (const keyword of fallbackKeywords) {
    const found = voices.find(v => 
      v.lang.toLowerCase().startsWith('en-') && 
      v.name.toLowerCase().includes(keyword)
    );
    if (found) return found;
  }

  // Fallback to any English voice
  const anyEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en-'));
  if (anyEnglish) return anyEnglish;

  // Ultimate fallback
  return voices[0] || null;
};

/**
 * Executes high-quality TTS speech synthesis with warm native English intonation.
 */
export const speakEnglish = (
  text: string, 
  onEnd?: () => void, 
  onBoundary?: (event: SpeechSynthesisEvent) => void
) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any currently running speech
  window.speechSynthesis.cancel();

  // Create an utterance with high-quality tuning
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Track and set premium voice
  const premiumVoice = getPremiumFemaleVoice();
  if (premiumVoice) {
    utterance.voice = premiumVoice;
  }
  
  utterance.lang = 'en-US';

  // Tuning for: "nhấn nhá ngữ điệu siêu hay, trầm ấm, dễ nghe"
  // Slightly slower rate for natural parsing & articulation (0.85 - 0.9)
  // Perfectly balanced pitch (0.95 - 1.0) so it sounds warm (trầm ấm) instead of squeaky.
  utterance.rate = 0.88; 
  utterance.pitch = 0.98;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  if (onBoundary) {
    utterance.onboundary = onBoundary;
  }

  window.speechSynthesis.speak(utterance);
};
