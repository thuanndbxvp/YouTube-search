
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="max-w-2xl mx-auto mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-center">
    <p>{message}</p>
  </div>
);
