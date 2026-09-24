import React from 'react';
import { Calendar, Droplets } from 'lucide-react';
import { DailyForecastItem, TemperatureUnit } from '../types/index.js';
import { WeatherIcon } from './WeatherIcon.js';

interface DailyForecastCardProps {
  daily: DailyForecastItem[];
  tempUnit: TemperatureUnit;
}

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({ daily, tempUnit }) => {
  const isF = tempUnit === 'fahrenheit';

  // Find min and max for relative temperature bar visualization
  const allMins = daily.map((d) => (isF ? d.minTempF : d.minTempC));
  const allMaxs = daily.map((d) => (isF ? d.maxTempF : d.maxTempC));
  const globalMin = Math.min(...allMins);
  const globalMax = Math.max(...allMaxs);
  const globalRange = Math.max(1, globalMax - globalMin);

  return (
    <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-bold tracking-wide uppercase text-slate-300">
          7-Day Extended Outlook
        </h2>
      </div>

      <div className="divide-y divide-slate-800/80">
        {daily.map((item, idx) => {
          const max = isF ? item.maxTempF : item.maxTempC;
          const min = isF ? item.minTempF : item.minTempC;

          // Bar offset calculations
          const leftPct = Math.max(0, Math.round(((min - globalMin) / globalRange) * 100));
          const widthPct = Math.max(15, Math.round(((max - min) / globalRange) * 100));

          return (
            <div
              key={idx}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
            >
              {/* Day & Condition */}
              <div className="flex items-center gap-3 w-48 shrink-0">
                <WeatherIcon name={item.conditionIcon} size={22} />
                <div>
                  <div className="text-sm font-semibold text-white">{item.dayOfWeek}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    {item.condition}
                  </div>
                </div>
              </div>

              {/* Rain Chance */}
              <div className="flex items-center gap-1 w-20 text-xs text-cyan-400">
                {item.precipitationProb > 0 ? (
                  <>
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{item.precipitationProb}%</span>
                  </>
                ) : (
                  <span className="text-slate-600 text-[11px]">0% rain</span>
                )}
              </div>

              {/* Temperature Bar */}
              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <span className="text-xs font-medium text-slate-400 w-8 text-right">{min}°</span>
                <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-amber-400"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white w-8">{max}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
