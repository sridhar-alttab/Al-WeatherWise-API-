import React, { useState } from 'react';
import { X, Bookmark, Plus, Pin, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { FavoriteLocation } from '../types/index.js';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteLocation[];
  onSelectCity: (city: string) => void;
  onAddFavorite: (city: string, notes?: string) => Promise<void>;
  onDeleteFavorite: (id: string) => Promise<void>;
  onTogglePin: (id: string, pinned: boolean) => Promise<void>;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onSelectCity,
  onAddFavorite,
  onDeleteFavorite,
  onTogglePin,
}) => {
  const [newCity, setNewCity] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) return;
    setIsAdding(true);
    try {
      await onAddFavorite(newCity.trim(), notes.trim());
      setNewCity('');
      setNotes('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Favorite Locations</h2>
              <p className="text-xs text-slate-400">Quick access to your monitored cities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add new favorite input */}
        <form onSubmit={handleAddSubmit} className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add city (e.g. Zurich, Kyoto)..."
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!newCity.trim() || isAdding}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          {newCity.trim() && (
            <input
              type="text"
              placeholder="Optional notes (e.g. Office, Vacation home)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none"
            />
          )}
        </form>

        {/* List of favorites */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No favorite cities added yet. Search a city and click &quot;Save City&quot; or use the form above.
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                className="group relative p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => {
                      onSelectCity(fav.city);
                      onClose();
                    }}
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {fav.city}
                      </span>
                      {fav.pinned && (
                        <span className="p-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300">
                          <Pin className="w-2.5 h-2.5 inline" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{fav.country}</span>
                    </div>
                    {fav.notes && (
                      <div className="text-[11px] text-slate-400 mt-2 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 inline-block">
                        {fav.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTogglePin(fav.id, !fav.pinned)}
                      title={fav.pinned ? 'Unpin' : 'Pin to top'}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        fav.pinned
                          ? 'text-cyan-400 bg-cyan-500/10'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectCity(fav.city);
                        onClose();
                      }}
                      title="View weather"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteFavorite(fav.id)}
                      title="Remove favorite"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
