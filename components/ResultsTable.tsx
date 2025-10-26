import React from 'react';
import type { VideoData } from '../types';

interface ResultsTableProps {
  videos: VideoData[];
}

const StatIcon: React.FC<{ path: string; className?: string }> = ({ path, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1.5 inline-block ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline-block text-blue-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);
const LikeIcon = () => <StatIcon path="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" className="text-pink-400" />;
const DurationIcon = () => <StatIcon path="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" className="text-gray-400" />;

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ videos }) => {
  return (
    <div className="overflow-x-auto bg-gray-800/50 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm mt-4">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-2/5">Tiêu đề Video</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ngày đăng</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Thống kê</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Thời lượng</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hành động</th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {videos.map((video) => (
            <tr key={video.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-white">{video.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-300">{formatDate(video.publishedAt)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col text-sm text-gray-300 space-y-2">
                    <span className="flex items-center"><ViewIcon /> {formatNumber(video.views)}</span>
                    <span className="flex items-center"><LikeIcon /> {formatNumber(video.likes)}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-300">
                    <DurationIcon /> {video.duration}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Đi tới video
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};