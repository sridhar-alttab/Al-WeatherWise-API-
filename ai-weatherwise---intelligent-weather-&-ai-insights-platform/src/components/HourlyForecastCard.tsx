import React from 'react';
import { Clock, Droplets, Wind } from 'lucide-react';
import { HourlyForecastItem, TemperatureUnit, SpeedUnit } from '../types/index.js';
import { WeatherIcon } from './WeatherIcon.js';

interface HourlyForecastCardProps {
  hourly: HourlyForecastItem[];
  tempUnit: TemperatureUnit;
  speedUnit: SpeedUnit;
}

export const HourlyForecastCard: React.FC<HourlyForecastCardProps> = ({
  hourly,
  tempUnit,
  speedUnit,
}) => {
  const isF = tempUnit === 'fahrenheit';
  const isMph = speedUnit === 'mph';

  return (
    <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase text-slate-300">
            24-Hour Forecast Timeline
          </h2>
        </div>
        <span className="text-xs text-slate-400">Scroll horizontally →</span>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex gap-3 min-w-max">
          {hourly.map((item, idx) => {
            const temp = isF ? item.tempF : item.tempC;
            const wind = isMph ? Math.round(item.windSpeedKmh * 0.621371) : item.windSpeedKmh;
            const windUnit = isMph ? 'mph' : 'km/h';

            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900 transition-all min-w-[90px] text-center"
              >
                <span className="text-xs font-medium text-slate-400 mb-2">{item.time}</span>

                <div className="my-1">
                  <WeatherIcon name={item.conditionIcon} size={24} />
                </div>

                <span className="text-base font-bold text-white my-1">
                  {temp}°
                </span>

                {/* Rain probability */}
                <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium mt-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  <span>{item.precipitationProb}%</span>
                </div>

                {/* Wind speed */}
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <Wind className="w-2.5 h-2.5 text-slate-400" />
                  <span>{wind} {windUnit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
