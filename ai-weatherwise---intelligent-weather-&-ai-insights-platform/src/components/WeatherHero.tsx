import React from 'react';
import {
  MapPin,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { CurrentWeather, TemperatureUnit } from '../types/index.js';
import { WeatherIcon } from './WeatherIcon.js';

interface WeatherHeroProps {
  current: CurrentWeather;
  highC: number;
  lowC: number;
  tempUnit: TemperatureUnit;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRefreshWeather: () => void;
  onFocusAi: () => void;
  isLoading: boolean;
}

export const WeatherHero: React.FC<WeatherHeroProps> = ({
  current,
  highC,
  lowC,
  tempUnit,
  isFavorite,
  onToggleFavorite,
  onRefreshWeather,
  onFocusAi,
  isLoading,
}) => {
  const isF = tempUnit === 'fahrenheit';
  const displayTemp = isF ? current.tempF : current.tempC;
  const displayFeelsLike = isF ? current.feelsLikeF : current.feelsLikeC;
  const displayHigh = isF ? Math.round((highC * 9) / 5 + 32) : highC;
  const displayLow = isF ? Math.round((lowC * 9) / 5 + 32) : lowC;
  const unitSymbol = isF ? '°F' : '°C';

  // Atmospheric gradient based on weather condition
  const getAtmosphereGradient = () => {
    const c = current.condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) {
      return 'from-blue-950/60 via-slate-900/90 to-cyan-950/40 border-blue-500/20 shadow-blue-950/30';
    }
    if (c.includes('snow')) {
      return 'from-sky-950/60 via-slate-900/90 to-indigo-950/40 border-sky-400/20 shadow-sky-950/30';
    }
    if (c.includes('clear') || c.includes('sun')) {
      return current.isDay
        ? 'from-amber-950/30 via-slate-900/90 to-cyan-950/30 border-amber-500/20 shadow-amber-950/20'
        : 'from-indigo-950/50 via-slate-900/90 to-slate-950/90 border-indigo-500/20 shadow-indigo-950/30';
    }
    if (c.includes('thunder') || c.includes('lightning')) {
      return 'from-purple-950/60 via-slate-900/90 to-amber-950/30 border-purple-500/30 shadow-purple-950/40';
    }
    return 'from-slate-900/90 via-slate-900/80 to-slate-950/90 border-slate-800 shadow-slate-950/50';
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${getAtmosphereGradient()} border shadow-2xl transition-all duration-500`}
    >
      {/* Decorative atmospheric ambient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Location & Temperature */}
        <div className="space-y-4">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200 backdrop-blur-sm">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {current.city}, {current.country}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              [{current.lat.toFixed(2)}°, {current.lon.toFixed(2)}°]
            </div>

            {/* Provider status badge */}
            {current.source === 'fallback' ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Resilient Fallback Mode
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                {current.source === 'cache' ? 'Cached Live Meteorological Data' : 'Live Real-Time Feed'}
              </span>
            )}
          </div>

          {/* Big Temperature & Condition */}
          <div className="flex items-baseline gap-4">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white">
              {displayTemp}
              <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-cyan-400 align-top ml-1">
                {unitSymbol}
              </span>
            </h1>

            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                <WeatherIcon name={current.conditionIcon} size={28} />
                <span>{current.condition}</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                Feels like <span className="font-semibold text-slate-200">{displayFeelsLike}{unitSymbol}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                <span className="flex items-center text-emerald-400">
                  <ArrowUp className="w-3 h-3 mr-0.5" />
                  {displayHigh}{unitSymbol}
                </span>
                <span className="flex items-center text-sky-400">
                  <ArrowDown className="w-3 h-3 mr-0.5" />
                  {displayLow}{unitSymbol}
                </span>
                <span>• Daylight: {current.isDay ? 'Daytime' : 'Nighttime'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Bar */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isFavorite
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
              }`}
            >
              {isFavorite ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{isFavorite ? 'Saved to Favorites' : 'Save City'}</span>
            </button>

            <button
              onClick={onRefreshWeather}
              disabled={isLoading}
              title="Refresh weather data"
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Trigger Gemini AI button */}
          <button
            onClick={onFocusAi}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>Generate Gemini Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
};
