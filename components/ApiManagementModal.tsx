import React, { useState, useEffect } from 'react';

interface ApiManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;
  selectedGeminiModel: string;
  setSelectedGeminiModel: (model: string) => void;
  selectedOpenaiModel: string;
  setSelectedOpenaiModel: (model: string) => void;
}

export const ApiManagementModal: React.FC<ApiManagementModalProps> = ({
  isOpen,
  onClose,
  geminiApiKey,
  setGeminiApiKey,
  openaiApiKey,
  setOpenaiApiKey,
  selectedGeminiModel,
  setSelectedGeminiModel,
  selectedOpenaiModel,
  setSelectedOpenaiModel,
}) => {
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
  const [localOpenaiKey, setLocalOpenaiKey] = useState(openaiApiKey);

  useEffect(() => {
    setLocalGeminiKey(geminiApiKey);
    setLocalOpenaiKey(openaiApiKey);
  }, [isOpen, geminiApiKey, openaiApiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(localGeminiKey);
    localStorage.setItem('geminiApiKey', localGeminiKey);
    setOpenaiApiKey(localOpenaiKey);
    localStorage.setItem('openaiApiKey', localOpenaiKey);
    
    localStorage.setItem('selectedGeminiModel', selectedGeminiModel);
    localStorage.setItem('selectedOpenaiModel', selectedOpenaiModel);
    
    onClose();
  };
  
  const handleDelete = (provider: 'gemini' | 'openai') => {
      if (provider === 'gemini') {
          setLocalGeminiKey('');
          setGeminiApiKey('');
          localStorage.removeItem('geminiApiKey');
      } else {
          setLocalOpenaiKey('');
          setOpenaiApiKey('');
          localStorage.removeItem('openaiApiKey');
      }
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Quản lý API Keys</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        {/* Gemini Section */}
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Google Gemini</h3>
            <div className="space-y-3">
                <div>
                    <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                    <div className="flex items-center gap-2">
                        <input
                            id="gemini-key"
                            type="password"
                            value={localGeminiKey}
                            onChange={(e) => setLocalGeminiKey(e.target.value)}
                            placeholder="Dán API Key của bạn vào đây"
                            className="w-full bg-gray-700 text-white placeholder-gray-500 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                         <button onClick={() => handleDelete('gemini')} className="text-gray-400 hover:text-red-500 p-2" aria-label="Xóa key Gemini">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="gemini-model" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                    <select id="gemini-model" value={selectedGeminiModel} onChange={e => setSelectedGeminiModel(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyến nghị)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    </select>
                </div>
            </div>
        </div>

        {/* OpenAI Section */}
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">OpenAI</h3>
             <div className="space-y-3">
                <div>
                    <label htmlFor="openai-key" className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                    <div className="flex items-center gap-2">
                        <input
                            id="openai-key"
                            type="password"
                            value={localOpenaiKey}
                            onChange={(e) => setLocalOpenaiKey(e.target.value)}
                            placeholder="Dán API Key của bạn vào đây (vd: sk-...)"
                            className="w-full bg-gray-700 text-white placeholder-gray-500 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                         <button onClick={() => handleDelete('openai')} className="text-gray-400 hover:text-red-500 p-2" aria-label="Xóa key OpenAI">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="openai-model" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                    <select id="openai-model" value={selectedOpenaiModel} onChange={e => setSelectedOpenaiModel(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Nhanh, Rẻ)</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo (Khuyến nghị)</option>
                        <option value="gpt-4o">GPT-4o (Mới nhất)</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
          >
            Lưu và Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
