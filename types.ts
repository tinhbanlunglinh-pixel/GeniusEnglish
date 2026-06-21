
export type ProficiencyLevel = 'Starter' | 'Mover' | 'Flyer';
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface VocabularyItem {
  word: string;
  emoji: string;
  ipa: string;
  meaning: string;
  example: string;
  sentenceMeaning: string;
  type: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface FillBlankQuestion {
  id: string;
  sentence: string; // Contains "___"
  answer: string;
  options: string[];
}

export interface GrammarSection {
  topic: string;
  explanation: string;
  examples: string[];
}

export interface QAPair {
  question: string;
  answer: string;
}

export interface ReadingMCQ {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

// --- New Practice Types ---

export interface MultipleChoiceQ {
  id: string;
  question: string;
  options: string[]; // A, B, C
  correctAnswer: number; // index
  explanation: string;
}

export interface ScrambleQ {
  id: string;
  scrambled: string[]; // ["is", "name", "My", "John"]
  correctSentence: string; // "My name is John"
  translation: string;
  explanation: string;
}

export interface FillInputQ {
  id: string;
  question: string; // "I ___ to school."
  correctAnswer: string; 
  clueEmoji?: string; // New: Emoji hint for the answer
  explanation: string;
}

export interface ErrorIdQ {
  id: string;
  sentence: string; // "She (A) go to school yesterday."
  options: string[]; // ["(A) go", "(B) to", "(C) school"]
  correctOptionIndex: number;
  correction: string; // "went"
  explanation: string;
}

export interface PracticeContent {
  multipleChoice: MultipleChoiceQ[];
  scramble: ScrambleQ[];
  fillBlank: FillInputQ[];
  errorIdentification: ErrorIdQ[];
}

export interface LessonPlan {
  topic: string;
  level: ProficiencyLevel;
  difficulty?: QuizDifficulty;
  vocabulary: VocabularyItem[];
  activities: {
    matching: MatchingPair[];
    flashcards: VocabularyItem[];
    fillInBlank: FillBlankQuestion[];
  };
  grammar: GrammarSection;
  practice: PracticeContent; // Replaces finalQuiz
}

// --- Magic Story Types ---

export enum AppMode {
  ANALYSIS = 'analysis',
  CREATIVE = 'creative'
}

export enum EnglishLevel {
  STARTER = 'Starter (A1)',
  MOVER = 'Mover (A2)',
  FLYER = 'Flyer (B1)'
}

export type ImageRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export enum LoadingStep {
  IDLE = '',
  ANALYZING = 'Reading your pages...',
  GENERATING_IMAGE = 'Painting the scene...',
  GENERATING_AUDIO = 'Recording voiceover...',
  COMPLETED = 'Magic Finished!'
}

export interface CharacterProfile {
  id: string;
  name: string;
  emoji: string;
  promptContext: string;
  stylePrompt: string;
  colorClass: string;
}

export interface ContentResult {
  originalText: string;
  translatedText: string;
  storyEnglish: string;
  vocabulary: VocabularyItem[];
  activities: {
    matching: MatchingPair[];
    fillInBlank: FillBlankQuestion[];
  };
  readingQuiz: ReadingMCQ[];
  qaPairs: QAPair[];
  imagePrompt: string;
}

export interface AppState {
  selectedCharacter: CharacterProfile;
  selectedLevel: EnglishLevel;
  selectedMode: AppMode;
  selectedRatio: ImageRatio;
  customTopic: string;
  customText: string;
  customPrompt: string;
  originalImages: string[];
  generatedImage: string | null;
  audioUrl: string | null;
  contentResult: ContentResult | null;
  isLoading: boolean;
  loadingStep: LoadingStep;
  error: string | null;
}

// --- Mind Map Types ---

export enum MindMapMode {
  TOPIC = 'TOPIC',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export interface MindMapData {
  center: {
    title_en: string;
    title_vi: string;
    emoji?: string; 
  };
  nodes: Array<{
    text_en: string;
    text_vi: string;
    emoji?: string;
    color?: string;
  }>;
  style?: {
    background: string;
    lineStyle?: string;
    overallLook?: string;
  };
}

// --- Presentation Types ---

export type PresentationLevel = 'Very Basic' | 'Basic' | 'Intermediate' | 'Advanced';

export interface PresentationScript {
  level: PresentationLevel;
  introduction: {
    english: string;
    vietnamese: string;
  };
  body: Array<{
    emoji: string;
    keyword: string;
    script: string; 
    vietnamese: string; 
  }>;
  conclusion: {
    english: string;
    vietnamese: string;
  };
}
