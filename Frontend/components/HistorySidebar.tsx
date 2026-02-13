"use client";
import React from 'react';
import { HistoryItem } from '../hooks/useActionItems';

interface Props { history: HistoryItem[]; activeId: number | null; onSelect: (id: number) => void; }

export const HistorySidebar: React.FC<Props> = ({ history, activeId, onSelect }) => {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateString));
  };

  if (history.length === 0) return <div className="text-sm text-gray-500 italic p-2">No history yet.</div>;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {history.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${activeId === item.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{formatDate(item.created_at)}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.action_item_count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {item.action_item_count} task{item.action_item_count !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">"{item.preview_text}"</p>
        </button>
      ))}
    </div>
  );
};