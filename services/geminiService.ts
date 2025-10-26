import { GoogleGenAI } from "@google/genai";

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