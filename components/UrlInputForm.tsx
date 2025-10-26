
import React from 'react';

interface UrlInputFormProps {
  channelUrl: string;
  setChannelUrl: (url: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ channelUrl, setChannelUrl, onAnalyze, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg p-2 shadow-lg backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 hidden sm:block" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.267,4,12,4,12,4S5.733,4,4.186,4.418 C3.326,4.648,2.648,5.326,2.418,6.186C2,7.733,2,12,2,12s0,4.267,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.733,20,12,20,12,20s6.267,0,7.814-0.418c0.86-0.23,1.538-0.908,1.768-1.768C22,16.267,22,12,22,12S22,7.733,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
        </svg>
        <input
          type="text"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="Dán link kênh YouTube vào đây..."
          className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none px-3 py-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {isLoading ? 'Đang xử lý...' : 'Phân tích'}
        </button>
      </div>
    </form>
  );
};
