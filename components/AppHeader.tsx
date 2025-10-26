import React from 'react';

interface AppHeaderProps {
  onOpenApiModal: () => void;
  onOpenLibraryModal: () => void;
  onSaveSession: () => void;
  isSaveDisabled: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenApiModal, onOpenLibraryModal, onSaveSession, isSaveDisabled }) => (
  <div className="text-center mb-8 relative">
    <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
      Trình phân tích kênh YouTube
    </h1>
    <p className="text-lg text-gray-400 mt-2">
      Nhận thông tin chi tiết và tóm tắt do AI tạo ra cho các video gần đây nhất.
    </p>
    <div className="absolute top-0 right-0 flex items-center space-x-2">
        <button 
            onClick={onSaveSession}
            disabled={isSaveDisabled}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
            aria-label="Lưu phiên làm việc"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12l-5-3.125L5 16V4z" />
            </svg>
            <span className="hidden md:inline">Lưu phiên</span>
        </button>
        <button 
          onClick={onOpenLibraryModal}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 flex items-center"
          aria-label="Mở thư viện"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
           <span className="hidden md:inline">Thư viện</span>
        </button>
        <button 
          onClick={onOpenApiModal}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
          aria-label="Quản lý khóa API"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2l1-1 1-1-1.257-1.257A6 6 0 1118 8zm-6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
          </svg>
          <span className="hidden md:inline">API</span>
        </button>
    </div>
  </div>
);