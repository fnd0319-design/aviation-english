import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
let apiKey = localStorage.getItem("gemini_api_key");

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

export function setApiKey(key: string) {
    localStorage.setItem("gemini_api_key", key);
    apiKey = key;
    genAI = new GoogleGenerativeAI(key);
}

export function getApiKey() {
    return apiKey;
}

// ----------------------------------------------------
// AELP 評価基準 & システム指示
// ----------------------------------------------------
const SYSTEM_INSTRUCTION = `You are a professional and friendly native American female Aviation English examiner.
Your tone is encouraging and warm.

You are facilitating a practice session for the Aviation English Language Proficiency (AELP) test.
You must adhere to the following rules:

1. LEVEL SETTING & ADAPTABILITY:
   - Level 3 (Entry): Speak VERY slowly. Ask extremely simple questions using elementary school/early middle school vocabulary (e.g. "Where is the airplane?", "Is the pilot okay?"). Avoid complex terminology.
   - Level 4 (Operational): Speak slightly slowly. Use standard operational aviation language. Apply normal Level 4 test standards.
   - Level 5 (Native): Speak at native speed. Use advanced and strict phrasing.
   - Real-time Adaptation: If the candidate answers fluently, dynamically make your next question slightly more advanced. If they struggle or hesitate heavily, simplify your vocabulary and sentences.

2. FREE TALK & JAPANESE INTERRUPTIONS:
   - The candidate might speak in Japanese to ask a question (e.g., "Pardon?", "日本語でもう一度言っていいですか？", "今の文法合ってますか？").
   - If they speak Japanese, you must immediately transition to "advisor mode", answer them warmly and politely in Japanese, and then immediately prompt them to return to the English test (e.g., "では、試験に戻りましょう。").
   - During active test questions, keep your prompts in English, but evaluations/advice must be in Japanese.

3. FILLER WARNING:
   - AELP Fluency grading requires minimal fillers. If the candidate uses "uh", "um", "er", or "hmm", you must note it. Your final feedback must include a friendly warning: "これらはなるべく減らしてください" (Please reduce these fillers).

4. SPEECH TONE EVALUATION:
   - Evaluate the candidate's communication attitude into one of: 'Confident' (bold/smooth), 'Hesitant' (nervous/stuck), 'Clear' (articulate), or 'Anxious' (panicked).

5. PARAPHRASING & DIFICULT WORDS:
   - Suggest 3 levels of improved phrasing: Standard (operational), Advanced (Level 5 level), Concise (simple and safe).
   - Dynamically identify any difficult words (high school level or advanced aviation terms) in your feedback, and provide their Japanese meaning.
   
6. OUTPUT FORMAT:
   - You must respond in a structured JSON format to update the UI correctly.`;

// ----------------------------------------------------
// APIレスポンス構造定義
// ----------------------------------------------------
export interface ChatResponse {
  reply: string;              // Voice synthesis & display text (AELP evaluation in Japanese, questions in English)
  speechTone?: 'Confident' | 'Hesitant' | 'Clear' | 'Anxious';
  gradingScores?: {
    pronunciation: number;
    structure: number;
    vocabulary: number;
    fluency: number;
    comprehension: number;
    interactions: number;
  };
  improvedExpressions?: {
    standard: string;
    advanced: string;
    concise: string;
  };
  difficultWords?: {
    word: string;
    meaning: string;
  }[];
  isFillerWarned?: boolean;
}

export interface ReviewQuestion {
  japanese: string;   // For review drills
  english: string;    // Expected correct English
  grammarTag: string;  // e.g. 【仮定法】
}

export interface ReviewReply {
  isCorrect: boolean;
  reply: string;      // Feedback text (in Japanese) or free talk response
}

// ----------------------------------------------------
// API 呼び出し本体
// ----------------------------------------------------
async function getModelWithSchema(responseSchema: Schema) {
  if (!genAI) throw new Error("API key not set");
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.4
    }
  });
}

// ----------------------------------------------------
// 1. 試験用の対話/評価API
// ----------------------------------------------------
export async function chatWithExaminer(
  history: {role: 'ai' | 'user', text: string}[],
  currentInput: string,
  testMode: string,
  level: string,
  phaseState: string,
  extraData?: string // sampleAnswers or scenario info
): Promise<ChatResponse> {
  const schema: Schema = {
    type: "object" as any,
    properties: {
      reply: { type: "string" as any, description: "AI's spoken response. Must be in English for questions, Japanese for advice/explanations, or Japanese when answering user's Japanese questions." },
      speechTone: { type: "string" as any, enum: ['Confident', 'Hesitant', 'Clear', 'Anxious'], description: "Candidate's speech tone evaluation. Only provide this during evaluation steps." },
      gradingScores: {
        type: "object" as any,
        properties: {
          pronunciation: { type: "integer" as any, description: "Score from 1 to 6. AELP rating standard." },
          structure: { type: "integer" as any, description: "Score from 1 to 6. AELP rating standard." },
          vocabulary: { type: "integer" as any, description: "Score from 1 to 6. AELP rating standard." },
          fluency: { type: "integer" as any, description: "Score from 1 to 6. AELP rating standard." },
          comprehension: { type: "integer" as any, description: "Score from 1 to 6. AELP rating standard." },
          interactions: { type: "integer" as any, description: "Score from 1 to 6. AELP rating standard." }
        },
        description: "AELP 6 grading criteria scores. Only provide this during final evaluation/feedback steps."
      },
      improvedExpressions: {
        type: "object" as any,
        properties: {
          standard: { type: "string" as any, description: "Standard operational phrasing." },
          advanced: { type: "string" as any, description: "Advanced Level 5 level phrasing." },
          concise: { type: "string" as any, description: "Simple and safe phrasing." }
        },
        description: "Three paraphrasing examples of candidate's last answer. Only provide during evaluation steps."
      },
      difficultWords: {
        type: "array" as any,
        items: {
          type: "object" as any,
          properties: {
            word: { type: "string" as any, description: "Advanced vocabulary word used in reply." },
            meaning: { type: "string" as any, description: "Japanese meaning of the word." }
          }
        },
        description: "Difficult words (high school level or professional terms) used in AI's reply/advice."
      },
      isFillerWarned: { type: "boolean" as any, description: "True if user used fillers (uh, um, er, hmm) and AI includes a warning 'これらはなるべく減らしてください' in the reply." }
    },
    required: ["reply"]
  };

  const model = await getModelWithSchema(schema);
  const formattedHistory = history.map(h => `${h.role === 'ai' ? 'Examiner' : 'Candidate'}: ${h.text}`).join('\n');

  const prompt = `
  AELP Test Mode: ${testMode}
  Level Setting: ${level} (Apply speed and vocabulary rules for Level 3/4/5)
  Current Phase State: ${phaseState} (e.g., 'p1_record' (describing image), 'p2_record' (answering follow-up), 'p3_record' (experience), 'done')
  Additional Reference Data (Sample answers / scenario): ${extraData}

  Conversation History:
  ${formattedHistory}

  Candidate's Current Input: "${currentInput}"

  Evaluate the Candidate's Input:
  - If they spoke in Japanese (or phonetic mis-transcription of Japanese like "chotto matte", "sumimasen"), transition to free talk advisor mode. Explain in Japanese, and then prompt to return to the test.
  - If they are describing the picture (p1_record), evaluate their grammar, cohesion, and vocabulary. Give an evaluation in Japanese.
  - If they are answering a question (p2_record / p3_record), evaluate their answer based on the AELP Level 4/3 boundary.
  - Check for fillers (uh, um, er, hmm) in current input. If found, trigger the filler warning and append "これらはなるべく減らしてください" to the reply text.
  - Always suggest 3 levels of improved expressions and tones during evaluation.
  - Extract any difficult words from your reply and explain them.
  `;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  return JSON.parse(jsonText) as ChatResponse;
}

// ----------------------------------------------------
// 2. 弱点復習ドリルの問題抽出API
// ----------------------------------------------------
export async function generateReviewQuestions(
  history: {role: 'ai' | 'user', text: string}[]
): Promise<ReviewQuestion[]> {
  const schema: Schema = {
    type: "array" as any,
    items: {
      type: "object" as any,
      properties: {
        japanese: { type: "string" as any, description: "Japanese translation of the sentence the candidate failed to express correctly." },
        english: { type: "string" as any, description: "Correct English translation they should practice." },
        grammarTag: { type: "string" as any, description: "Grammar category tag like 【仮定法】, 【原因・理由】, 【義務・指示】, etc." }
      },
      required: ["japanese", "english", "grammarTag"]
    }
  };

  const model = await getModelWithSchema(schema);
  const formattedHistory = history.map(h => `${h.role === 'ai' ? 'Examiner' : 'Candidate'}: ${h.text}`).join('\n');

  const prompt = `
  Analyze the following practice session history. Identify sentences that the Candidate struggled to say, made grammatical/lexical mistakes on, or received corrections from the Examiner.
  
  Extract a maximum of 5 distinct sentences.
  For each sentence:
  1. Create a natural Japanese translation.
  2. Provide the corrected/optimal target English expression that they should learn.
  3. Assign an appropriate grammar tag (e.g. 【仮定法】, 【原因説明】, 【義務・要請】).

  If there are no mistakes (the candidate answered perfectly), return an empty array.

  History:
  ${formattedHistory}
  `;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  return JSON.parse(jsonText) as ReviewQuestion[];
}

// ----------------------------------------------------
// 3. 復習ドリル中の解答判定＆フリートークAPI
// ----------------------------------------------------
export async function evaluateReviewAnswer(
  userAnswer: string,
  expectedEnglish: string,
  japaneseQuestion: string
): Promise<ReviewReply> {
  const schema: Schema = {
    type: "object" as any,
    properties: {
      isCorrect: { type: "boolean" as any, description: "True if user's translation is grammatically correct and carries the same meaning. Give a lenient evaluation (lenient on exact words as long as meaning is correct)." },
      reply: { type: "string" as any, description: "AI's response in Japanese. If correct, congratulate them. If wrong, give feedback. If they asked a free talk question (e.g., 'What is the answer?', 'Pardon?', '教えて'), reply to their question in Japanese and help them." }
    },
    required: ["isCorrect", "reply"]
  };

  const model = await getModelWithSchema(schema);

  const prompt = `
  The candidate is doing a review drill.
  The target Japanese meaning is: "${japaneseQuestion}"
  The expected English is: "${expectedEnglish}"
  The candidate's spoken translation is: "${userAnswer}"

  Task:
  - If the candidate says something like "I forgot", "What is the answer?", "Help", or "Pardon?", set isCorrect to false and answer their question kindly in Japanese (free talk).
  - If they attempted the translation, compare it with the expected English. Be lenient: if the meaning is correct and it is grammatically sound, set isCorrect to true.
  - Respond in Japanese.
  `;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  return JSON.parse(jsonText) as ReviewReply;
}
