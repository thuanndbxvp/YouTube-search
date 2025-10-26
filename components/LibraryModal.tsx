import React from 'react';
import type { Session } from '../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onLoad: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
}

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};


export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, sessions, onLoad, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 flex flex-col max-h-[80vh] transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Thư viện phiên làm việc
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            {sessions.length > 0 ? (
                <ul className="space-y-3">
                    {sessions.sort((a,b) => b.id - a.id).map((session) => (
                        <li key={session.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-700/50 p-4 rounded-lg">
                            <div>
                                <h3 className="font-bold text-lg text-white">{session.name}</h3>
                                <p className="text-sm text-gray-400">{session.channelTitle} - {session.videoCount} videos</p>
                                <p className="text-xs text-gray-500 mt-1">Lưu lúc: {formatDate(session.createdAt)}</p>
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-0 flex-shrink-0">
                                <button onClick={() => onLoad(session.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm">Tải</button>
                                <button onClick={() => onDelete(session.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm">Xóa</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-gray-400 py-12">
                    <p>Chưa có phiên làm việc nào được lưu.</p>
                    <p className="text-sm mt-2">Hãy phân tích một kênh và nhấn "Lưu phiên" để bắt đầu.</p>
                </div>
            )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
          <button 
            onClick={onClose} 
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};