"use client";
import React, { useState } from 'react';

interface Props { onSubmit: (text: string) => void; isLoading: boolean; }

export const TranscriptInput: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) return;
    onSubmit(text);
    setText('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Extract Action Items</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono text-sm text-black"
          placeholder="Paste your meeting transcript here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || text.trim().length === 0}
            className={`px-6 py-2 rounded-md font-medium text-white transition-colors duration-200 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Processing AI...' : 'Generate Action Items'}
          </button>
        </div>
      </form>
    </div>
  );
};