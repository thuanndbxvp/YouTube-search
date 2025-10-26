import React from 'react';
import type { KeywordData } from '../types';

interface KeywordAnalysisProps {
  keywords: KeywordData[];
}

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ keywords }) => {
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
    </div>
  );
};