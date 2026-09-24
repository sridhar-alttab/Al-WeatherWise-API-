export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type SpeedUnit = 'kmh' | 'mph';
export type UserRole = 'user' | 'admin';

export interface UserPreferences {
  units: TemperatureUnit;
  speedUnit: SpeedUnit;
  theme: 'dark' | 'light';
  autoLocation: boolean;
  emailAlerts: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentWeather {
  city: string;
  country: string;
  lat: number;
  lon: number;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  condition: string;
  conditionCode: number;
  conditionIcon: string;
  humidity: number;
  windSpeedKmh: number;
  windSpeedMph: number;
  windDirection: string;
  pressureHpa: number;
  uvIndex: number;
  uvRating: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  visibilityKm: number;
  airQualityIndex: number; // 1 to 5 (or US AQI)
  airQualityLabel: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Hazardous';
  dewPointC: number;
  cloudCoverPercent: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
  source: 'live' | 'fallback' | 'cache';
  cachedAt?: string;
}

export interface HourlyForecastItem {
  time: string; // ISO or '14:00'
  tempC: number;
  tempF: number;
  condition: string;
  conditionCode: number;
  conditionIcon: string;
  precipitationProb: number;
  windSpeedKmh: number;
  humidity: number;
}

export interface DailyForecastItem {
  date: string; // '2026-09-25'
  dayOfWeek: string; // 'Friday'
  maxTempC: number;
  maxTempF: number;
  minTempC: number;
  minTempF: number;
  condition: string;
  conditionCode: number;
  conditionIcon: string;
  precipitationProb: number;
  uvIndex: number;
  windSpeedKmh: number;
  humidity: number;
  summary: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  historyId?: string;
}

export interface AIInsight {
  id: string;
  userId?: string;
  city: string;
  country: string;
  generatedAt: string;
  aiModel: string;
  summary: string;
  clothing: {
    title: string;
    outfit: string[];
    accessories: string[];
    advice: string;
  };
  travel: {
    drivingCondition: 'Optimal' | 'Caution' | 'Hazardous';
    flightImpact: 'Normal' | 'Minor Delays' | 'Severe Delays';
    precautions: string[];
  };
  activities: {
    recommended: string[];
    avoid: string[];
    bestTimeOfDay: string;
  };
  severeAlerts: {
    severity: 'none' | 'low' | 'moderate' | 'high' | 'severe';
    title: string;
    description: string;
    actionableSteps: string[];
  };
  isAIGenerated: boolean;
}

export interface FavoriteLocation {
  id: string;
  userId: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  notes?: string;
  alertEnabled: boolean;
  pinned: boolean;
  createdAt: string;
}

export interface WeatherHistoryItem {
  id: string;
  userId: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  tempC: number;
  condition: string;
  humidity: number;
  windSpeedKmh: number;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // or 'all'
  title: string;
  message: string;
  type: 'alert' | 'forecast' | 'system';
  severity?: 'info' | 'warning' | 'danger';
  read: boolean;
  createdAt: string;
}

export interface SystemSettings {
  defaultUnit: TemperatureUnit;
  defaultSpeedUnit: SpeedUnit;
  apiRateLimitPerMinute: number;
  cacheDurationMinutes: number;
  externalProvider: string;
  aiModel: string;
  fallbackModeForceEnabled: boolean;
}

export interface ApiUsageLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  userId?: string;
  ip: string;
  isFallback: boolean;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalSearches: number;
  totalAiInsights: number;
  totalFavorites: number;
  apiRequestsToday: number;
  averageResponseTimeMs: number;
  fallbackRatePercentage: number;
  popularCities: { city: string; count: number }[];
  recentLogs: ApiUsageLog[];
}

export interface TestResult {
  suite: string;
  testName: string;
  status: 'passed' | 'failed';
  durationMs: number;
  details?: string;
  error?: string;
}
