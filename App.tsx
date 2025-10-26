import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { VideoData, AiProvider, SortKey, SortOrder, KeywordData, ChatMessage, HashtagData } from './types';
import { getChannelIdFromUrl, getUploadsPlaylistId, getPaginatedVideoIds, getVideoDetails } from './services/youtubeService';
import { generateChatResponse as generateOpenaiChatResponse } from './services/openaiService';
import { ResultsTable } from './components/ResultsTable';
import { UrlInputForm } from './components/UrlInputForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { AppHeader } from './components/AppHeader';
import { ApiManagementModal } from './components/ApiManagementModal';
import { ProviderSelector } from './components/ProviderSelector';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { BrainstormChat } from './components/BrainstormChat';
import { HashtagModal } from './components/HashtagModal';
import { GoogleGenAI } from '@google/genai';

const App: React.FC = () => {
  const [channelUrl, setChannelUrl] = useState<string>('');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('publishedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // State for API Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>('');
  const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>('gemini-2.5-flash');
  const [selectedOpenaiModel, setSelectedOpenaiModel] = useState<string>('gpt-3.5-turbo');
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');

  // New state for advanced features
  const [uploadsPlaylistId, setUploadsPlaylistId] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isMoreLoading, setIsMoreLoading] = useState<boolean>(false);
  const [isBrainstormOpen, setIsBrainstormOpen] = useState<boolean>(false);
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState<boolean>(false);

  // Load API settings from localStorage on initial render
  useEffect(() => {
    setGeminiApiKey(localStorage.getItem('geminiApiKey') || '');
    setOpenaiApiKey(localStorage.getItem('openaiApiKey') || '');
    setYoutubeApiKey(localStorage.getItem('youtubeApiKey') || '');
    setSelectedGeminiModel(localStorage.getItem('selectedGeminiModel') || 'gemini-2.5-flash');
    setSelectedOpenaiModel(localStorage.getItem('selectedOpenaiModel') || 'gpt-3.5-turbo');
    setSelectedProvider((localStorage.getItem('selectedProvider') as AiProvider) || 'gemini');
  }, []);
  
  const loadVideos = useCallback(async (playlistId: string, pageToken?: string) => {
    try {
      let combinedNewVideos: VideoData[] = [];
      let currentToken = pageToken;
      let newNextPageToken: string | undefined = undefined;
      const isInitialLoad = !pageToken;

      // Keep fetching pages as long as the last page was full of invalid videos
      while (true) {
        const pageData = await getPaginatedVideoIds(playlistId, youtubeApiKey, currentToken);
        newNextPageToken = pageData.nextPageToken;
        
        if (pageData.videoIds.length === 0) {
          // No more videos in the playlist, stop.
          setNextPageToken(undefined);
          break;
        }

        const newVideosFromPage = await getVideoDetails(pageData.videoIds, youtubeApiKey);
        if (newVideosFromPage.length > 0) {
          combinedNewVideos.push(...newVideosFromPage);
        }
        
        // Stop fetching if:
        // 1. We found some valid videos on this page.
        // 2. There are no more pages to fetch.
        if (newVideosFromPage.length > 0 || !newNextPageToken) {
          setNextPageToken(newNextPageToken);
          break;
        }

        // If we're here, this page had 0 valid videos, but there is a next page.
        // Loop again with the new token.
        currentToken = newNextPageToken;
      }

      if (combinedNewVideos.length > 0) {
        setVideos(currentVideos => isInitialLoad ? combinedNewVideos : [...currentVideos, ...combinedNewVideos]);
      } else if (isInitialLoad) { 
        setError('Không tìm thấy video nào trên kênh này hoặc tất cả video đều ở chế độ riêng tư/đã bị xóa.');
      }

    } catch (e) {
       const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.';
       setError(`Không thể tải video: ${errorMessage}`);
       console.error(e);
    }
  }, [youtubeApiKey]);


  const handleAnalyze = useCallback(async () => {
    if (!channelUrl.trim()) {
      setError('Vui lòng nhập URL của kênh YouTube.');
      return;
    }
    if (!youtubeApiKey) {
      setError('Vui lòng nhập API Key của YouTube. Nhấp vào nút "Quản lý API" ở góc trên.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setVideos([]);
    setNextPageToken(undefined);
    setUploadsPlaylistId(null);

    try {
      const channelId = await getChannelIdFromUrl(channelUrl, youtubeApiKey);
      const playlistId = await getUploadsPlaylistId(channelId, youtubeApiKey);
      setUploadsPlaylistId(playlistId);
      await loadVideos(playlistId);
       // Reset sort to default when new data is fetched
      setSortKey('publishedAt');
      setSortOrder('desc');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.';
      setError(`Không thể phân tích kênh: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [channelUrl, youtubeApiKey, loadVideos]);
  
  const handleLoadMore = useCallback(async () => {
      if (!uploadsPlaylistId || !nextPageToken) return;
      
      setIsMoreLoading(true);
      await loadVideos(uploadsPlaylistId, nextPageToken);
      setIsMoreLoading(false);
  }, [uploadsPlaylistId, nextPageToken, loadVideos]);


  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('desc'); // Luôn bắt đầu bằng sắp xếp giảm dần cho cột mới
    }
  }, [sortKey]);

  const durationToSeconds = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) { // HH:MM:SS
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) { // MM:SS
        seconds = parts[0] * 60 + parts[1];
    }
    return seconds;
  };

  const sortedVideos = useMemo(() => {
    if (!videos) return [];
    return [...videos].sort((a, b) => {
        let valA, valB;

        if (sortKey === 'publishedAt') {
            valA = new Date(a.publishedAt).getTime();
            valB = new Date(b.publishedAt).getTime();
        } else if (sortKey === 'duration') {
            valA = durationToSeconds(a.duration);
            valB = durationToSeconds(b.duration);
        } else {
            valA = a[sortKey];
            valB = b[sortKey];
        }

        if (valA < valB) {
            return sortOrder === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });
  }, [videos, sortKey, sortOrder]);

  const keywords = useMemo<KeywordData[]>(() => {
    if (videos.length === 0) return [];
    
    const stopWords = new Set([
        "và", "là", "của", "có", "một", "trong", "cho", "để", "với", "không", 
        "khi", "thì", "mà", "được", "tại", "về", "này", "đó", "ra", "vào", 
        "nhất", "làm", "sao", "phần", "tập", "cách", "hướng", "dẫn", "như", "thế", "nào",
        "a", "an", "the", "and", "is", "in", "it", "of", "for", "on", "with", 
        "to", "i", "you", "he", "she", "they", "we", "how", "what", "why", 
        "top", "new", "|", "-", "tôi", "bạn", "đã"
    ]);

    const phraseCounts: { [key: string]: number } = {};

    videos.forEach(video => {
        const title = video.title
            .toLowerCase()
            .replace(/[^\p{L}\s\d]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const words = title.split(' ');
        const n = words.length;

        for (let i = 0; i < n; i++) {
            for (let j = 1; j <= 3 && i + j <= n; j++) {
                const phraseWords = words.slice(i, i + j);
                const phrase = phraseWords.join(' ');
                
                const isMeaningful = phraseWords.some(word => !stopWords.has(word) && isNaN(Number(word)));
                const isShortSingleWord = j === 1 && phrase.length < 3;
                
                if (isMeaningful && !isShortSingleWord) {
                    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
                }
            }
        }
    });

    const filteredPhrases = Object.entries(phraseCounts)
        .filter(([, count]) => count > 1);

    return filteredPhrases
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 20)
      .map(([text, count]) => ({ text, count }));
  }, [videos]);

  const hashtags = useMemo<HashtagData[]>(() => {
    if (videos.length === 0) return [];
    
    const hashtagCounts: { [key: string]: number } = {};
    const hashtagRegex = /#[\w\p{L}]+/gu;

    videos.forEach(video => {
        if (video.description) {
            const matches = video.description.match(hashtagRegex);
            if (matches) {
                matches.forEach(tag => {
                    const cleanedTag = tag.toLowerCase();
                    hashtagCounts[cleanedTag] = (hashtagCounts[cleanedTag] || 0) + 1;
                });
            }
        }
    });

    return Object.entries(hashtagCounts)
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count);
  }, [videos]);

  const handleAiChat = useCallback(async (history: ChatMessage[]) => {
    if (selectedProvider === 'gemini') {
        if (!geminiApiKey) throw new Error("Vui lòng cung cấp API Key của Gemini trong phần 'Quản lý API'.");
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
         const chat = ai.chats.create({
            model: selectedGeminiModel,
            history: history.slice(0, -1).map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }))
        });
        const lastMessage = history[history.length - 1];
        const result = await chat.sendMessage({ message: lastMessage.content });
        return result.text;
    } else { // openai
        if (!openaiApiKey) throw new Error("Vui lòng cung cấp API Key của OpenAI trong phần 'Quản lý API'.");
        return generateOpenaiChatResponse(history, openaiApiKey, selectedOpenaiModel);
    }
  }, [selectedProvider, geminiApiKey, openaiApiKey, selectedGeminiModel, selectedOpenaiModel]);


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-8">
        <AppHeader onOpenApiModal={() => setIsModalOpen(true)} />
        <UrlInputForm
          channelUrl={channelUrl}
          setChannelUrl={setChannelUrl}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />
        <div className="max-w-2xl mx-auto mt-4">
            <ProviderSelector 
                selectedProvider={selectedProvider} 
                setSelectedProvider={setSelectedProvider} 
            />
        </div>
        
        {error && <ErrorMessage message={error} />}

        <div className="mt-8">
          {isLoading && videos.length === 0 && (
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-2 text-lg text-gray-400">Đang tìm video và phân tích kênh...</p>
            </div>
          )}

          {videos.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="md:col-span-2">
                    <KeywordAnalysis keywords={keywords} />
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-semibold text-white mb-3">Công cụ Phân tích & Sáng tạo</h3>
                    <p className="text-sm text-gray-400 mb-4">Sử dụng các công cụ để hiểu sâu hơn về kênh và tìm kiếm ý tưởng mới.</p>
                     <div className="w-full space-y-3">
                        <button
                            onClick={() => setIsBrainstormOpen(true)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                            Brainstorm Ý tưởng
                        </button>
                         <button
                            onClick={() => setIsHashtagModalOpen(true)}
                            disabled={hashtags.length === 0}
                            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            Liệt kê các thẻ tag
                          </button>
                    </div>
                  </div>
              </div>

              <ResultsTable 
                videos={sortedVideos} 
                onSort={handleSort}
                sortKey={sortKey}
                sortOrder={sortOrder}
              />

              {nextPageToken && (
                  <div className="mt-8 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={isMoreLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 ease-in-out"
                      >
                        {isMoreLoading ? 'Đang tải...' : 'Tải thêm 50 video'}
                      </button>
                  </div>
              )}
            </>
          )}
        </div>
      </main>
      <ApiManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        openaiApiKey={openaiApiKey}
        setOpenaiApiKey={setOpenaiApiKey}
        youtubeApiKey={youtubeApiKey}
        setYoutubeApiKey={setYoutubeApiKey}
        selectedGeminiModel={selectedGeminiModel}
        setSelectedGeminiModel={setSelectedGeminiModel}
        selectedOpenaiModel={selectedOpenaiModel}
        setSelectedOpenaiModel={setSelectedOpenaiModel}
      />
      {videos.length > 0 && (
        <>
          <BrainstormChat
            isOpen={isBrainstormOpen}
            onClose={() => setIsBrainstormOpen(false)}
            keywords={keywords}
            onSendMessage={handleAiChat}
            provider={selectedProvider}
          />
          <HashtagModal
            isOpen={isHashtagModalOpen}
            onClose={() => setIsHashtagModalOpen(false)}
            hashtags={hashtags}
          />
        </>
      )}
    </div>
  );
};

export default App;