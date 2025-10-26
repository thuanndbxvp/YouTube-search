import React from 'react';
import type { ChannelDetails } from '../types';

interface ChannelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelDetails: ChannelDetails;
}

const formatSubscriberCount = (num: number): string => {
  if (num === 0) return "0";
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
};

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

const getCountryName = (countryCode: string | undefined): string => {
    if (!countryCode) return '';
    try {
        const regionNames = new Intl.DisplayNames(['vi'], { type: 'region' });
        return regionNames.of(countryCode) || countryCode;
    } catch (e) {
        return countryCode;
    }
}

const InfoRow: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center text-gray-300 text-sm">
    <div className="w-6 h-6 flex-shrink-0 mr-4 flex items-center justify-center text-gray-400">{icon}</div>
    <div>{children}</div>
  </div>
);

export const ChannelInfoModal: React.FC<ChannelInfoModalProps> = ({ isOpen, onClose, channelDetails }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 flex flex-col max-h-[90vh] transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold text-white">{channelDetails.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 text-gray-300 whitespace-pre-wrap text-base leading-relaxed">
          {channelDetails.description || <p className="italic text-gray-500">Kênh này không có mô tả.</p>}
        </div>
        
        <div className="pt-6 mt-6 border-t border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Thông tin khác</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
             {channelDetails.customUrl && (
                <InfoRow icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                }>
                    <a href={`https://www.youtube.com/${channelDetails.customUrl}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                        www.youtube.com/{channelDetails.customUrl}
                    </a>
                </InfoRow>
             )}
             {channelDetails.country && (
                 <InfoRow icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.586-.586a2 2 0 012.828 0l2 2a2 2 0 010 2.828l-5.414 5.414a2 2 0 01-2.828 0L4.293 9.707a2 2 0 010-2.828l.586-.586a2 2 0 012.828 0z" />
                    </svg>
                 }>
                    {getCountryName(channelDetails.country)}
                 </InfoRow>
             )}
              <InfoRow icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }>
                Đã tham gia {formatDate(channelDetails.publishedAt)}
              </InfoRow>
              <InfoRow icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm-1.559 5.06a4.5 4.5 0 00-2.882 0C3.125 11.535 1.5 13.14 1.5 15.17V16a1 1 0 001 1h8a1 1 0 001-1v-.83c0-2.03-1.625-3.635-2.941-4.11zM16.5 6a3 3 0 100-6 3 3 0 000 6zM18 8.25a4.5 4.5 0 00-4.5 4.5V16a1 1 0 001 1h2.5a1 1 0 001-1v-3.25a4.5 4.5 0 00-4.5-4.5h-1.5z" />
                </svg>
              }>
                {formatSubscriberCount(channelDetails.subscriberCount)} người đăng ký
              </InfoRow>
              <InfoRow icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8H5v-2h10v2z" clipRule="evenodd" />
                </svg>
              }>
                {channelDetails.videoCount.toLocaleString('vi-VN')} video
              </InfoRow>
          </div>
        </div>
      </div>
    </div>
  );
};