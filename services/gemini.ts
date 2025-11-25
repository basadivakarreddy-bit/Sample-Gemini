import { GoogleGenAI, Chat, Part } from "@google/genai";
import { Attachment } from "../types";

// Inject the user-provided API key
// Ensure process object exists for the library to access process.env.API_KEY if needed, 
// or simply to satisfy our own assignment below.
if (typeof process === "undefined") {
  (window as any).process = { env: {} };
}
// @ts-ignore
process.env.API_KEY = "AIzaSyBv---AubhDPsziUzAtTAUWjhBbl8ex1hQ";

// We maintain a reference to the active chat session
let chatSession: Chat | null = null;

const MODEL_NAME = 'gemini-2.5-flash';

export const initializeChat = () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatSession = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: "You are a helpful, intelligent, and precise AI assistant. You answer questions clearly using Markdown formatting where appropriate. You can analyze images if provided.",
    },
  });
  return chatSession;
};

export const sendMessageStream = async (
  text: string,
  attachments: Attachment[] = []
) => {
  // If no session exists, initialize one.
  if (!chatSession) {
    initializeChat();
  }

  // Construct the message payload
  let messagePayload: string | Part[] = text;

  if (attachments.length > 0) {
    messagePayload = [
      { text },
      ...attachments.map(att => ({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      }))
    ];
  }

  // Check again in case initialization failed
  if (!chatSession) {
      throw new Error("Failed to initialize chat session.");
  }

  try {
    const result = await chatSession.sendMessageStream({
      message: messagePayload
    });
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};