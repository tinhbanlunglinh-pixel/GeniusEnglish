
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonPlan, ProficiencyLevel, QuizDifficulty, CharacterProfile, AppMode, EnglishLevel, ContentResult, MindMapData, MindMapMode, PresentationScript, PresentationLevel } from "../types";

let ai = new GoogleGenAI({ apiKey: localStorage.getItem('api_key') || process.env.GEMINI_API_KEY });

export const initializeGeminiChat = (key?: string) => {
  const apiKey = key || localStorage.getItem('api_key') || process.env.GEMINI_API_KEY;
  ai = new GoogleGenAI({ apiKey });
};

// --- Schemas ---
const lessonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    level: { type: Type.STRING, enum: ["Starter", "Mover", "Flyer"] },
    vocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          emoji: { type: Type.STRING },
          ipa: { type: Type.STRING },
          meaning: { type: Type.STRING },
          example: { type: Type.STRING },
          sentenceMeaning: { type: Type.STRING },
          type: { type: Type.STRING }
        },
        required: ["word", "ipa", "meaning", "example", "type"]
      }
    },
    grammar: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        explanation: { type: Type.STRING, description: "Giải thích chi tiết bằng tiếng Việt" },
        examples: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["topic", "explanation", "examples"]
    },
    practice: {
      type: Type.OBJECT,
      properties: {
        multipleChoice: {
           type: Type.ARRAY,
           items: {
             type: Type.OBJECT,
             properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
             },
             required: ["id", "question", "options", "correctAnswer", "explanation"]
           }
        },
        scramble: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                 id: { type: Type.STRING },
                 scrambled: { type: Type.ARRAY, items: { type: Type.STRING } },
                 correctSentence: { type: Type.STRING },
                 translation: { type: Type.STRING },
                 explanation: { type: Type.STRING }
              },
              required: ["id", "scrambled", "correctSentence", "translation", "explanation"]
            }
         },
         fillBlank: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                 id: { type: Type.STRING },
                 question: { type: Type.STRING },
                 correctAnswer: { type: Type.STRING },
                 clueEmoji: { type: Type.STRING },
                 explanation: { type: Type.STRING }
              },
              required: ["id", "question", "correctAnswer", "clueEmoji", "explanation"]
            }
         },
         errorIdentification: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                 id: { type: Type.STRING },
                 sentence: { type: Type.STRING },
                 options: { type: Type.ARRAY, items: { type: Type.STRING } },
                 correctOptionIndex: { type: Type.INTEGER },
                 correction: { type: Type.STRING },
                 explanation: { type: Type.STRING }
              },
              required: ["id", "sentence", "options", "correctOptionIndex", "correction", "explanation"]
            }
         }
      },
      required: ["multipleChoice", "scramble", "fillBlank", "errorIdentification"]
    }
  },
  required: ["topic", "level", "vocabulary", "grammar", "practice"]
};

const mindMapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    center: {
      type: Type.OBJECT,
      properties: {
        title_en: { type: Type.STRING },
        title_vi: { type: Type.STRING },
        emoji: { type: Type.STRING }
      },
      required: ["title_en", "title_vi"]
    },
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text_en: { type: Type.STRING },
          text_vi: { type: Type.STRING },
          emoji: { type: Type.STRING },
          color: { type: Type.STRING }
        },
        required: ["text_en", "text_vi"]
      }
    }
  },
  required: ["center", "nodes"]
};

const safeJsonParse = <T>(text: string): T => {
  if (!text) return {} as T;
  let cleanText = text.trim();
  if (cleanText.includes('```')) {
    const parts = cleanText.split('```');
    for (const p of parts) {
      if (p.trim().startsWith('{') || p.trim().startsWith('[')) {
        cleanText = p.replace(/^(json|JSON)/, "").trim();
        break;
      }
    }
  }
  try {
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Error", e);
    throw new Error("AI data error.");
  }
};

export const generateLessonPlan = async (
  topicInput: string,
  level: ProficiencyLevel,
  difficulty: QuizDifficulty = 'Medium',
  images: { data: string, mimeType: string }[] = []
): Promise<LessonPlan> => {
  const promptText = `Expert ESL teacher. Topic: "${topicInput}", Level: "${level}". 
  MANDATORY: Grammar explanation MUST be in VIETNAMESE.
  Create 30 practice questions (8 MCQ, 7 Scramble, 7 FillBlank, 8 ErrorID). Return valid JSON.`;
  
  const parts: any[] = images.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } }));
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: lessonSchema,
      temperature: 0.1
    }
  });

  const data = safeJsonParse<LessonPlan>(response.text || "{}");
  data.level = level;
  data.difficulty = difficulty;
  return data;
};

export const generateMindMap = async (content: string | { data: string, mimeType: string }[], mode: MindMapMode): Promise<MindMapData> => {
  const parts: any[] = [];
  if (Array.isArray(content)) {
    content.forEach(img => parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
  } else {
    parts.push({ text: content });
  }
  parts.push({ text: "Create kids English vocabulary mind map JSON. CRITICAL: Ensure EVERY key concept and detail from the input is represented in a node. Max 12 nodes." });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
    config: { responseMimeType: "application/json", responseSchema: mindMapSchema, temperature: 0.1 }
  });
  return safeJsonParse<MindMapData>(response.text || "{}");
};

export const generatePresentation = async (mindMap: MindMapData, level: PresentationLevel): Promise<PresentationScript> => {
  const topicTitle = mindMap?.center?.title_en || 'Topic';
  const nodes = mindMap.nodes.map(n => n.text_en).join(', ');
  
  const prompt = `Create a professional English presentation script for kids. 
  Topic: ${topicTitle}. Context: ${nodes}. 
  Level: ${level} (aligned with CEFR Pre-A1/A1/A2).
  Structure:
  - Introduction: Warm greeting and topic introduction.
  - Body: Use the mindmap nodes to build meaningful sentences.
  - Conclusion: Closing statement.
  INCLUDE Vietnamese translation for each part. 
  Format: JSON { introduction: {english, vietnamese}, body: [{emoji, keyword, script, vietnamese}], conclusion: {english, vietnamese} }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: { responseMimeType: "application/json", temperature: 0.2 }
  });
  return safeJsonParse<PresentationScript>(response.text || "{}");
};

export const generateMindMapPrompt = async (content: string | { data: string, mimeType: string }[], mode: MindMapMode): Promise<string> => {
  const parts: any[] = [];
  if (Array.isArray(content)) {
    content.forEach(img => parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
  } else {
    parts.push({ text: content });
  }
  
  parts.push({ text: `Analyze this content and generate ONE MASTER MIDJOURNEY PROMPT for a high-quality educational mindmap following the TONY BUZAN style.
  
  STYLE INSTRUCTIONS (Mandatory):
  1. CENTRAL IMAGE: A vibrant, detailed 3D focal point representing the main topic.
  2. ORGANIC BRANCHES: Slim, elegant, curved flowing branches radiating from the center. NOT THICK.
  3. COMPREHENSIVENESS: Ensure ALL key concepts, vocabulary, and details from the provided input are explicitly included as branches or sub-branches.
  4. COLOR CODING: Each main branch has its own distinct bright color.
  5. VISUALS: Include 3D characters, specific icons, and clean typography.
  6. LIGHTING: Volumetric soft lighting, rays of sun, Pixar-style animation render.
  7. BACKGROUND: Clean, soft gradient sky.
  
  OUTPUT: ONLY the prompt string starting with "/imagine prompt:"` 
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: { temperature: 0.7 }
  });
  return response.text || "";
};

export const analyzeImageAndCreateContent = async (
  base64Images: string[],
  mimeType: string,
  character: CharacterProfile,
  mode: AppMode,
  level: EnglishLevel,
  customPrompt: string,
  customTopic?: string,
  customText?: string
): Promise<ContentResult> => {
  const parts: any[] = base64Images.map(img => ({ inlineData: { mimeType: mimeType || "image/jpeg", data: img } }));
  
  const promptText = `Kid English story. Hero: ${character.name}. Level: ${level}. 
  Mode: ${mode}.
  ${customTopic ? `Topic: ${customTopic}.` : ''}
  ${customText ? `Context/Text to analyze: ${customText}.` : ''}
  ${customPrompt ? `Additional Instructions: ${customPrompt}.` : ''}
  
  REQUIREMENT: 
  - Generate EXACTLY 10 multiple-choice reading comprehension questions (readingQuiz).
  - Generate EXACTLY 10 speaking practice question-answer pairs (qaPairs).
  
  Generate JSON: {
    "originalText": "summary of content",
    "translatedText": "Vietnamese translation",
    "storyEnglish": "English story (100 words)",
    "vocabulary": [{"word": "...", "emoji": "...", "ipa": "...", "meaning": "...", "example": "...", "sentenceMeaning": "...", "type": "..."}],
    "readingQuiz": [{"question": "...", "options": [], "correctAnswerIndex": 0, "explanation": "..."}],
    "qaPairs": [{"question": "...", "answer": "..."}],
    "imagePrompt": "Image description"
  }`;

  parts.push({ text: promptText });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
    config: { responseMimeType: "application/json", temperature: 0.1 }
  });
  return safeJsonParse<ContentResult>(response.text || "{}");
};

export const generateStoryImage = async (prompt: string, style: string, aspectRatio: string = "1:1"): Promise<string> => {
  const finalPrompt = `children book illustration, ${prompt}, ${style}`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: finalPrompt }] },
    config: { imageConfig: { aspectRatio: aspectRatio as any } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
};

export const generateAudioFromContent = async (content: ContentResult): Promise<string | null> => null;
