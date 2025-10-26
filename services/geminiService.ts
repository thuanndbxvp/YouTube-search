import { GoogleGenAI, Content } from "@google/genai";
import type { ChatMessage } from '../types';

export async function generateVideoSummary(title: string, apiKey: string, model: string): Promise<string> {
  if (!apiKey) {
    throw new Error("API Key của Gemini không được cung cấp.");
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Bạn là một chuyên gia phân tích nội dung YouTube. Hãy viết một kịch bản tóm tắt ngắn gọn, hấp dẫn (khoảng 3-4 câu) cho một video có tiêu đề sau: "${title}". Hãy tập trung vào những điểm chính mà video có thể đề cập, dựa trên tiêu đề.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    // Attempt to parse a more specific error message from the response
    const apiError = error as any;
    if (apiError.message) {
       throw new Error(`Lỗi Gemini API: ${apiError.message}`);
    }
    throw new Error("Không thể tạo tóm tắt từ Gemini API.");
  }
}

export async function generateChatResponse(history: ChatMessage[], apiKey: string, model: string): Promise<string> {
    if (!apiKey) {
      throw new Error("API Key của Gemini không được cung cấp.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Convert our ChatMessage[] to Gemini's Content[] format for multi-turn conversation
        const contents: Content[] = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
        });

        const text = response.text;
        
        if (!text) {
            const finishReason = response.candidates?.[0]?.finishReason;
            const safetyRatings = response.candidates?.[0]?.safetyRatings;
            console.warn("Gemini response was empty.", { finishReason, safetyRatings });

            if (finishReason === 'SAFETY') {
                return "Phản hồi đã bị chặn vì lý do an toàn. Vui lòng thử một câu hỏi khác hoặc điều chỉnh cài đặt an toàn nếu có thể.";
            }
            return `Không nhận được phản hồi văn bản từ Gemini. Lý do: ${finishReason || "Không rõ"}. Vui lòng kiểm tra lại prompt hoặc thử lại sau.`;
        }
        
        return text;

    } catch (error) {
        console.error("Error generating chat response with Gemini:", error);
        const apiError = error as any;
        if (apiError.message) {
           throw new Error(`Lỗi Gemini API: ${apiError.message}`);
        }
        throw new Error("Không thể tạo phản hồi chat từ Gemini API.");
    }
}