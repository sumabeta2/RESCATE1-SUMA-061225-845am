import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role, ModelType, Attachment } from "../types";

// Helper to convert internal Message to Google GenAI ContentPart format
const convertMessageToContentPart = (message: Message) => {
  const parts: any[] = [];
  if (message.attachments && message.attachments.length > 0) {
    message.attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }
  parts.push({ text: message.text });
  return { role: message.role, parts: parts };
};

/**
 * Sends a message to the Gemini model and streams the response.
 */
export const streamChatResponse = async (
  history: Message[],
  newMessage: string,
  attachments: Attachment[],
  model: ModelType = ModelType.FLASH,
  onChunk: (text: string) => void,
  systemInstruction?: string // Make systemInstruction optional
): Promise<string> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); // Initialize here as per guidelines.

  // Prepare contents array for generateContentStream, including historical messages
  const contents: any[] = history.map(convertMessageToContentPart);

  // Prepare current user message parts (text + attachments)
  const currentMessageParts: any[] = [];
  if (attachments.length > 0) {
    attachments.forEach(att => {
      currentMessageParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }
  currentMessageParts.push({ text: newMessage });
  contents.push({ role: Role.USER, parts: currentMessageParts });

  let fullResponseText = '';
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction, // Use the passed-in system instruction
      },
    });

    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        onChunk(c.text);
        fullResponseText += c.text;
      }
    }
  } catch (error) {
    console.error("Error streaming chat response:", error);
    throw error;
  }
  
  return fullResponseText;
};