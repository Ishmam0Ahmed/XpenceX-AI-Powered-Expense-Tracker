import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  const prompt = `
    You are XpenceX Assistant, a smart expense tracker.
    User input: "${input}"
    Available categories: ${categories.join(', ')}
    Current Date: ${new Date().toISOString()}

    Tasks:
    1. Detect if the user wants to record an expense or just chat/ask for advice.
    2. If it's an expense:
       - Correct any misheard words (e.g., "speed" -> "spent", "fod" -> "food").
       - Extract: title, amount (number), category (must match one of the available categories or be "Other"), date (ISO string).
       - If the category doesn't strictly match, try fuzzy matching to available categories.
       - If it's a completely new category not in the list, set category to "INVALID".
    3. If it's a chat:
       - Provide helpful financial advice or answer questions in the user's language (Bangla, English, or Mixed).

    Return ONLY a JSON object:
    {
      "type": "chat" | "expense",
      "content": "Your response to the user",
      "expense": { "title": "...", "amount": 0, "category": "...", "date": "...", "notes": "..." } // Only if type is expense
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Clean up markdown code blocks if present
    const cleanJson = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { type: 'chat', content: "I'm sorry, I couldn't process that. Please try again." };
  }
}

export async function processAudioInput(audioData: string, mimeType: string, categories: string[]): Promise<{
  type: 'chat' | 'expense';
  content: string;
  expense?: ExtractedExpense;
}> {
  const prompt = `
    You are XpenceX Assistant, a smart expense tracker.
    The user has provided an audio message.
    Available categories: ${categories.join(', ')}
    Current Date: ${new Date().toISOString()}

    Tasks:
    1. Listen to the audio. It might be in Bangla, English, or Mixed (Hinglish/Banglish).
    2. Understand the intent.
    3. If the user wants to record an expense:
       - Extract: title (translate to English), amount (number), category (must match one of the available categories or be "Other"), date (ISO string).
       - If the category doesn't strictly match, try fuzzy matching to available categories.
       - If it's a completely new category not in the list, set category to "INVALID".
    4. If it's a chat:
       - Provide helpful financial advice or answer questions in the user's language (Bangla, English, or Mixed).

    Return ONLY a JSON object:
    {
      "type": "chat" | "expense",
      "content": "Your response to the user (in their language)",
      "expense": { "title": "...", "amount": 0, "category": "...", "date": "...", "notes": "..." } // Only if type is expense
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: audioData.split(',')[1] || audioData,
          mimeType: mimeType
        }
      }
    ]);
    const response = result.response.text();
    const cleanJson = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Audio Error:", error);
    return { type: 'chat', content: "I'm sorry, I couldn't understand the audio. Please try again." };
  }
}

export async function scanReceipt(imageData: string, categories: string[]): Promise<ExtractedExpense | null> {
  const prompt = `
    Analyze this receipt image. Extract:
    - Title (Store name or item)
    - Amount (Total amount as a number)
    - Date (ISO string if found, otherwise today's date)
    - Category (Best match from: ${categories.join(', ')})

    Return ONLY a JSON object:
    { "title": "...", "amount": 0, "category": "...", "date": "...", "notes": "..." }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: "image/jpeg"
        }
      }
    ]);
    const response = result.response.text();
    const cleanJson = response.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Receipt Scan Error:", error);
    return null;
  }
}
