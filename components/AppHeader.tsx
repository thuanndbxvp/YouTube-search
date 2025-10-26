import React from 'react';

interface AppHeaderProps {
  onOpenApiModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenApiModal }) => (
  <div className="text-center mb-8 relative">
    <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
      Trình phân tích kênh YouTube
    </h1>
    <p className="text-lg text-gray-400 mt-2">
      Nhận thông tin chi tiết và tóm tắt do AI tạo ra cho các video gần đây nhất.
    </p>
    <div className="absolute top-0 right-0">
        <button 
          onClick={onOpenApiModal}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Quản lý khóa API"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-1.257A6 6 0 1118 8zm-6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
          </svg>
          Quản lý API
        </button>
    </div>
  </div>
);