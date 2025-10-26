import React, { useState, useCallback, useEffect } from 'react';
import type { VideoData, AiProvider } from './types';
import { generateVideoSummary as generateGeminiSummary } from './services/geminiService';
import { generateVideoSummary as generateOpenAISummary } from './services/openaiService';
import { fetchChannelVideos } from './services/youtubeService';
import { ResultsTable } from './components/ResultsTable';
import { UrlInputForm } from './components/UrlInputForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { AppHeader } from './components/AppHeader';
import { ApiManagementModal } from './components/ApiManagementModal';
import { ProviderSelector } from './components/ProviderSelector';

const App: React.FC = () => {
  const [channelUrl, setChannelUrl] = useState<string>('');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    if (selectedProvider === 'gemini' && !geminiApiKey) {
      setError('Vui lòng nhập API Key của Gemini. Nhấp vào nút "Quản lý API" ở góc trên.');
      return;
    }
    if (selectedProvider === 'openai' && !openaiApiKey) {
      setError('Vui lòng nhập API Key của OpenAI. Nhấp vào nút "Quản lý API" ở góc trên.');
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
      
      const summaryGenerator = selectedProvider === 'gemini' 
        ? (title: string) => generateGeminiSummary(title, geminiApiKey, selectedGeminiModel)
        : (title: string) => generateOpenAISummary(title, openaiApiKey, selectedOpenaiModel);

      for (const videoToSummarize of initialVideos) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const summary = await summaryGenerator(videoToSummarize.title);

          setVideos(currentVideos =>
            currentVideos.map(video =>
              video.id === videoToSummarize.id ? { ...video, summary } : video
            )
          );
        } catch (summaryError) {
          console.error(`Error summarizing video "${videoToSummarize.title}":`, summaryError);
          const errorMessage = summaryError instanceof Error ? summaryError.message : 'Lỗi không xác định.';
          setVideos(currentVideos =>
            currentVideos.map(video =>
              video.id === videoToSummarize.id ? { ...video, summary: `Lỗi: ${errorMessage}` } : video
            )
          );
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.';
      setError(`Không thể phân tích kênh: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [channelUrl, youtubeApiKey, selectedProvider, geminiApiKey, openaiApiKey, selectedGeminiModel, selectedOpenaiModel]);

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
              <ProviderSelector
                selectedProvider={selectedProvider}
                setSelectedProvider={setSelectedProvider}
              />
              <ResultsTable videos={videos} />
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