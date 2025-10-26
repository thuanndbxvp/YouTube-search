import React, { useCallback } from 'react';
import type { KeywordData, ChannelDetails, VideoData } from '../types';

interface KeywordAnalysisProps {
  keywords: KeywordData[];
  channelDetails: ChannelDetails | null;
  videos: VideoData[];
}

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ keywords, channelDetails, videos }) => {
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

    const handleDownloadVideosCsv = useCallback(() => {
        if (videos.length === 0) return;

        const channelName = channelDetails?.title.replace(/[^a-zA-Z0-9]/g, '_') || 'channel';
        const filename = `danh-sach-video-${channelName}.csv`;

        const formatDateForCsv = (dateString: string): string => {
            return new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(new Date(dateString));
        };

        const escapeCsvField = (field: string | number | null | undefined): string => {
            if (field === null || field === undefined) {
                return '';
            }
            const str = String(field);
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
                const escapedStr = str.replace(/"/g, '""');
                return `"${escapedStr}"`;
            }
            return str;
        };
        
        const headers = ['STT', 'Tiêu đề', 'Mô tả', 'Ngày đăng', 'Lượt xem', 'Lượt thích', 'Thời lượng', 'Link'];
        let csvContent = headers.join(';') + '\n';

        videos.forEach((video, index) => {
            const row = [
                index + 1,
                video.title,
                video.description,
                formatDateForCsv(video.publishedAt),
                video.views,
                video.likes,
                video.duration,
                `https://www.youtube.com/watch?v=${video.id}`
            ];
            csvContent += row.map(escapeCsvField).join(';') + '\n';
        });

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [videos, channelDetails]);


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
      <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleDownloadKeywordsCsv}
            disabled={keywords.length === 0}
            className="bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Tải về Từ khóa (.csv)
          </button>
           <button
            onClick={handleDownloadVideosCsv}
            disabled={videos.length === 0}
            className="bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Tải về Video (.csv)
          </button>
      </div>
    </div>
  );
};