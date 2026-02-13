"use client";
import React from 'react';
import { ActionItem } from '../hooks/useActionItems';
import { ActionItemCard } from './ActionItemCard';

interface Props { items: ActionItem[]; onUpdate: (id: number, updates: Partial<ActionItem>) => void; onDelete: (id: number) => void; }

export const ActionItemList: React.FC<Props> = ({ items, onUpdate, onDelete }) => {
  if (items.length === 0) return null;
  const sortedItems = [...items].sort((a, b) => Number(a.isDone) - Number(b.isDone));

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Action Items <span className="text-gray-400 text-lg font-normal">({items.length})</span></h2>
      <div className="flex flex-col gap-2">
        {sortedItems.map((item) => <ActionItemCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />)}
      </div>
    </div>
  );
};