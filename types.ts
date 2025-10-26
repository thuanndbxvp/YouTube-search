
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

// FIX: Add ChatMessage interface for use in BrainstormChat component.
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChannelDetails {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  customUrl: string;
  country: string | undefined;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
}

export interface SessionData {
  channelUrl: string;
  videos: VideoData[];
  channelDetails: ChannelDetails | null;
  chatHistory: ChatMessage[];
}

export interface Session {
  id: number; // timestamp
  name: string;
  createdAt: string;
  channelTitle: string;
  videoCount: number;
  data: SessionData;
}

export interface ApiKey {
  id: string;
  key: string;
  status: 'valid' | 'invalid' | 'unchecked';
}