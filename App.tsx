import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { VideoData, AiProvider, SortKey, SortOrder, KeywordData, ChatMessage, HashtagData, ChannelDetails, Session, ApiKey } from './types';
import { getChannelIdFromUrl, getUploadsPlaylistId, getPaginatedVideoIds, getVideoDetails, getChannelDetails } from './services/youtubeService';
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
import { ChannelInfoModal } from './components/ChannelInfoModal';
import { LibraryModal } from './components/LibraryModal';
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
  const [youtubeApiKeys, setYoutubeApiKeys] = useState<ApiKey[]>([]);
  const [geminiApiKeys, setGeminiApiKeys] = useState<ApiKey[]>([]);
  const [openaiApiKeys, setOpenaiApiKeys] = useState<ApiKey[]>([]);
  const [activeYoutubeKeyId, setActiveYoutubeKeyId] = useState<string | null>(null);
  const [activeGeminiKeyId, setActiveGeminiKeyId] = useState<string | null>(null);
  const [activeOpenaiKeyId, setActiveOpenaiKeyId] = useState<string | null>(null);

  const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>('gemini-2.5-flash');
  const [selectedOpenaiModel, setSelectedOpenaiModel] = useState<string>('gpt-4o');
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');

  // New state for advanced features
  const [uploadsPlaylistId, setUploadsPlaylistId] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isMoreLoading, setIsMoreLoading] = useState<boolean>(false);
  const [isBrainstormOpen, setIsBrainstormOpen] = useState<boolean>(false);
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState<boolean>(false);
  const [channelDetails, setChannelDetails] = useState<ChannelDetails | null>(null);
  const [isChannelInfoModalOpen, setIsChannelInfoModalOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [savedSessions, setSavedSessions] = useState<Session[]>([]);

  const activeYoutubeKey = useMemo(() => youtubeApiKeys.find(k => k.id === activeYoutubeKeyId)?.key ?? null, [youtubeApiKeys, activeYoutubeKeyId]);
  const activeGeminiKey = useMemo(() => geminiApiKeys.find(k => k.id === activeGeminiKeyId)?.key ?? null, [geminiApiKeys, activeGeminiKeyId]);
  const activeOpenaiKey = useMemo(() => openaiApiKeys.find(k => k.id === activeOpenaiKeyId)?.key ?? null, [openaiApiKeys, activeOpenaiKeyId]);

  // Load API settings & sessions from localStorage on initial render
  useEffect(() => {
    setSelectedGeminiModel(localStorage.getItem('selectedGeminiModel') || 'gemini-2.5-flash');
    setSelectedOpenaiModel(localStorage.getItem('selectedOpenaiModel') || 'gpt-4o');
    setSelectedProvider((localStorage.getItem('selectedProvider') as AiProvider) || 'gemini');

    const storedKeysData = localStorage.getItem('youtube-analyzer-api-keys');
    if (storedKeysData) {
        const parsedData = JSON.parse(storedKeysData);
        setYoutubeApiKeys(parsedData.youtube?.keys || []);
        setActiveYoutubeKeyId(parsedData.youtube?.activeKeyId || null);
        setGeminiApiKeys(parsedData.gemini?.keys || []);
        setActiveGeminiKeyId(parsedData.gemini?.activeKeyId || null);
        setOpenaiApiKeys(parsedData.openai?.keys || []);
        setActiveOpenaiKeyId(parsedData.openai?.activeKeyId || null);
    } else {
        // Migration from old localStorage format
        const oldYoutubeKey = localStorage.getItem('youtubeApiKey');
        const oldGeminiKey = localStorage.getItem('geminiApiKey');
        const oldOpenaiKey = localStorage.getItem('openaiApiKey');
        
        let migrated = false;
        const newKeysData: {
            youtube: { keys: ApiKey[], activeKeyId: string | null },
            gemini: { keys: ApiKey[], activeKeyId: string | null },
            openai: { keys: ApiKey[], activeKeyId: string | null },
        } = {
            youtube: { keys: [], activeKeyId: null },
            gemini: { keys: [], activeKeyId: null },
            openai: { keys: [], activeKeyId: null },
        };

        if (oldYoutubeKey) {
            const newKey = { id: `migrated-${Date.now()}-yt`, key: oldYoutubeKey, status: 'unchecked' as const };
            newKeysData.youtube.keys.push(newKey);
            newKeysData.youtube.activeKeyId = newKey.id;
            setYoutubeApiKeys(newKeysData.youtube.keys);
            setActiveYoutubeKeyId(newKey.id);
            localStorage.removeItem('youtubeApiKey');
            migrated = true;
        }
        if (oldGeminiKey) {
            const newKey = { id: `migrated-${Date.now()}-gm`, key: oldGeminiKey, status: 'unchecked' as const };
            newKeysData.gemini.keys.push(newKey);
            newKeysData.gemini.activeKeyId = newKey.id;
            setGeminiApiKeys(newKeysData.gemini.keys);
            setActiveGeminiKeyId(newKey.id);
            localStorage.removeItem('geminiApiKey');
            migrated = true;
        }
        if (oldOpenaiKey) {
            const newKey = { id: `migrated-${Date.now()}-op`, key: oldOpenaiKey, status: 'unchecked' as const };
            newKeysData.openai.keys.push(newKey);
            newKeysData.openai.activeKeyId = newKey.id;
            setOpenaiApiKeys(newKeysData.openai.keys);
            setActiveOpenaiKeyId(newKey.id);
            localStorage.removeItem('openaiApiKey');
            migrated = true;
        }

        if (migrated) {
            localStorage.setItem('youtube-analyzer-api-keys', JSON.stringify(newKeysData));
        }
    }

    const storedSessions = localStorage.getItem('youtube-analyzer-sessions');
    if (storedSessions) {
        setSavedSessions(JSON.parse(storedSessions));
    }
  }, []);
  
  const loadVideos = useCallback(async (playlistId: string, pageToken?: string) => {
    if (!activeYoutubeKey) {
      setError('Vui lòng cung cấp và chọn một YouTube API Key đang hoạt động.');
      return;
    }
    try {
      let combinedNewVideos: VideoData[] = [];
      let currentToken = pageToken;
      let newNextPageToken: string | undefined = undefined;
      const isInitialLoad = !pageToken;

      while (true) {
        const pageData = await getPaginatedVideoIds(playlistId, activeYoutubeKey, currentToken);
        newNextPageToken = pageData.nextPageToken;
        
        if (pageData.videoIds.length === 0) {
          setNextPageToken(undefined);
          break;
        }

        const newVideosFromPage = await getVideoDetails(pageData.videoIds, activeYoutubeKey);
        if (newVideosFromPage.length > 0) {
          combinedNewVideos.push(...newVideosFromPage);
        }
        
        if (newVideosFromPage.length > 0 || !newNextPageToken) {
          setNextPageToken(newNextPageToken);
          break;
        }
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
  }, [activeYoutubeKey]);


  const handleAnalyze = useCallback(async () => {
    if (!channelUrl.trim()) {
      setError('Vui lòng nhập URL của kênh YouTube.');
      return;
    }
    if (!activeYoutubeKey) {
      setError('Vui lòng nhập API Key của YouTube, xác thực và chọn nó. Nhấp vào nút "Quản lý API" ở góc trên.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setVideos([]);
    setNextPageToken(undefined);
    setUploadsPlaylistId(null);
    setChannelDetails(null);
    setChatHistory([]);

    try {
      const channelId = await getChannelIdFromUrl(channelUrl, activeYoutubeKey);
      
      const [playlistId, details] = await Promise.all([
          getUploadsPlaylistId(channelId, activeYoutubeKey),
          getChannelDetails(channelId, activeYoutubeKey)
      ]);

      setUploadsPlaylistId(playlistId);
      setChannelDetails(details);
      await loadVideos(playlistId);
      setSortKey('publishedAt');
      setSortOrder('desc');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.';
      setError(`Không thể phân tích kênh: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [channelUrl, activeYoutubeKey, loadVideos]);
  
  const handleLoadMore = useCallback(async () => {
      if (!uploadsPlaylistId || !nextPageToken) return;
      
      setIsMoreLoading(true);
      await loadVideos(uploadsPlaylistId, nextPageToken);
      setIsMoreLoading(false);
  }, [uploadsPlaylistId, nextPageToken, loadVideos]);

  const handleSaveSession = useCallback(() => {
    const sessionName = prompt("Nhập tên cho phiên làm việc này:", channelDetails?.title || "Phiên chưa có tên");
    if (!sessionName) return;

    const newSession: Session = {
        id: Date.now(),
        name: sessionName,
        createdAt: new Date().toISOString(),
        channelTitle: channelDetails?.title || 'Không rõ',
        videoCount: videos.length,
        data: {
            channelUrl,
            videos,
            channelDetails,
            chatHistory
        }
    };

    const updatedSessions = [...savedSessions, newSession];
    setSavedSessions(updatedSessions);
    localStorage.setItem('youtube-analyzer-sessions', JSON.stringify(updatedSessions));
    alert(`Phiên "${sessionName}" đã được lưu!`);
  }, [channelUrl, videos, channelDetails, chatHistory, savedSessions]);
    
  const handleLoadSession = useCallback((sessionId: number) => {
    const sessionToLoad = savedSessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
        const { data } = sessionToLoad;
        setChannelUrl(data.channelUrl);
        setVideos(data.videos);
        setChannelDetails(data.channelDetails);
        setChatHistory(data.chatHistory);
        
        setError(null);
        setIsLoading(false);
        setIsMoreLoading(false);
        setNextPageToken(undefined);
        setSortKey('publishedAt');
        setSortOrder('desc');
        
        setIsLibraryOpen(false);
    }
  }, [savedSessions]);
    
  const handleDeleteSession = useCallback((sessionId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiên này không?")) {
        const updatedSessions = savedSessions.filter(s => s.id !== sessionId);
        setSavedSessions(updatedSessions);
        localStorage.setItem('youtube-analyzer-sessions', JSON.stringify(updatedSessions));
    }
  }, [savedSessions]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('desc');
    }
  }, [sortKey]);

  const durationToSeconds = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
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
        if (!activeGeminiKey) throw new Error("Vui lòng cung cấp và chọn một API Key của Gemini đang hoạt động trong phần 'Quản lý API'.");
        const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
         const chat = ai.chats.create({
            model: selectedGeminiModel,
            history: history.slice(0, -1).map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            }))
        });
        const lastMessage = history[history.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        return result.text;
    } else { // openai
        if (!activeOpenaiKey) throw new Error("Vui lòng cung cấp và chọn một API Key của OpenAI đang hoạt động trong phần 'Quản lý API'.");
        return generateOpenaiChatResponse(history, activeOpenaiKey, selectedOpenaiModel);
    }
  }, [selectedProvider, activeGeminiKey, activeOpenaiKey, selectedGeminiModel, selectedOpenaiModel]);

  const generateComprehensivePrompt = useCallback((
    videos: VideoData[], 
    keywords: KeywordData[], 
    hashtags: HashtagData[], 
    channelDetails: ChannelDetails | null
  ): string => {
      const allVideosSortedByViews = [...videos].sort((a, b) => b.views - a.views);
      
      let prompt = `Bạn là một nhà chiến lược sáng tạo nội dung YouTube. Tôi đã phân tích một kênh và có các dữ liệu sau:\n\n`;
  
      if (channelDetails) {
          prompt += `--- THÔNG TIN KÊNH ---\n`;
          prompt += `Tên kênh: ${channelDetails.title}\n`;
          prompt += `Mô tả: ${channelDetails.description.substring(0, 300)}...\n\n`;
      }
  
      prompt += `--- DANH SÁCH VIDEO ĐÃ PHÂN TÍCH (SẮP XẾP THEO LƯỢT XEM) ---\n`;
      allVideosSortedByViews.forEach((v, i) => {
          prompt += `${i + 1}. Tiêu đề: "${v.title}" (Lượt xem: ${v.views.toLocaleString('vi-VN')}, Lượt thích: ${v.likes.toLocaleString('vi-VN')})\n`;
      });
      prompt += `\n`;
  
      if (keywords.length > 0) {
          prompt += `--- CÁC TỪ KHÓA CHÍNH TRONG TIÊU ĐỀ ---\n`;
          prompt += `${keywords.map(k => k.text).join(', ')}\n\n`;
      }
  
      if (hashtags.length > 0) {
          prompt += `--- CÁC HASHTAG PHỔ BIẾN ---\n`;
          prompt += `${hashtags.slice(0, 10).map(h => h.text).join(' ')}\n\n`;
      }
  
      prompt += `--- YÊU CẦU ---\n`;
      prompt += `Dựa trên toàn bộ dữ liệu trên, hãy giúp tôi brainstorm ý tưởng.\n`;
      prompt += `Bắt đầu bằng cách đề xuất 3 hướng đi (concept) độc đáo cho một kênh tương tự nhưng có sự khác biệt để nổi bật. Trình bày mỗi concept với một tiêu đề hấp dẫn và một đoạn mô tả ngắn gọn về nội dung và đối tượng khán giả.`;
  
      return prompt;
  }, []);

  const handleBrainstormClick = useCallback(async () => {
    setIsBrainstormOpen(true);

    if (chatHistory.length === 0 && videos.length > 0) {
      setChatHistory([{ role: 'model', content: "Đang phân tích dữ liệu kênh để đưa ra ý tưởng..." }]);
      
      try {
        const comprehensivePrompt = generateComprehensivePrompt(videos, keywords, hashtags, channelDetails);
        const initialHistory: ChatMessage[] = [{ role: 'user', content: comprehensivePrompt }];
        const response = await handleAiChat(initialHistory);
        setChatHistory([{ role: 'model', content: response }]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
        setChatHistory([{ role: 'model', content: `Xin lỗi, đã có lỗi xảy ra khi tạo ý tưởng ban đầu: ${errorMessage}` }]);
      }
    }
  }, [chatHistory, videos, keywords, hashtags, channelDetails, handleAiChat, generateComprehensivePrompt]);
  
  const handleSendToNotebookLM = useCallback(() => {
    if (videos.length === 0) return;

    const baseUrl = 'https://notebooklm.google.com/addsource';
    const videoUrls = videos.map(video => 
      `url=${encodeURIComponent(`https://www.youtube.com/watch?v=${video.id}`)}`
    );

    const finalUrl = `${baseUrl}?${videoUrls.join('&')}`;
    
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  }, [videos]);


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-8">
        <AppHeader 
          onOpenApiModal={() => setIsModalOpen(true)}
          onOpenLibraryModal={() => setIsLibraryOpen(true)}
          onSaveSession={handleSaveSession}
          isSaveDisabled={videos.length === 0}
        />
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
                    <KeywordAnalysis keywords={keywords} channelDetails={channelDetails} videos={sortedVideos} />
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-semibold text-white mb-3">Công cụ Phân tích & Sáng tạo</h3>
                    <p className="text-sm text-gray-400 mb-4">Sử dụng các công cụ để hiểu sâu hơn về kênh và tìm kiếm ý tưởng mới.</p>
                     <div className="w-full space-y-3">
                        <button
                            onClick={handleBrainstormClick}
                            disabled={videos.length === 0}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                            Brainstorm Ý tưởng
                        </button>
                        <button
                            onClick={handleSendToNotebookLM}
                            disabled={videos.length === 0}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            Gửi tới NotebookLM
                        </button>
                        <div className="flex gap-3">
                           <button
                              onClick={() => setIsChannelInfoModalOpen(true)}
                              disabled={!channelDetails}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Thống kê
                            </button>
                             <button
                                onClick={() => setIsHashtagModalOpen(true)}
                                disabled={hashtags.length === 0}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center"
                              >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                Thẻ tag
                              </button>
                        </div>
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
        youtubeApiKeys={youtubeApiKeys}
        setYoutubeApiKeys={setYoutubeApiKeys}
        activeYoutubeKeyId={activeYoutubeKeyId}
        setActiveYoutubeKeyId={setActiveYoutubeKeyId}
        geminiApiKeys={geminiApiKeys}
        setGeminiApiKeys={setGeminiApiKeys}
        activeGeminiKeyId={activeGeminiKeyId}
        setActiveGeminiKeyId={setActiveGeminiKeyId}
        openaiApiKeys={openaiApiKeys}
        setOpenaiApiKeys={setOpenaiApiKeys}
        activeOpenaiKeyId={activeOpenaiKeyId}
        setActiveOpenaiKeyId={setActiveOpenaiKeyId}
        selectedGeminiModel={selectedGeminiModel}
        setSelectedGeminiModel={setSelectedGeminiModel}
        selectedOpenaiModel={selectedOpenaiModel}
        setSelectedOpenaiModel={setSelectedOpenaiModel}
      />
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        sessions={savedSessions}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
      />
      {videos.length > 0 && (
        <>
          <BrainstormChat
            isOpen={isBrainstormOpen}
            onClose={() => setIsBrainstormOpen(false)}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            onSendMessage={handleAiChat}
            provider={selectedProvider}
            channelDetails={channelDetails}
          />
          <HashtagModal
            isOpen={isHashtagModalOpen}
            onClose={() => setIsHashtagModalOpen(false)}
            hashtags={hashtags}
          />
        </>
      )}
      {channelDetails && (
        <ChannelInfoModal
            isOpen={isChannelInfoModalOpen}
            onClose={() => setIsChannelInfoModalOpen(false)}
            channelDetails={channelDetails}
        />
      )}
    </div>
  );
};

export default App;