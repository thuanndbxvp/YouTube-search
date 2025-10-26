
export async function generateVideoSummary(title: string, apiKey: string, model: string): Promise<string> {
    if (!apiKey) {
      throw new Error("API Key của OpenAI không được cung cấp.");
    }
  
    const API_URL = "https://api.openai.com/v1/chat/completions";
  
    try {
      const prompt = `Bạn là một chuyên gia phân tích nội dung YouTube. Hãy viết một kịch bản tóm tắt ngắn gọn, hấp dẫn (khoảng 3-4 câu) cho một video có tiêu đề sau: "${title}". Hãy tập trung vào những điểm chính mà video có thể đề cập, dựa trên tiêu đề.`;
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }
  
      return data.choices[0]?.message?.content?.trim() || "Không nhận được phản hồi hợp lệ từ API.";
    } catch (error) {
      console.error("Error generating summary with OpenAI:", error);
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      throw new Error(`Lỗi OpenAI API: ${errorMessage}`);
    }
  }
