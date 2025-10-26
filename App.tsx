import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { VideoData, AiProvider, SortKey, SortOrder, KeywordData, HashtagData, ChannelDetails, Session, ApiKey, ChatMessage } from './types';
import { getChannelIdFromUrl, getUploadsPlaylistId, getPaginatedVideoIds, getVideoDetails, getChannelDetails } from './services/youtubeService';
import { generateChatResponse as generateGeminiChatResponse } from './services/geminiService';
import { generateChatResponse as generateOpenaiChatResponse } from './services/openaiService';
import { ResultsTable } from './components/ResultsTable';
import { UrlInputForm } from './components/UrlInputForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { AppHeader } from './components/AppHeader';
import { ApiManagementModal } from './components/ApiManagementModal';
import { ProviderSelector } from './components/ProviderSelector';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { HashtagModal } from './components/HashtagModal';
import { BrainstormChat } from './components/BrainstormChat';
import { ChannelInfoModal } from './components/ChannelInfoModal';
import { LibraryModal } from './components/LibraryModal';

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
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState<boolean>(false);
  const [channelDetails, setChannelDetails] = useState<ChannelDetails | null>(null);
  const [isChannelInfoModalOpen, setIsChannelInfoModalOpen] = useState<boolean>(false);
  
  // Brainstorm State
  const [isBrainstormOpen, setIsBrainstormOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [savedSessions, setSavedSessions] = useState<Session[]>([]);

  const activeYoutubeKey = useMemo(() => youtubeApiKeys.find(k => k.id === activeYoutubeKeyId)?.key ?? null, [youtubeApiKeys, activeYoutubeKeyId]);

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
    setChatHistory([]);
    setNextPageToken(undefined);
    setUploadsPlaylistId(null);
    setChannelDetails(null);

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
            chatHistory,
        }
    };

    const updatedSessions = [...savedSessions, newSession];
    setSavedSessions(updatedSessions);
    localStorage.setItem('youtube-analyzer-sessions', JSON.stringify(updatedSessions));
    alert(`Phiên "${sessionName}" đã được lưu!`);
  }, [channelUrl, videos, channelDetails, savedSessions, chatHistory]);
    
  const handleLoadSession = useCallback((sessionId: number) => {
    const sessionToLoad = savedSessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
        const { data } = sessionToLoad;
        setChannelUrl(data.channelUrl);
        setVideos(data.videos);
        setChannelDetails(data.channelDetails);
        setChatHistory(data.chatHistory || []);
        
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
  
  const handleAiChat = useCallback(async (history: ChatMessage[]): Promise<string> => {
    if (selectedProvider === 'gemini') {
        const activeKey = geminiApiKeys.find(k => k.id === activeGeminiKeyId)?.key;
        if (!activeKey) throw new Error("Vui lòng chọn một Gemini API Key đang hoạt động.");
        return await generateGeminiChatResponse(history, activeKey, selectedGeminiModel);
    } else { // openai
        const activeKey = openaiApiKeys.find(k => k.id === activeOpenaiKeyId)?.key;
        if (!activeKey) throw new Error("Vui lòng chọn một OpenAI API Key đang hoạt động.");
        return await generateOpenaiChatResponse(history, activeKey, selectedOpenaiModel);
    }
  }, [selectedProvider, geminiApiKeys, activeGeminiKeyId, selectedGeminiModel, openaiApiKeys, activeOpenaiKeyId, selectedOpenaiModel]);
  
  const handleBrainstormClick = useCallback(() => {
    if (videos.length === 0 || !channelDetails) return;

    const top5ViewedVideos = [...videos]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    const videoList = top5ViewedVideos.map(v => 
        `- "${v.title}" (Lượt xem: ${v.views.toLocaleString('vi-VN')}, Lượt thích: ${v.likes.toLocaleString('vi-VN')})`
    ).join('\n');

    const initialPrompt = `
**Bối cảnh:**
Bạn là một chuyên gia chiến lược nội dung YouTube dày dặn kinh nghiệm. Tôi đang phân tích một kênh và cần sự giúp đỡ của bạn để brainstorm các ý tưởng mới.

**Dữ liệu kênh được phân tích:**
- **Tên kênh:** ${channelDetails.title}
- **Mô tả kênh:** ${channelDetails.description.substring(0, 200)}...
- **Người đăng ký:** ${channelDetails.subscriberCount.toLocaleString('vi-VN')}
- **Tổng lượt xem:** ${channelDetails.viewCount.toLocaleString('vi-VN')}

**Danh sách 5 video có lượt xem nhiều nhất:**
${videoList}

**Nhiệm vụ của bạn:**
1.  **Phân tích:** Dựa vào dữ liệu trên, hãy phân tích nhanh các chủ đề, định dạng hoặc mẫu nội dung nào đang hoạt động tốt nhất cho kênh này. Chú ý vào các video thành công nhất.
2.  **Đề xuất:** Gợi ý 3-5 ý tưởng video mới hoặc hướng phát triển nội dung mới cho kênh này, dựa trên công thức thành công mà bạn đã phân tích. Mỗi ý tưởng cần có tiêu đề hấp dẫn và mô tả ngắn gọn.
3.  **Chào hỏi:** Bắt đầu cuộc trò chuyện bằng cách tóm tắt phân tích của bạn, đưa ra các đề xuất, và sau đó hỏi tôi "Dựa trên những phân tích này, bạn muốn chúng ta đào sâu vào khía cạnh nào hoặc brainstorm thêm về ý tưởng cụ thể nào không?".

Hãy bắt đầu ngay bây giờ.
    `;
    
    const analysisMessage: ChatMessage = { role: 'user', content: initialPrompt };
    const waitingMessage: ChatMessage = { role: 'model', content: "Đang phân tích dữ liệu kênh để chuẩn bị brainstorm... Vui lòng chờ trong giây lát." };

    setChatHistory([analysisMessage, waitingMessage]);
    setIsBrainstormOpen(true);

    handleAiChat([analysisMessage])
        .then(response => {
            const fullHistory: ChatMessage[] = [
                analysisMessage,
                { role: 'model', content: response }
            ];
            setChatHistory(fullHistory);
        })
        .catch(err => {
            const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
            setChatHistory([analysisMessage, { role: 'model', content: `Rất tiếc, đã xảy ra lỗi khi phân tích ban đầu: ${errorMessage}` }]);
        });
  }, [videos, channelDetails, handleAiChat]);

  const handleChatWithAiClick = useCallback(() => {
    if (videos.length === 0 || !channelDetails) return;

    const top5ViewedVideos = [...videos]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

    const videoList = top5ViewedVideos.map(v => 
        `- Tiêu đề: "${v.title}", Lượt xem: ${v.views.toLocaleString('vi-VN')}`
    ).join('\n');

    const initialPrompt = `
**Bối cảnh:**
Bạn là một chuyên gia phân tích dữ liệu và chiến lược gia nội dung cho YouTube. Tôi đã thu thập dữ liệu về một kênh và sẽ đặt câu hỏi để phân tích sâu hơn.

**Dữ liệu kênh:**
- **Tên kênh:** ${channelDetails.title}
- **Người đăng ký:** ${channelDetails.subscriberCount.toLocaleString('vi-VN')}
- **Tổng lượt xem:** ${channelDetails.viewCount.toLocaleString('vi-VN')}
- **Tổng số video đã tải lên trong phiên này:** ${videos.length}

**Một vài video có lượt xem cao nhất để làm mẫu:**
${videoList}

**Nhiệm vụ của bạn:**
Bắt đầu cuộc trò chuyện bằng cách chào tôi một cách thân thiện và xác nhận rằng bạn đã sẵn sàng phân tích dữ liệu. Hãy hỏi tôi muốn bắt đầu từ đâu. Ví dụ: "Xin chào! Tôi đã xem qua dữ liệu của kênh '${channelDetails.title}'. Bạn muốn chúng ta bắt đầu phân tích khía cạnh nào đầu tiên?"
    `;
    
    const contextMessage: ChatMessage = { role: 'user', content: initialPrompt };
    const waitingMessage: ChatMessage = { role: 'model', content: "Đang khởi tạo trợ lý AI... Vui lòng chờ." };

    setChatHistory([contextMessage, waitingMessage]);
    setIsBrainstormOpen(true);

    handleAiChat([contextMessage])
        .then(response => {
            const fullHistory: ChatMessage[] = [
                contextMessage,
                { role: 'model', content: response }
            ];
            setChatHistory(fullHistory);
        })
        .catch(err => {
            const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
            setChatHistory([contextMessage, { role: 'model', content: `Rất tiếc, đã xảy ra lỗi khi khởi tạo AI: ${errorMessage}` }]);
        });
  }, [videos, channelDetails, handleAiChat]);


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
                     <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                       <button
                          onClick={() => setIsChannelInfoModalOpen(true)}
                          disabled={!channelDetails}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Thống kê
                        </button>
                         <button
                            onClick={() => setIsHashtagModalOpen(true)}
                            disabled={hashtags.length === 0}
                            className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            Thẻ tag
                          </button>
                          <button
                            onClick={handleBrainstormClick}
                            disabled={videos.length === 0}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Brainstorm Ý tưởng
                          </button>
                          <button
                            onClick={handleChatWithAiClick}
                            disabled={videos.length === 0}
                            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 flex items-center justify-center"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Chat với AI
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
      <BrainstormChat
        isOpen={isBrainstormOpen}
        onClose={() => setIsBrainstormOpen(false)}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        onSendMessage={handleAiChat}
        provider={selectedProvider}
        channelDetails={channelDetails}
      />
      {videos.length > 0 && (
        <>
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