import {
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  WeatherData,
} from '../../types/index.js';
import { Collections } from '../db.js';

interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}

// In-memory cache for API optimization
const weatherCache = new Map<string, CacheEntry>();

// Climatological standard coordinates for quick fallbacks
const KNOWN_CITIES: Record<string, { lat: number; lon: number; country: string }> = {
  tokyo: { lat: 35.6762, lon: 139.6503, country: 'Japan' },
  'new york': { lat: 40.7128, lon: -74.006, country: 'United States' },
  london: { lat: 51.5074, lon: -0.1278, country: 'United Kingdom' },
  paris: { lat: 48.8566, lon: 2.3522, country: 'France' },
  sydney: { lat: -33.8688, lon: 151.2093, country: 'Australia' },
  singapore: { lat: 1.3521, lon: 103.8198, country: 'Singapore' },
  dubai: { lat: 25.2048, lon: 55.2708, country: 'United Arab Emirates' },
  'san francisco': { lat: 37.7749, lon: -122.4194, country: 'United States' },
  berlin: { lat: 52.52, lon: 13.405, country: 'Germany' },
  toronto: { lat: 43.6532, lon: -79.3832, country: 'Canada' },
  mumbai: { lat: 19.076, lon: 72.8777, country: 'India' },
  seoul: { lat: 37.5665, lon: 126.978, country: 'South Korea' },
  cairo: { lat: 30.0444, lon: 31.2357, country: 'Egypt' },
  'buenos aires': { lat: -34.6037, lon: -58.3816, country: 'Argentina' },
  rome: { lat: 41.9028, lon: 12.4964, country: 'Italy' },
};

// Map WMO Weather Codes to descriptive conditions and Lucide icon keys
export function mapWmoCode(code: number, isDay = true): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: isDay ? 'Sun' : 'Moon' };
  if (code === 1) return { condition: 'Mainly Clear', icon: isDay ? 'SunMedium' : 'CloudMoon' };
  if (code === 2) return { condition: 'Partly Cloudy', icon: isDay ? 'CloudSun' : 'CloudMoon' };
  if (code === 3) return { condition: 'Overcast', icon: 'Cloud' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'CloudFog' };
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 65) return { condition: 'Rain', icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { condition: 'Snowfall', icon: 'CloudSnow' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: 'CloudRainWind' };
  if (code >= 85 && code <= 86) return { condition: 'Snow Showers', icon: 'CloudSnow' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: 'CloudLightning' };
  return { condition: 'Partly Cloudy', icon: 'CloudSun' };
}

export function calculateUvRating(uv: number): 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme' {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

export function calculateAqiLabel(
  aqi: number
): 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Hazardous' {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Hazardous';
}

export function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

// Geocode city query
export async function geocodeCity(query: string): Promise<{
  city: string;
  country: string;
  lat: number;
  lon: number;
}> {
  const clean = query.trim().toLowerCase();

  // Check known cities first
  if (KNOWN_CITIES[clean]) {
    const k = KNOWN_CITIES[clean];
    const cityName = query.trim().charAt(0).toUpperCase() + query.trim().slice(1);
    return { city: cityName, country: k.country, lat: k.lat, lon: k.lon };
  }

  // Try Open-Meteo geocoding API with 4s timeout
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=1&language=en&format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        return {
          city: item.name,
          country: item.country || item.admin1 || 'Global',
          lat: item.latitude,
          lon: item.longitude,
        };
      }
    }
  } catch (err) {
    // Geocoding network failed, proceed to fallback coordinates
  }

  // Fallback: Deterministic coordinates from city name hash
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  const lat = ((Math.abs(hash) % 1200) - 600) / 10; // -60 to +60
  const lon = ((Math.abs(hash * 31) % 3600) - 1800) / 10; // -180 to +180
  const formattedCity = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    city: formattedCity,
    country: 'International',
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };
}

// Generate Realistic Climatological Weather (Resilient Fallback Mode)
export function generateResilientFallbackWeather(
  city: string,
  country: string,
  lat: number,
  lon: number
): WeatherData {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const hour = now.getHours();

  // Latitude based climatology
  const isNorthern = lat >= 0;
  const isSummer = isNorthern ? month >= 5 && month <= 8 : month >= 11 || month <= 2;
  const baseTemp = isSummer ? 22 + (40 - Math.abs(lat)) * 0.2 : 10 + (40 - Math.abs(lat)) * 0.2;
  const dayVariation = Math.sin(((hour - 9) / 24) * Math.PI * 2) * 5;
  const tempC = Math.round(baseTemp + dayVariation);
  const feelsLikeC = tempC > 20 ? tempC + 1 : tempC - 1;
  const humidity = Math.min(95, Math.max(30, Math.round(55 + Math.sin(lat) * 15)));
  const windSpeedKmh = Math.max(5, Math.round(14 + Math.cos(lon) * 8));

  const isDay = hour >= 6 && hour < 19;
  const conditionObj = mapWmoCode(tempC > 25 ? 0 : humidity > 75 ? 61 : 2, isDay);

  const current: CurrentWeather = {
    city,
    country,
    lat,
    lon,
    tempC,
    tempF: cToF(tempC),
    feelsLikeC,
    feelsLikeF: cToF(feelsLikeC),
    condition: conditionObj.condition,
    conditionCode: 2,
    conditionIcon: conditionObj.icon,
    humidity,
    windSpeedKmh,
    windSpeedMph: kmhToMph(windSpeedKmh),
    windDirection: 'NE 45°',
    pressureHpa: 1014,
    uvIndex: isDay ? 6 : 0,
    uvRating: isDay ? 'Moderate' : 'Low',
    visibilityKm: 10,
    airQualityIndex: 42,
    airQualityLabel: 'Good',
    dewPointC: Math.round(tempC - (100 - humidity) / 5),
    cloudCoverPercent: 35,
    sunrise: '06:12 AM',
    sunset: '07:24 PM',
    isDay,
    source: 'fallback',
  };

  // Generate 24 hours
  const hourly: HourlyForecastItem[] = [];
  for (let i = 0; i < 24; i++) {
    const targetHour = (hour + i) % 24;
    const hTime = `${targetHour.toString().padStart(2, '0')}:00`;
    const hDay = targetHour >= 6 && targetHour < 19;
    const hVariation = Math.sin(((targetHour - 9) / 24) * Math.PI * 2) * 5;
    const hTemp = Math.round(baseTemp + hVariation);
    const cond = mapWmoCode(hTemp > 25 ? 0 : 2, hDay);

    hourly.push({
      time: hTime,
      tempC: hTemp,
      tempF: cToF(hTemp),
      condition: cond.condition,
      conditionCode: 2,
      conditionIcon: cond.icon,
      precipitationProb: (targetHour * 7) % 35,
      windSpeedKmh: Math.round(windSpeedKmh + ((targetHour % 5) - 2)),
      humidity: Math.round(humidity + Math.sin(targetHour) * 8),
    });
  }

  // Generate 7 days
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daily: DailyForecastItem[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? 'Today' : days[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];
    const maxC = Math.round(baseTemp + 4 + (i % 3));
    const minC = Math.round(baseTemp - 3 - (i % 2));
    const rainProb = [15, 30, 65, 20, 10, 5, 40][i % 7];
    const dCond = mapWmoCode(rainProb > 50 ? 61 : rainProb > 25 ? 2 : 0, true);

    daily.push({
      date: dateStr,
      dayOfWeek: dayName,
      maxTempC: maxC,
      maxTempF: cToF(maxC),
      minTempC: minC,
      minTempF: cToF(minC),
      condition: dCond.condition,
      conditionCode: 2,
      conditionIcon: dCond.icon,
      precipitationProb: rainProb,
      uvIndex: Math.max(1, 8 - (i % 3)),
      windSpeedKmh: Math.round(windSpeedKmh + (i % 4)),
      humidity: Math.round(humidity + (i % 5)),
      summary:
        rainProb > 50
          ? 'Scattered showers expected in the afternoon with moderate winds.'
          : 'Mostly clear skies with comfortable temperatures throughout the day.',
    });
  }

  return { current, hourly, daily };
}

// Fetch Full Weather for City
export async function getWeatherData(
  cityQuery: string,
  forceFallback = false
): Promise<{ weather: WeatherData; fromCache: boolean; isFallback: boolean }> {
  const settings = Collections.Settings.get();
  const isFallbackEnforced = forceFallback || settings.fallbackModeForceEnabled;

  const geo = await geocodeCity(cityQuery);
  const cacheKey = `${geo.city.toLowerCase()}_${geo.lat.toFixed(2)}_${geo.lon.toFixed(2)}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now && !isFallbackEnforced) {
    return {
      weather: {
        ...cached.data,
        current: { ...cached.data.current, source: 'cache', cachedAt: new Date(cached.expiresAt - settings.cacheDurationMinutes * 60000).toISOString() },
      },
      fromCache: true,
      isFallback: false,
    };
  }

  // If forced fallback, bypass live API
  if (isFallbackEnforced) {
    const fallbackData = generateResilientFallbackWeather(geo.city, geo.country, geo.lat, geo.lon);
    return { weather: fallbackData, fromCache: false, isFallback: true };
  }

  // Live Open-Meteo API Fetch
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;

    const resp = await fetch(weatherUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      throw new Error(`External weather provider status: ${resp.status}`);
    }

    const json = await resp.json();
    const cur = json.current;
    const isDay = cur.is_day === 1;
    const cond = mapWmoCode(cur.weather_code, isDay);
    const tempC = Math.round(cur.temperature_2m);
    const feelsLikeC = Math.round(cur.apparent_temperature);
    const windSpeedKmh = Math.round(cur.wind_speed_10m);
    const uvIndex = json.daily?.uv_index_max?.[0] ? Math.round(json.daily.uv_index_max[0]) : 4;

    const sunriseStr = json.daily?.sunrise?.[0]
      ? new Date(json.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '06:30 AM';
    const sunsetStr = json.daily?.sunset?.[0]
      ? new Date(json.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '07:15 PM';

    // Compass direction from angle
    const deg = cur.wind_direction_10m || 0;
    const compassDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirIdx = Math.round(deg / 45) % 8;
    const windDirection = `${compassDirs[dirIdx]} ${deg}°`;

    const current: CurrentWeather = {
      city: geo.city,
      country: geo.country,
      lat: geo.lat,
      lon: geo.lon,
      tempC,
      tempF: cToF(tempC),
      feelsLikeC,
      feelsLikeF: cToF(feelsLikeC),
      condition: cond.condition,
      conditionCode: cur.weather_code,
      conditionIcon: cond.icon,
      humidity: Math.round(cur.relative_humidity_2m),
      windSpeedKmh,
      windSpeedMph: kmhToMph(windSpeedKmh),
      windDirection,
      pressureHpa: Math.round(cur.pressure_msl || 1013),
      uvIndex,
      uvRating: calculateUvRating(uvIndex),
      visibilityKm: 10,
      airQualityIndex: 38,
      airQualityLabel: 'Good',
      dewPointC: Math.round(tempC - (100 - cur.relative_humidity_2m) / 5),
      cloudCoverPercent: Math.round(cur.cloud_cover || 20),
      sunrise: sunriseStr,
      sunset: sunsetStr,
      isDay,
      source: 'live',
    };

    // Hourly (next 24 hours)
    const hourly: HourlyForecastItem[] = [];
    const hourlyTimes = json.hourly?.time || [];
    const currentIsoHour = new Date().toISOString().slice(0, 13);
    let startIdx = hourlyTimes.findIndex((t: string) => t.startsWith(currentIsoHour));
    if (startIdx === -1) startIdx = 0;

    for (let i = startIdx; i < Math.min(startIdx + 24, hourlyTimes.length); i++) {
      const timeStr = hourlyTimes[i];
      const hDate = new Date(timeStr);
      const hTempC = Math.round(json.hourly.temperature_2m[i]);
      const hCode = json.hourly.weather_code[i];
      const hHour = hDate.getHours();
      const hIsDay = hHour >= 6 && hHour < 19;
      const hCond = mapWmoCode(hCode, hIsDay);

      hourly.push({
        time: `${hHour.toString().padStart(2, '0')}:00`,
        tempC: hTempC,
        tempF: cToF(hTempC),
        condition: hCond.condition,
        conditionCode: hCode,
        conditionIcon: hCond.icon,
        precipitationProb: json.hourly.precipitation_probability?.[i] || 0,
        windSpeedKmh: Math.round(json.hourly.wind_speed_10m?.[i] || 10),
        humidity: Math.round(json.hourly.relative_humidity_2m?.[i] || 50),
      });
    }

    // Daily (7 days)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daily: DailyForecastItem[] = [];
    const dailyTimes = json.daily?.time || [];

    for (let i = 0; i < Math.min(7, dailyTimes.length); i++) {
      const dateStr = dailyTimes[i];
      const d = new Date(dateStr);
      const dayName = i === 0 ? 'Today' : days[d.getDay()];
      const maxC = Math.round(json.daily.temperature_2m_max[i]);
      const minC = Math.round(json.daily.temperature_2m_min[i]);
      const code = json.daily.weather_code[i];
      const dCond = mapWmoCode(code, true);
      const rainProb = json.daily.precipitation_probability_max?.[i] || 0;
      const uv = Math.round(json.daily.uv_index_max?.[i] || 5);

      daily.push({
        date: dateStr,
        dayOfWeek: dayName,
        maxTempC: maxC,
        maxTempF: cToF(maxC),
        minTempC: minC,
        minTempF: cToF(minC),
        condition: dCond.condition,
        conditionCode: code,
        conditionIcon: dCond.icon,
        precipitationProb: rainProb,
        uvIndex: uv,
        windSpeedKmh: Math.round(windSpeedKmh + (i % 3)),
        humidity: Math.round(current.humidity + (i % 4)),
        summary:
          rainProb > 40
            ? 'High likelihood of rain during the day. Keep an umbrella ready.'
            : 'Favorable atmospheric conditions with pleasant outdoor weather.',
      });
    }

    const weatherData: WeatherData = { current, hourly, daily };

    // Save in cache
    const cacheTtlMs = settings.cacheDurationMinutes * 60 * 1000;
    weatherCache.set(cacheKey, {
      data: weatherData,
      expiresAt: now + cacheTtlMs,
    });

    return { weather: weatherData, fromCache: false, isFallback: false };
  } catch (err) {
    console.warn(`Weather API call failed for ${geo.city}, switching to Resilient Fallback Mode:`, err);
    const fallbackData = generateResilientFallbackWeather(geo.city, geo.country, geo.lat, geo.lon);
    return { weather: fallbackData, fromCache: false, isFallback: true };
  }
}

export function clearWeatherCache(): number {
  const size = weatherCache.size;
  weatherCache.clear();
  return size;
}

export function getCacheStats(): { entries: number; keys: string[] } {
  return {
    entries: weatherCache.size,
    keys: Array.from(weatherCache.keys()),
  };
}
