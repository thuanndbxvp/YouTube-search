import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { VideoData, AiProvider, SortKey, SortOrder, KeywordData, ChatMessage } from './types';
import { getChannelIdFromUrl, getUploadsPlaylistId, getPaginatedVideoIds, getVideoDetails } from './services/youtubeService';
import { generateVideoSummary as generateGeminiSummary } from './services/geminiService';
import { generateVideoSummary as generateOpenaiSummary, generateChatResponse as generateOpenaiChatResponse } from './services/openaiService';
import { ResultsTable } from './components/ResultsTable';
import { UrlInputForm } from './components/UrlInputForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { AppHeader } from './components/AppHeader';
import { ApiManagementModal } from './components/ApiManagementModal';
import { ProviderSelector } from './components/ProviderSelector';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { BrainstormChat } from './components/BrainstormChat';
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

  // Load API settings from localStorage on initial render
  useEffect(() => {
    setGeminiApiKey(localStorage.getItem('geminiApiKey') || '');
    setOpenaiApiKey(localStorage.getItem('openaiApiKey') || '');
    setYoutubeApiKey(localStorage.getItem('youtubeApiKey') || '');
    setSelectedGeminiModel(localStorage.getItem('selectedGeminiModel') || 'gemini-2.5-flash');
    setSelectedOpenaiModel(localStorage.getItem('selectedOpenaiModel') || 'gpt-3.5-turbo');
    setSelectedProvider((localStorage.getItem('selectedProvider') as AiProvider) || 'gemini');
  }, []);
  
  const generateSummariesForVideos = (videosToProcess: VideoData[]) => {
      const providerApiKey = selectedProvider === 'gemini' ? geminiApiKey : openaiApiKey;
      if (!providerApiKey) {
        const errorMsg = `Lỗi: Vui lòng nhập API Key cho ${selectedProvider === 'gemini' ? 'Gemini' : 'OpenAI'} trong phần Quản lý API để tạo tóm tắt.`;
        setError(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
        setVideos(currentVideos => currentVideos.map(v => ({...v, summary: 'Lỗi: Thiếu API key.'})));
        return;
      }

      videosToProcess.forEach(video => {
        const generateFunction = selectedProvider === 'gemini' 
            ? generateGeminiSummary
            : generateOpenaiSummary;
        
        const model = selectedProvider === 'gemini' 
            ? selectedGeminiModel 
            : selectedOpenaiModel;

        generateFunction(video.title, providerApiKey, model)
            .then(summary => {
                setVideos(currentVideos => 
                    currentVideos.map(v => 
                        v.id === video.id ? { ...v, summary } : v
                    )
                );
            })
            .catch(err => {
                console.error(`Failed to generate summary for video ${video.id}`, err);
                setVideos(currentVideos => 
                    currentVideos.map(v => 
                        v.id === video.id ? { ...v, summary: `Lỗi tóm tắt: ${err.message}` } : v
                    )
                );
            });
      });
  };

  const loadVideos = useCallback(async (playlistId: string, pageToken?: string) => {
    try {
      const { videoIds, nextPageToken: newNextPageToken } = await getPaginatedVideoIds(playlistId, youtubeApiKey, pageToken);
      if (videoIds.length === 0) {
        if (!pageToken) {
          setError('Không tìm thấy video nào trên kênh này.');
        }
        setNextPageToken(undefined);
        return;
      }
      const newVideos = await getVideoDetails(videoIds, youtubeApiKey);
      
      setVideos(currentVideos => pageToken ? [...currentVideos, ...newVideos] : newVideos);
      setNextPageToken(newNextPageToken);

      // Generate summaries for the new videos
      generateSummariesForVideos(newVideos);

    } catch (e) {
       const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.';
       setError(`Không thể tải video: ${errorMessage}`);
       console.error(e);
    }
  }, [youtubeApiKey, selectedProvider, geminiApiKey, openaiApiKey, selectedGeminiModel, selectedOpenaiModel]);


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
    
    const stopWords = new Set(["và", "là", "của", "có", "một", "trong", "cho", "để", "với", "không", "khi", "thì", "mà", "được", "tại", "về", "này", "đó", "ra", "vào", "nhất", "làm", "sao", "phần", "tập", "a", "an", "the", "and", "is", "in", "it", "of", "for", "on", "with", "to", "i", "you", "he", "she", "they", "how", "what", "why", "top", "new", "|", "-"]);

    const wordCounts: { [key: string]: number } = {};

    videos.forEach(video => {
        const words = video.title
            .toLowerCase()
            .replace(/[^\p{L}\s\d]/gu, '') // Remove punctuation, keep letters and numbers
            .split(/\s+/);

        words.forEach(word => {
            if (word && !stopWords.has(word) && isNaN(Number(word))) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
    });

    return Object.entries(wordCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 15)
        .map(([text, count]) => ({ text, count }));
  }, [videos]);

  const handleAiChat = useCallback(async (history: ChatMessage[]) => {
    if (selectedProvider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        // Gemini chat is stateful, so we'll just send the last user message for simplicity
        // For a true conversational experience, the component would manage a `chat` instance.
        // Here, we simulate by sending history within the prompt.
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
                    <h3 className="text-lg font-semibold text-white mb-3">Sáng tạo ý tưởng mới</h3>
                    <p className="text-sm text-gray-400 mb-4">Dùng AI để phát triển ý tưởng cho một kênh mới dựa trên phân tích này.</p>
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
          <BrainstormChat
            isOpen={isBrainstormOpen}
            onClose={() => setIsBrainstormOpen(false)}
            keywords={keywords}
            onSendMessage={handleAiChat}
            provider={selectedProvider}
          />
      )}
    </div>
  );
};

export default App;
