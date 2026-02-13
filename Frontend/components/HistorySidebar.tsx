"use client";
import React from 'react';
import Link from 'next/link';
import { HistoryItem } from '../hooks/useActionItems';

interface Props { history: HistoryItem[]; activeId: number | null; onSelect: (id: number) => void; }

export const HistorySidebar: React.FC<Props> = ({ history, activeId, onSelect }) => {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateString));
  };

  if (history.length === 0) return <div className="text-sm text-gray-500 italic p-2">No history yet.</div>;

  return (
    <>

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
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Meeting Tracker</h1>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Recent Transcripts</h3>
          <HistorySidebar history={history} activeId={activeTranscriptId} onSelect={loadTranscriptItems} />
        </div>

        {/* NEW: Status Page Link in the Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <Link
            href="/status"
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            System Status
          </Link>
        </div>
      </aside>
    </>
  );
};