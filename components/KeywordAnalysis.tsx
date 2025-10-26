import React, { useCallback } from 'react';
import type { KeywordData, ChannelDetails } from '../types';

interface KeywordAnalysisProps {
  keywords: KeywordData[];
  channelDetails: ChannelDetails | null;
}

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ keywords, channelDetails }) => {
    const handleDownloadKeywordsCsv = useCallback(() => {
        if (keywords.length === 0) return;

        const channelName = channelDetails?.title.replace(/[^a-zA-Z0-9]/g, '_') || 'channel';
        const filename = `tu-khoa-noi-bat-${channelName}.csv`;
        
        // Use semicolon as delimiter for better Excel compatibility
        let csvContent = "STT;Key;Số lần hiển thị\n"; 
        keywords.forEach((keyword, index) => {
          // Escape double quotes by replacing them with two double quotes
          const escapedText = keyword.text.replace(/"/g, '""');
          csvContent += `${index + 1};"${escapedText}";${keyword.count}\n`;
        });

        // Use BOM for Excel to recognize UTF-8 correctly
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [keywords, channelDetails]);


  if (keywords.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 011.414-1.414L10 14.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Từ khóa nổi bật nhất trong Tiêu đề
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map(({ text, count }) => (
          <div key={text} className="flex items-center bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
            <span className="font-bold text-white mr-1.5">{count}x</span>
            {text}
          </div>
        ))}
      </div>
      <div className="mt-4">
          <button
            onClick={handleDownloadKeywordsCsv}
            disabled={keywords.length === 0}
            className="bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Tải về (.csv)
          </button>
      </div>
    </div>
  );
};