import { GoogleGenAI } from "@google/genai";

export async function validateYoutubeApiKey(key: string): Promise<boolean> {
  // A simple, low-quota search query that should always work with a valid key.
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=google&key=${key}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    // The API returns an 'error' object on failure. If it doesn't exist, the key is likely valid.
    return !data.error;
  } catch (error) {
    console.error("YouTube API validation failed:", error);
    return false;
  }
}

export async function validateGeminiApiKey(key: string): Promise<boolean> {
  try {
    // Attempt to initialize the client and make a minimal request.
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'test',
    });
    return true;
  } catch (error) {
    console.error("Gemini API validation failed:", error);
    return false;
  }
}

export async function validateOpenaiApiKey(key: string): Promise<boolean> {
  const API_URL = "https://api.openai.com/v1/chat/completions";
  try {
    // Make a minimal request that consumes almost no tokens.
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("OpenAI API validation failed:", error);
    return false;
  }
}