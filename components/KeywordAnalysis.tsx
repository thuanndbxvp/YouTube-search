import React from 'react';
import type { KeywordData } from '../types';

interface KeywordAnalysisProps {
  keywords: KeywordData[];
}

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ keywords }) => {
  if (keywords.length === 0) {
    return null;
  }

  const handleDownloadCsv = () => {
    let csvContent = "STT,Key,Số lần hiển thị\n";
    keywords.forEach((keyword, index) => {
      // Escape double quotes by replacing them with two double quotes
      const escapedText = keyword.text.replace(/"/g, '""');
      csvContent += `${index + 1},"${escapedText}",${keyword.count}\n`;
    });

    // Use BOM for Excel to recognize UTF-8 correctly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "tu-khoa-noi-bat.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 011.414-1.414L10 14.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Từ khóa nổi bật nhất trong Tiêu đề
        </h3>
        <button
          onClick={handleDownloadCsv}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
          title="Tải về file Excel (.csv)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="ml-2 hidden sm:inline">Tải về Excel</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map(({ text, count }) => (
          <div key={text} className="flex items-center bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
            <span className="font-bold text-white mr-1.5">{count}x</span>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};