"use client";

import { useState, useCallback, useEffect } from 'react';

export interface ActionItem {
  id: number;
  transcriptId: number;
  taskDescription: string;
  owner: string | null;
  dueDate: string | null;
  isDone: boolean;
  tags: string[];
}

export interface HistoryItem {
  id: number;
  preview_text: string;
  created_at: string;
  action_item_count: number;
}

// Ensure this matches your Express port
const API_BASE_URL = 'http://localhost:5000/api'; 

export const useActionItems = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentItems, setCurrentItems] = useState<ActionItem[]>([]);
  const [activeTranscriptId, setActiveTranscriptId] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const json = await res.json();
      setHistory(json.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const processTranscript = async (transcriptText: string) => {
    setIsLoading(true); setError(null);
    try {
      // UPDATED: processTranscript (camelCase)
      const res = await fetch(`${API_BASE_URL}/processTranscript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to process transcript');
      setCurrentItems(json.data);
      setActiveTranscriptId(json.transcript_id);
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTranscriptItems = async (transcriptId: number) => {
    setIsLoading(true); setError(null);
    try {
      // UPDATED: transcript/:id (singular)
      const res = await fetch(`${API_BASE_URL}/transcript/${transcriptId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load items');
      setCurrentItems(json.data);
      setActiveTranscriptId(transcriptId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: number, updates: Partial<ActionItem>) => {
    setCurrentItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    try {
      // UPDATED: We now map exactly to your new Zod camelCase schema.
      // We explicitly pull these out so we don't accidentally send 'id' or 'transcriptId'
      // which would trigger your strict() Zod validation to fail.
      const apiUpdates: any = {};
      if (updates.taskDescription !== undefined) apiUpdates.taskDescription = updates.taskDescription;
      if (updates.owner !== undefined) apiUpdates.owner = updates.owner;
      if (updates.dueDate !== undefined) apiUpdates.dueDate = updates.dueDate;
      if (updates.isDone !== undefined) apiUpdates.isDone = updates.isDone;
      if (updates.tags !== undefined) apiUpdates.tags = updates.tags;

      const res = await fetch(`${API_BASE_URL}/action-items/${itemId}`, {
        method: 'PATCH', // UPDATED: Changed from PUT to PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiUpdates),
      });
      if (!res.ok) throw new Error('Failed to update item');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteItem = async (itemId: number) => {
    setCurrentItems(prev => prev.filter(item => item.id !== itemId));
    try {
      const res = await fetch(`${API_BASE_URL}/action-items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      fetchHistory(); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { history, currentItems, activeTranscriptId, isLoading, error, processTranscript, loadTranscriptItems, updateItem, deleteItem };
};