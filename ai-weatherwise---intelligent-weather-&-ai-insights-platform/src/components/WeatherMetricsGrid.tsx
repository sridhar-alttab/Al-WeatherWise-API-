import React from 'react';
import {
  Wind,
  Droplets,
  SunMedium,
  ShieldCheck,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { CurrentWeather, SpeedUnit } from '../types/index.js';

interface WeatherMetricsGridProps {
  current: CurrentWeather;
  speedUnit: SpeedUnit;
}

export const WeatherMetricsGrid: React.FC<WeatherMetricsGridProps> = ({ current, speedUnit }) => {
  const isMph = speedUnit === 'mph';
  const windVal = isMph ? current.windSpeedMph : current.windSpeedKmh;
  const windUnit = isMph ? 'mph' : 'km/h';

  // UV badge color
  const getUvBadgeClass = (rating: string) => {
    switch (rating) {
      case 'Low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Moderate':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'High':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Very High':
      case 'Extreme':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  // AQI color
  const getAqiBadgeClass = (label: string) => {
    if (label === 'Good') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (label === 'Moderate') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Wind */}
      <div className="rounded-3xl p-5 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Wind</span>
          <Wind className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {windVal} <span className="text-sm font-normal text-slate-400">{windUnit}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Direction: {current.windDirection}</div>
        </div>
        <div className="text-[11px] text-cyan-400">Gentle to moderate breeze</div>
      </div>

      {/* Humidity & Dew Point */}
      <div className="rounded-3xl p-5 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Humidity</span>
          <Droplets className="w-4 h-4 text-sky-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {current.humidity}<span className="text-sm font-normal text-slate-400">%</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Dew point: {current.dewPointC}°C</div>
        </div>
        <div className="text-[11px] text-slate-400">
          {current.humidity > 65 ? 'Noticeable moisture' : 'Comfortable ambient range'}
        </div>
      </div>

      {/* UV Index */}
      <div className="rounded-3xl p-5 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>UV Index</span>
          <SunMedium className="w-4 h-4 text-amber-400" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">{current.uvIndex}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getUvBadgeClass(
                current.uvRating
              )}`}
            >
              {current.uvRating}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Solar radiation level</div>
        </div>
        <div className="text-[11px] text-slate-400">
          {current.uvIndex >= 6 ? 'SPF 30+ & sunglasses advised' : 'Low sun exposure risk'}
        </div>
      </div>

      {/* Air Quality */}
      <div className="rounded-3xl p-5 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Air Quality</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {current.airQualityIndex}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getAqiBadgeClass(
                current.airQualityLabel
              )}`}
            >
              {current.airQualityLabel}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">PM2.5 / PM10 index</div>
        </div>
        <div className="text-[11px] text-emerald-400">Ideal for all outdoor activities</div>
      </div>

      {/* Pressure */}
      <div className="rounded-3xl p-5 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Pressure</span>
          <Gauge className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {current.pressureHpa} <span className="text-sm font-normal text-slate-400">hPa</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Barometric pressure</div>
        </div>
        <div className="text-[11px] text-slate-400">Normal atmospheric stability</div>
      </div>

      {/* Visibility */}
      <div className="rounded-3xl p-5 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Visibility</span>
          <Eye className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {current.visibilityKm} <span className="text-sm font-normal text-slate-400">km</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Cloud cover: {current.cloudCoverPercent}%</div>
        </div>
        <div className="text-[11px] text-cyan-400">Clear horizontal line of sight</div>
      </div>

      {/* Sunrise & Sunset */}
      <div className="col-span-2 rounded-3xl p-5 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Sun & Solar Cycle</span>
          <span className="text-[10px] text-cyan-400">Local Daylight</span>
        </div>
        <div className="grid grid-cols-2 gap-4 my-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Sunrise</div>
              <div className="text-base sm:text-lg font-bold text-white">{current.sunrise}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sunset className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Sunset</div>
              <div className="text-base sm:text-lg font-bold text-white">{current.sunset}</div>
            </div>
          </div>
        </div>
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-indigo-500 rounded-full"
            style={{ width: current.isDay ? '65%' : '15%' }}
          />
        </div>
      </div>
    </div>
  );
};
