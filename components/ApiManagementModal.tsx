import React, { useState, useEffect } from 'react';
import type { ApiKey } from '../types';
import { validateYoutubeApiKey, validateGeminiApiKey, validateOpenaiApiKey } from '../services/apiValidationService';

interface ApiManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeApiKeys: ApiKey[];
  setYoutubeApiKeys: (keys: ApiKey[]) => void;
  activeYoutubeKeyId: string | null;
  setActiveYoutubeKeyId: (id: string | null) => void;
  geminiApiKeys: ApiKey[];
  setGeminiApiKeys: (keys: ApiKey[]) => void;
  activeGeminiKeyId: string | null;
  setActiveGeminiKeyId: (id: string | null) => void;
  openaiApiKeys: ApiKey[];
  setOpenaiApiKeys: (keys: ApiKey[]) => void;
  activeOpenaiKeyId: string | null;
  setActiveOpenaiKeyId: (id: string | null) => void;
  selectedGeminiModel: string;
  setSelectedGeminiModel: (model: string) => void;
  selectedOpenaiModel: string;
  setSelectedOpenaiModel: (model: string) => void;
}

const maskApiKey = (key: string): string => {
  if (key.length <= 8) {
    return '****';
  }
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

const StatusIcon: React.FC<{ status: ApiKey['status'] }> = ({ status }) => {
    if (status === 'valid') {
        return <span title="Hợp lệ" className="text-green-400">✓</span>;
    }
    if (status === 'invalid') {
        return <span title="Không hợp lệ" className="text-red-400">✗</span>;
    }
    return <span title="Chưa kiểm tra" className="text-gray-400">?</span>;
};

const ApiKeySection: React.FC<{
    title: string;
    serviceColor: string;
    keys: ApiKey[];
    setKeys: (keys: ApiKey[]) => void;
    activeKeyId: string | null;
    setActiveKeyId: (id: string | null) => void;
    validateKey: (key: string) => Promise<boolean>;
    placeholder: string;
    docs: React.ReactNode;
}> = ({ title, serviceColor, keys, setKeys, activeKeyId, setActiveKeyId, validateKey, placeholder, docs }) => {
    const [newKey, setNewKey] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddKey = async () => {
        if (!newKey.trim()) return;
        if (keys.some(k => k.key === newKey)) {
            setError("API Key này đã tồn tại.");
            return;
        }
        setError(null);
        setIsChecking(true);
        const isValid = await validateKey(newKey);
        const newApiKey: ApiKey = {
            id: `${title}-${Date.now()}`,
            key: newKey,
            status: isValid ? 'valid' : 'invalid',
        };
        const updatedKeys = [...keys, newApiKey];
        setKeys(updatedKeys);
        
        if (isValid && !updatedKeys.find(k => k.id === activeKeyId && k.status === 'valid')) {
            setActiveKeyId(newApiKey.id);
        }
        setNewKey('');
        setIsChecking(false);
    };

    const handleDeleteKey = (idToDelete: string) => {
        const updatedKeys = keys.filter(k => k.id !== idToDelete);
        setKeys(updatedKeys);
        if (activeKeyId === idToDelete) {
            const nextValidKey = updatedKeys.find(k => k.status === 'valid');
            setActiveKeyId(nextValidKey?.id ?? null);
        }
    };
    
    return (
        <div className="mb-6">
            <h3 className={`text-lg font-semibold text-${serviceColor}-400 mb-2`}>{title}</h3>
            <div className="space-y-3">
                <div>
                    <label htmlFor={`${title}-key-input`} className="block text-sm font-medium text-gray-300 mb-1">Thêm API Key mới</label>
                    <div className="flex items-center gap-2">
                        <input
                            id={`${title}-key-input`}
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-gray-700 text-white placeholder-gray-500 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                         <button onClick={handleAddKey} disabled={isChecking || !newKey.trim()} className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-wait`}>
                            {isChecking ? 'Đang...' : 'Thêm'}
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
                </div>
                {keys.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {keys.map(apiKey => (
                             <div key={apiKey.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name={`${title}-active-key`}
                                        id={apiKey.id}
                                        checked={apiKey.id === activeKeyId}
                                        onChange={() => setActiveKeyId(apiKey.id)}
                                        className="form-radio h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                        disabled={apiKey.status !== 'valid'}
                                    />
                                    <label htmlFor={apiKey.id} className={`font-mono text-sm ${apiKey.status !== 'valid' ? 'text-gray-500' : 'text-gray-200'}`}>
                                       {maskApiKey(apiKey.key)}
                                    </label>
                                    <StatusIcon status={apiKey.status} />
                                </div>
                                <button onClick={() => handleDeleteKey(apiKey.id)} className="text-gray-400 hover:text-red-500 p-1" aria-label={`Xóa key ${maskApiKey(apiKey.key)}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {docs}
            </div>
        </div>
    );
}

export const ApiManagementModal: React.FC<ApiManagementModalProps> = ({
  isOpen, onClose,
  youtubeApiKeys, setYoutubeApiKeys, activeYoutubeKeyId, setActiveYoutubeKeyId,
  geminiApiKeys, setGeminiApiKeys, activeGeminiKeyId, setActiveGeminiKeyId,
  openaiApiKeys, setOpenaiApiKeys, activeOpenaiKeyId, setActiveOpenaiKeyId,
  selectedGeminiModel, setSelectedGeminiModel,
  selectedOpenaiModel, setSelectedOpenaiModel,
}) => {
  const [localYoutubeKeys, setLocalYoutubeKeys] = useState<ApiKey[]>([]);
  const [localActiveYoutubeKeyId, setLocalActiveYoutubeKeyId] = useState<string | null>(null);
  const [localGeminiKeys, setLocalGeminiKeys] = useState<ApiKey[]>([]);
  const [localActiveGeminiKeyId, setLocalActiveGeminiKeyId] = useState<string | null>(null);
  const [localOpenaiKeys, setLocalOpenaiKeys] = useState<ApiKey[]>([]);
  const [localActiveOpenaiKeyId, setLocalActiveOpenaiKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalYoutubeKeys(youtubeApiKeys);
      setLocalActiveYoutubeKeyId(activeYoutubeKeyId);
      setLocalGeminiKeys(geminiApiKeys);
      setLocalActiveGeminiKeyId(activeGeminiKeyId);
      setLocalOpenaiKeys(openaiApiKeys);
      setLocalActiveOpenaiKeyId(activeOpenaiKeyId);
    }
  }, [isOpen, youtubeApiKeys, activeYoutubeKeyId, geminiApiKeys, activeGeminiKeyId, openaiApiKeys, activeOpenaiKeyId]);

  if (!isOpen) return null;

  const handleSave = () => {
    setYoutubeApiKeys(localYoutubeKeys);
    setActiveYoutubeKeyId(localActiveYoutubeKeyId);
    setGeminiApiKeys(localGeminiKeys);
    setActiveGeminiKeyId(localActiveGeminiKeyId);
    setOpenaiApiKeys(localOpenaiKeys);
    setActiveOpenaiKeyId(localActiveOpenaiKeyId);

    const allKeysData = {
        youtube: { keys: localYoutubeKeys, activeKeyId: localActiveYoutubeKeyId },
        gemini: { keys: localGeminiKeys, activeKeyId: localActiveGeminiKeyId },
        openai: { keys: localOpenaiKeys, activeKeyId: localActiveOpenaiKeyId },
    };
    localStorage.setItem('youtube-analyzer-api-keys', JSON.stringify(allKeysData));
    
    localStorage.setItem('selectedGeminiModel', selectedGeminiModel);
    localStorage.setItem('selectedOpenaiModel', selectedOpenaiModel);
    
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity"
        onClick={onClose} aria-modal="true" role="dialog"
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 transform transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Quản lý API Keys</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="overflow-y-auto pr-2 flex-grow">
            <ApiKeySection
                title="YouTube Data API (Bắt buộc)"
                serviceColor="red"
                keys={localYoutubeKeys}
                setKeys={setLocalYoutubeKeys}
                activeKeyId={localActiveYoutubeKeyId}
                setActiveKeyId={setLocalActiveYoutubeKeyId}
                validateKey={validateYoutubeApiKey}
                placeholder="Dán API Key của bạn vào đây"
                docs={
                     <details className="text-sm text-gray-400 mt-2">
                        <summary className="cursor-pointer hover:text-white">Làm thế nào để lấy API Key?</summary>
                        <div className="mt-2 pl-4 border-l-2 border-gray-600 space-y-1">
                            <p>1. Truy cập <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>.</p>
                            <p>2. Tạo một dự án mới (hoặc chọn một dự án có sẵn).</p>
                            <p>3. Vào mục "APIs & Services" &rarr; "Library".</p>
                            <p>4. Tìm và kích hoạt (Enable) <strong>"YouTube Data API v3"</strong>.</p>
                            <p>5. Vào mục "Credentials", nhấp vào "Create Credentials" và chọn "API key".</p>
                            <p>6. Sao chép API key vừa tạo và dán vào ô ở trên.</p>
                        </div>
                    </details>
                }
            />

            <ApiKeySection
                title="Google Gemini"
                serviceColor="purple"
                keys={localGeminiKeys}
                setKeys={setLocalGeminiKeys}
                activeKeyId={localActiveGeminiKeyId}
                setActiveKeyId={setLocalActiveGeminiKeyId}
                validateKey={validateGeminiApiKey}
                placeholder="Dán API Key của bạn vào đây"
                docs={<></>}
            />
             <div>
                <label htmlFor="gemini-model" className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                <select id="gemini-model" value={selectedGeminiModel} onChange={e => setSelectedGeminiModel(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyến nghị)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
            </div>
             <div className="my-6 border-t border-gray-700"></div>

            <ApiKeySection
                title="OpenAI"
                serviceColor="blue"
                keys={localOpenaiKeys}
                setKeys={setLocalOpenaiKeys}
                activeKeyId={localActiveOpenaiKeyId}
                setActiveKeyId={setLocalActiveOpenaiKeyId}
                validateKey={validateOpenaiApiKey}
                placeholder="Dán API Key của bạn vào đây (vd: sk-...)"
                docs={<></>}
            />
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

        <div className="flex justify-end pt-4 border-t border-gray-700 mt-4 flex-shrink-0">
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