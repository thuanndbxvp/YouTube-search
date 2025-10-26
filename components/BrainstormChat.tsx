import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, AiProvider, ChannelDetails } from '../types';

interface BrainstormChatProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onSendMessage: (history: ChatMessage[]) => Promise<string>;
  provider: AiProvider;
  channelDetails: ChannelDetails | null;
}

export const BrainstormChat: React.FC<BrainstormChatProps> = ({
  isOpen,
  onClose,
  chatHistory,
  setChatHistory,
  onSendMessage,
  provider,
  channelDetails,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For user-sent messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatHistory]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
        const response = await onSendMessage(newHistory);
        setChatHistory([...newHistory, { role: 'model', content: response }]);
    } catch(err) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
        setChatHistory([...newHistory, { role: 'model', content: `Rất tiếc, tôi không thể trả lời lúc này: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownloadChat = useCallback(() => {
    if (chatHistory.length === 0) return;

    const providerName = provider === 'gemini' ? 'Gemini' : 'OpenAI';
    const channelName = channelDetails?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown-channel';
    const date = new Intl.DateTimeFormat('sv-SE').format(new Date()).replace(/ /g, '_');
    const filename = `brainstorm-${channelName}-${date}.txt`;

    let content = `--- Brainstorm Session with ${providerName} ---\n`;
    content += `Channel: ${channelDetails?.title || 'N/A'}\n`;
    content += `Date: ${new Date().toLocaleString('vi-VN')}\n\n`;

    chatHistory.forEach(msg => {
        const prefix = msg.role === 'user' ? '[BẠN]' : '[AI]';
        content += `${prefix}:\n${msg.content}\n\n--------------------------------\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [chatHistory, provider, channelDetails]);
  
  const providerName = provider === 'gemini' ? 'Gemini' : 'OpenAI';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Brainstorm cùng {providerName}
          </h2>
          <div className="flex items-center gap-4">
              <button onClick={handleDownloadChat} className="text-gray-400 hover:text-white" aria-label="Tải về cuộc trò chuyện">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
                 <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                 </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi hoặc ý tưởng của bạn..."
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none px-2"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.894 15V4.106A1 1 0 0010.894 2.553z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};