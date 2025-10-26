
export interface VideoData {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  summary: string;
}

export type AiProvider = 'gemini' | 'openai';