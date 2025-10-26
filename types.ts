
export interface VideoData {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  summary: string;
  duration: string;
}

export type AiProvider = 'gemini' | 'openai';

export type SortKey = 'publishedAt' | 'views' | 'likes';
export type SortOrder = 'asc' | 'desc';
