import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL_NAME });

export type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

type CacheEntry = {
  result: string;
  timestamp: number;
};

// In-memory cache for generateInsight
const insightCache = new Map<string, CacheEntry>();
const INSIGHT_TTL_MS = 15 * 60 * 1000;

/**
 * Generates an actionable business insight from summary data and a user question.
 * Uses a simple in-memory cache with a 15-minute TTL.
 *
 * @param summaryData The context data of the business to provide to Gemini
 * @param userQuestion The question asked by the user
 * @param shopId The store ID to namespace the cache key
 * @returns A string containing the AI response in casual Indonesian
 */
export async function generateInsight(summaryData: object, userQuestion: string, shopId: string): Promise<string> {
  const cacheKey = `${shopId}:${userQuestion}:${JSON.stringify(summaryData)}`;
  const cached = insightCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < INSIGHT_TTL_MS) {
    return cached.result;
  }

  const prompt = `
Kau adalah asisten bisnis AI untuk SmartPOS. Jawab pertanyaan user pakai bahasa Indonesia gaya Medan yang santai, akrab, tapi tetap paten dan profesional.

Aturan main kau:

Gak usah kaku kali: Pakai istilah Medan sikit (kayak: paten, kali, bah, cemana, awak, sikit, gaspol) biar makin akrab, tapi tetap sopan.

Actionable: Kasih saran yang masuk akal, jangan cuma teori kosong. Kasih tau apa yang harus dibuat owner.

Singkat & Padat: Maksimal 3 paragraf. Langsung ke intinya, gak usah bertele-tele kau.

Data-Driven: Wajib kau tengok dan sebutkan angka faktual dari summaryData. Jangan kau karang-karang jawaban, harus sesuai fakta yang ada di dashboard toko!

Data Ringkasan Toko:
${JSON.stringify(summaryData, null, 2)}

Pertanyaan User:
${userQuestion}
  `.trim();

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  insightCache.set(cacheKey, { result: response, timestamp: Date.now() });

  // Simple cache cleanup logic to prevent unbounded growth
  if (insightCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of insightCache.entries()) {
      if (now - value.timestamp > INSIGHT_TTL_MS) {
        insightCache.delete(key);
      }
    }
  }

  return response;
}

/**
 * Generates a response for a multi-turn chat conversation.
 *
 * @param messages Array of ChatMessage containing the conversation history
 * @param context Business context data to ground the AI's response
 * @returns The AI's response text
 */
export async function generateChatResponse(messages: ChatMessage[], context: object): Promise<string> {
  if (messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

const systemPrompt = `
Kau adalah asisten bisnis AI paling paten untuk SmartPOS. 
Tugas kau menjawab pertanyaan user pakai bahasa Indonesia gaya Medan yang santai, akrab, tapi tetap profesional dan solutif.

Aturan main kau:
1. Gak usah kaku kali: Pakai istilah Medan sikit (kayak: paten, kali, bah, cemana, awak, sikit, gaspol) biar makin akrab, tapi jangan sampai gak sopan.
2. Actionable: Kasih saran yang masuk akal dan bisa langsung dibuat owner, bukan cuma teori kosong.
3. Singkat & Padat: Maksimal 3 paragraf. Langsung ke inti masalahnya, gak usah bertele-tele kau.
4. Data-Driven: Wajib kau tengok dan sebutkan angka faktual dari konteks bisnis yang dikasih. Jangan kau karang-karang jawaban, harus sesuai fakta di lapangan!

Berikut adalah konteks bisnis saat ini:
${JSON.stringify(context, null, 2)}

Gunakan konteks ini untuk menjawab pertanyaan atau memberi saran jika relevan.
`.trim();

  // Extract all messages except the last one to use as history
  const historyMessages = messages.slice(0, -1);
  const formattedHistory = historyMessages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Baik, saya siap membantu. Silakan.' }] },
      ...formattedHistory,
    ],
  });

  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}
