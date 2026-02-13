"use client";
import React, { useState } from 'react';

// Added the interface so TypeScript knows the shape of your data
export interface ActionItem {
  id: number;
  transcriptId: number;
  taskDescription: string;
  owner: string | null;
  dueDate: string | null;
  isDone: boolean;
  tags: string[];
}

interface Props { 
  item: ActionItem; 
  onUpdate: (id: number, updates: Partial<ActionItem>) => void; 
  onDelete: (id: number) => void; 
}

export const ActionItemCard: React.FC<Props> = ({ item, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(item.taskDescription);

  const handleSave = () => { 
    onUpdate(item.id, { taskDescription: editedTask }); 
    setIsEditing(false); 
  };

  return (
    <div className={`p-4 mb-3 border rounded-lg shadow-sm transition-all duration-200 ${item.isDone ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:shadow-md'}`}>
      <div className="flex items-start gap-4">
        
        {/* Checkbox */}
        <div className="pt-1">
          <input 
            type="checkbox" 
            checked={item.isDone} 
            onChange={(e) => onUpdate(item.id, { isDone: e.target.checked })} 
            className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer" 
          />
        </div>
        
        {/* Content Area */}
        <div className="flex-1">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea 
                value={editedTask} 
                onChange={(e) => setEditedTask(e.target.value)} 
                className="w-full p-2 border rounded-md text-sm text-black" 
                rows={2} 
              />
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white text-xs rounded">Save</button>
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className={`text-gray-800 font-medium ${item.isDone ? 'line-through text-gray-400' : ''}`}>
                {item.taskDescription}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                {item.owner && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">Assignee: {item.owner}</span>}
                {item.dueDate && <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded font-semibold">Due: {item.dueDate}</span>}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex flex-col gap-2 opacity-0 hover:opacity-100 transition-opacity md:opacity-100">
            <button onClick={() => setIsEditing(true)} className="text-xs text-gray-500 hover:text-blue-600 font-medium">Edit</button>
            <button onClick={() => onDelete(item.id)} className="text-xs text-gray-500 hover:text-red-600 font-medium">Delete</button>
          </div>
        )}
        
      </div>
    </div>
  );
};