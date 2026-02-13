"use client";

import React from 'react';
import { useActionItems } from '@/hooks/useActionItems';
import { TranscriptInput } from '@/components/TranscriptInput';
import { ActionItemList } from '@/components/ActionItemList';
import { HistorySidebar } from '@/components/HistorySidebar';

export default function MeetingTrackerPage() {
  const { 
    processTranscript, isLoading, error, currentItems, history, 
    activeTranscriptId, loadTranscriptItems, updateItem, deleteItem 
  } = useActionItems();

  return (
    <div className="min-h-screen bg-gray-50 flex text-black">
      
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Meeting Tracker</h1>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Recent Transcripts</h3>
          <HistorySidebar history={history} activeId={activeTranscriptId} onSelect={loadTranscriptItems} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p><p className="text-sm">{error}</p>
          </div>
        )}

        <TranscriptInput onSubmit={processTranscript} isLoading={isLoading} />

        <ActionItemList items={currentItems} onUpdate={updateItem} onDelete={deleteItem} />
      </main>
    </div>
  );
}