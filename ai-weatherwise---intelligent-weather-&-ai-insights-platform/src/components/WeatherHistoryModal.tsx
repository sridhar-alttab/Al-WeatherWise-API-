import React, { useState, useEffect } from 'react';
import { X, History, Trash2, MapPin, RefreshCw } from 'lucide-react';
import { WeatherHistoryItem } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface WeatherHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

export const WeatherHistoryModal: React.FC<WeatherHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
}) => {
  const [history, setHistory] = useState<WeatherHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.getWeatherHistory();
      if (data?.history) {
        setHistory(data.history);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteItem = async (id: string) => {
    await api.deleteWeatherHistoryItem(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = async () => {
    if (confirm('Clear all weather search history?')) {
      await api.clearWeatherHistory();
      setHistory([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Weather Search History</h2>
              <p className="text-xs text-slate-400">
                Logged searches and historical condition snapshots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No search history recorded yet. Search cities while logged in to build your weather diary.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/40 px-3 rounded-xl transition-colors group"
                >
                  <div
                    onClick={() => {
                      onSelectCity(item.city);
                      onClose();
                    }}
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {item.city}
                      </span>
                      <span className="text-xs text-slate-400">({item.country})</span>
                      <span className="text-xs font-semibold text-cyan-300 ml-2">
                        {item.tempC}°C
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                      <span>Condition: {item.condition}</span>
                      <span>Humidity: {item.humidity}%</span>
                      <span>Wind: {item.windSpeedKmh} km/h</span>
                      <span className="text-slate-400">
                        {new Date(item.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
