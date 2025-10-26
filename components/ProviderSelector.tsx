import React from 'react';
import type { AiProvider } from '../types';

interface ProviderSelectorProps {
  selectedProvider: AiProvider;
  setSelectedProvider: (provider: AiProvider) => void;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ selectedProvider, setSelectedProvider }) => {
  const handleProviderChange = (provider: AiProvider) => {
    setSelectedProvider(provider);
    localStorage.setItem('selectedProvider', provider);
  };
  
  const baseClasses = "px-6 py-2 text-sm font-medium rounded-md cursor-pointer transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const activeClasses = "bg-blue-600 text-white shadow-lg";
  const inactiveClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";

  return (
    <div className="flex justify-center items-center mb-4">
      <div className="flex items-center p-1 space-x-2 bg-gray-800 rounded-lg">
        <label className="relative">
          <input
            type="radio"
            name="provider"
            value="gemini"
            checked={selectedProvider === 'gemini'}
            onChange={() => handleProviderChange('gemini')}
            className="absolute opacity-0 w-0 h-0"
          />
          <span className={`${baseClasses} ${selectedProvider === 'gemini' ? activeClasses : inactiveClasses}`}>
            Gemini
          </span>
        </label>
        <label className="relative">
          <input
            type="radio"
            name="provider"
            value="openai"
            checked={selectedProvider === 'openai'}
            onChange={() => handleProviderChange('openai')}
            className="absolute opacity-0 w-0 h-0"
          />
          <span className={`${baseClasses} ${selectedProvider === 'openai' ? activeClasses : inactiveClasses}`}>
            OpenAI
          </span>
        </label>
      </div>
    </div>
  );
};
