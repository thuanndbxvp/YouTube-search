import React from 'react';
import type { HashtagData } from '../types';

interface HashtagModalProps {
  isOpen: boolean;
  onClose: () => void;
  hashtags: HashtagData[];
}

export const HashtagModal: React.FC<HashtagModalProps> = ({
  isOpen,
  onClose,
  hashtags,
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 flex flex-col max-h-[80vh] transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Hashtag được sử dụng
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
            {hashtags.length > 0 ? (
                <ul className="space-y-2">
                    {hashtags.map(({ text, count }) => (
                        <li key={text} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                            <span className="font-mono text-blue-400 text-sm break-all">{text}</span>
                            <span className="text-sm font-bold text-white bg-gray-600 px-2.5 py-1 rounded-full flex-shrink-0 ml-4">{count}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-gray-400 py-8">
                    <p>Không tìm thấy hashtag nào trong mô tả của các video đã được phân tích.</p>
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