import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
} from 'lucide-react';

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  name,
  className = 'w-6 h-6 text-cyan-400',
  size = 24,
}) => {
  const iconProps = { className, size };

  switch (name) {
    case 'Sun':
      return <Sun {...iconProps} className={`${className} text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]`} />;
    case 'SunMedium':
      return <Sun {...iconProps} className={`${className} text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.4)]`} />;
    case 'Moon':
      return <Moon {...iconProps} className={`${className} text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.4)]`} />;
    case 'CloudSun':
      return <CloudSun {...iconProps} className={`${className} text-sky-400`} />;
    case 'CloudMoon':
      return <CloudMoon {...iconProps} className={`${className} text-indigo-300`} />;
    case 'Cloud':
      return <Cloud {...iconProps} className={`${className} text-slate-300`} />;
    case 'CloudFog':
      return <CloudFog {...iconProps} className={`${className} text-slate-400`} />;
    case 'CloudDrizzle':
      return <CloudDrizzle {...iconProps} className={`${className} text-cyan-400`} />;
    case 'CloudRain':
    case 'CloudRainWind':
      return <CloudRain {...iconProps} className={`${className} text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]`} />;
    case 'CloudSnow':
      return <CloudSnow {...iconProps} className={`${className} text-sky-200 drop-shadow-[0_0_8px_rgba(186,230,253,0.5)]`} />;
    case 'CloudLightning':
      return <CloudLightning {...iconProps} className={`${className} text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]`} />;
    case 'Wind':
      return <Wind {...iconProps} className={`${className} text-teal-300`} />;
    default:
      return <CloudSun {...iconProps} className={`${className} text-cyan-400`} />;
  }
};
