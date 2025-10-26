import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { VideoData, AiProvider, SortKey, SortOrder } from './types';
import { fetchChannelVideos } from './services/youtubeService';
import { ResultsTable } from './components/ResultsTable';
import { UrlInputForm } from './components/UrlInputForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { AppHeader } from './components/AppHeader';
import { ApiManagementModal } from './components/ApiManagementModal';

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

  // Load API settings from localStorage on initial render
  useEffect(() => {
    setGeminiApiKey(localStorage.getItem('geminiApiKey') || '');
    setOpenaiApiKey(localStorage.getItem('openaiApiKey') || '');
    setYoutubeApiKey(localStorage.getItem('youtubeApiKey') || '');
    setSelectedGeminiModel(localStorage.getItem('selectedGeminiModel') || 'gemini-2.5-flash');
    setSelectedOpenaiModel(localStorage.getItem('selectedOpenaiModel') || 'gpt-3.5-turbo');
    setSelectedProvider((localStorage.getItem('selectedProvider') as AiProvider) || 'gemini');
  }, []);

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

    try {
      const initialVideos = await fetchChannelVideos(channelUrl, youtubeApiKey);
      if (initialVideos.length === 0) {
        setError('Không tìm thấy video nào trên kênh này hoặc kênh không tồn tại.');
        setIsLoading(false);
        return;
      }
      setVideos(initialVideos);
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
  }, [channelUrl, youtubeApiKey]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('desc'); // Luôn bắt đầu bằng sắp xếp giảm dần cho cột mới
    }
  }, [sortKey]);

  const sortedVideos = useMemo(() => {
    if (!videos) return [];
    return [...videos].sort((a, b) => {
        let valA, valB;

        if (sortKey === 'publishedAt') {
            valA = new Date(a.publishedAt).getTime();
            valB = new Date(b.publishedAt).getTime();
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
              <ResultsTable 
                videos={sortedVideos} 
                onSort={handleSort}
                sortKey={sortKey}
                sortOrder={sortOrder}
              />
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
    </div>
  );
};

export default App;