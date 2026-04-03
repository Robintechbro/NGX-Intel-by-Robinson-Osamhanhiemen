import React, { useState } from 'react';
import { 
  X
} from 'lucide-react';
import { StockData } from '../types';

export const TagManager = ({ stock, onAdd, onRemove }: { stock: StockData, onAdd: (tag: string) => void, onRemove: (tag: string) => void }) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-1">
        {(stock.tags || []).map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-400/10 text-blue-400 text-[10px] font-bold rounded-md border border-blue-400/20">
            {tag}
            <button onClick={() => onRemove(tag)} className="hover:text-red-400">
              <X size={10} />
            </button>
          </span>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-1">
            <input 
              autoFocus
              type="text" 
              className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] focus:outline-none focus:border-blue-400/50 w-20"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAdd(newTag);
                  setNewTag('');
                  setIsAdding(false);
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                }
              }}
              onBlur={() => {
                if (!newTag) setIsAdding(false);
              }}
            />
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-2 py-0.5 bg-white/5 text-gray-500 text-[10px] font-bold rounded-md border border-dashed border-white/10 hover:border-white/20 hover:text-gray-300"
          >
            + Add Tag
          </button>
        )}
      </div>
    </div>
  );
};
