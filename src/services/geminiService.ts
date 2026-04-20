import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = "gemini-3-flash-preview";

export interface ExtractedExpense {
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export async function processInput(input: string, categories: string[]): Promise<{
  type: 'chat' | 'expense';
  content: string;
  expense?: ExtractedExpense;
}> {
  const systemInstruction = `
    You are XpenceX Assistant, a smart expense tracker.
    Current Date: ${new Date().toISOString()}
    Available categories: ${categories.join(', ')}

    Tasks:
    1. Detect if the user wants to record an expense or just chat/ask for advice.
    2. If it's an expense:
       - Correct any misheard words (e.g., "speed" -> "spent", "fod" -> "food").
       - Extract: title, amount (number), category (must match one of the available categories or be "Other"), date (ISO string).
       - If the category doesn't strictly match, try fuzzy matching to available categories.
       - If it's a completely new category not in the list, set category to "INVALID".
    3. If it's a chat:
       - Provide helpful financial advice or answer questions in the user's language (Bangla, English, or Mixed).

    Return JSON structure:
    {
      "type": "chat" | "expense",
      "content": "Your response to the user",
      "expense": { "title": "...", "amount": 0, "category": "...", "date": "...", "notes": "..." } 
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ parts: [{ text: input }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");
    return JSON.parse(responseText);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return { type: 'chat', content: "AI monthly/minute quota reached. Please wait a moment before trying again." };
    }
    return { type: 'chat', content: "I'm sorry, I couldn't process that. Please try again." };
  }
}

export async function processAudioInput(audioData: string, mimeType: string, categories: string[]): Promise<{
  type: 'chat' | 'expense';
  content: string;
  expense?: ExtractedExpense;
}> {
  const systemInstruction = `
    You are XpenceX Assistant, a smart expense tracker.
    The user has provided an audio message.
    Available categories: ${categories.join(', ')}
    Current Date: ${new Date().toISOString()}

    Tasks:
    1. Listen to the audio. It might be in Bangla, English, or Mixed.
    2. Understand the intent.
    3. If it's an expense:
       - Extract: title (translate to English), amount (number), category (must match one of the available categories or be "Other"), date (ISO string).
    4. If it's a chat:
       - Provide helpful financial advice.

    Return JSON structure:
    {
      "type": "chat" | "expense",
      "content": "Your response to the user (in their language)",
      "expense": { "title": "...", "amount": 0, "category": "...", "date": "...", "notes": "..." }
    }
  `;

  try {
    // Extract base64 data from DataURL if needed
    const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;

    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          parts: [
            { text: "Process this audio message." },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");
    return JSON.parse(responseText);
  } catch (error: any) {
    console.error("Gemini Audio Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return { type: 'chat', content: "AI audio processing quota reached. Please wait a moment." };
    }
    return { type: 'chat', content: "I'm sorry, I couldn't understand the audio. Please try again." };
  }
}

export async function scanReceipt(imageData: string, categories: string[]): Promise<ExtractedExpense & { confidence?: number } | null> {
  const systemInstruction = `
    Analyze this image (receipt, memo, or handwritten note).
    Tasks:
    1. Extract Store/Title, Amount (numeric), Date (ISO), Category (match from: ${categories.join(', ')}).
    2. Add a note if it was handwritten.

    Return JSON structure:
    { 
      "title": "...", 
      "amount": 0, 
      "category": "...", 
      "date": "...", 
      "notes": "...",
      "confidence": 0.0-1.0
    }
  `;

  try {
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          parts: [
            { text: "Analyze this receipt." },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI");
    return JSON.parse(responseText);
  } catch (error: any) {
    console.error("Receipt Scan Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      alert("AI scan quota reached. Please wait a moment.");
    }
    return null;
  }
}
