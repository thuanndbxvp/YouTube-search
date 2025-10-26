import React, { useState, useEffect } from 'react';
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
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = hashtags.map(h => h.text).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
  };

  const handleDownloadTxt = () => {
    const textToSave = hashtags.map(h => h.text).join('\n');
    const blob = new Blob([textToSave], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hashtags.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-700 mt-4 gap-3">
          <div className="flex gap-3">
             <button 
                onClick={handleCopy} 
                className={`flex items-center ${isCopied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-md transition-colors duration-300`}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                   <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                   <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
                 </svg>
                {isCopied ? 'Đã sao chép!' : 'Sao chép tất cả'}
              </button>
               <button 
                onClick={handleDownloadTxt} 
                className="flex items-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                Tải về (.txt)
              </button>
          </div>
          <button 
            onClick={onClose} 
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};