
export interface VideoData {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  views: number;
  likes: number;
  duration: string;
}

export type AiProvider = 'gemini' | 'openai';

export type SortKey = 'publishedAt' | 'views' | 'likes' | 'duration';
export type SortOrder = 'asc' | 'desc';

export interface KeywordData {
  text: string;
  count: number;
}

export interface HashtagData {
  text: string;
  count: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}