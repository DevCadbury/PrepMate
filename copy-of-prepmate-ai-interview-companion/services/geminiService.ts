
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import type { Message } from '../types';

let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
        console.error("API_KEY is not set in environment variables. Please set it and refresh the page.");
        throw new Error("API_KEY is not set in environment variables.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const createInterviewChat = (userName: string, jobRole: string): Chat => {
  const aiInstance = getAI();
  const systemInstruction = `You are an expert interviewer named PrepMate, conducting an interview for a ${jobRole} position with a candidate named ${userName}.
Your tone is professional, encouraging, and warm. Use professional Indian English phrasing where appropriate (e.g., "Kindly explain..."), but keep the language clear.

The user's first response will be their self-introduction. Your primary task is to ask relevant follow-up questions based on the details they provide in their introduction and subsequent answers.
Also, mix in general behavioral and technical questions suitable for a ${jobRole} candidate. This ensures a comprehensive and realistic interview.

Key instructions:
1. Ask only one question at a time.
2. After the user answers, provide brief, constructive feedback in 1-2 sentences.
3. Immediately after the feedback, ask your next question in the same response.
4. Keep the interview flowing and conversational.`;

  return aiInstance.chats.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction,
    }
  });
};

export const getNextChatResponse = async (chat: Chat, message: string): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error getting next chat response:", error);
        return "I'm sorry, I encountered an error. Could you please repeat your answer?";
    }
};

export const analyzeSentiment = async (text: string): Promise<{ score: number; label: 'Positive' | 'Neutral' | 'Negative' }> => {
    if (!text.trim()) {
        return { score: 0, label: 'Neutral' };
    }
    const aiInstance = getAI();
    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the sentiment of the following text. Is it Positive, Neutral, or Negative? Provide a confidence score from -1.0 (very negative) to 1.0 (very positive).
Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentiment_label: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
                        confidence_score: { type: Type.NUMBER }
                    },
                    required: ["sentiment_label", "confidence_score"],
                }
            }
        });
        const jsonResponse = JSON.parse(response.text);
        return {
            score: jsonResponse.confidence_score,
            label: jsonResponse.sentiment_label
        };
    } catch (error) {
        console.error("Error analyzing sentiment:", error);
        return { score: 0, label: 'Neutral' };
    }
};

export const getInterviewSummary = async (userName: string, conversation: Message[]): Promise<string> => {
    const aiInstance = getAI();
    const transcript = conversation.map(msg => `${msg.author === 'user' ? userName : 'Interviewer'}: ${msg.text}`).join('\n');
    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please provide a comprehensive summary and constructive feedback for the following interview transcript with the applicant, ${userName}.
Focus on ${userName}'s performance, highlighting strengths and areas for improvement regarding clarity, confidence, and substance of answers. Address the feedback to ${userName} directly in the second person (e.g., "You did a great job...").
Format the output using markdown, including headings and bullet points.

Transcript:
---
${transcript}
---`,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting interview summary:", error);
        return "Could not generate a summary for this interview.";
    }
};
