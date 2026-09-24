import { Router, Response } from 'express';
import {
  geocodeCity,
  getWeatherData,
} from '../services/weatherService.js';
import { Collections } from '../db.js';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Search locations autocomplete
router.get('/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    if (!q || q.length < 1) {
      res.json({ results: [] });
      return;
    }

    const geo = await geocodeCity(q);
    res.json({
      results: [
        {
          name: geo.city,
          country: geo.country,
          lat: geo.lat,
          lon: geo.lon,
        },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to search location', details: err?.message });
  }
});

// Current & Forecast Weather Combined
router.get('/data', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const city = (req.query.city as string) || 'Tokyo';
    const forceFallback = req.query.fallback === 'true';

    const { weather, fromCache, isFallback } = await getWeatherData(city, forceFallback);

    // Save to WeatherHistory if user is logged in
    let historyId: string | undefined;
    if (req.user) {
      const historyItem = Collections.WeatherHistory.create({
        userId: req.user.id,
        city: weather.current.city,
        country: weather.current.country,
        lat: weather.current.lat,
        lon: weather.current.lon,
        tempC: weather.current.tempC,
        condition: weather.current.condition,
        humidity: weather.current.humidity,
        windSpeedKmh: weather.current.windSpeedKmh,
      });
      historyId = historyItem.id;
    }

    res.json({
      weather: { ...weather, historyId },
      metadata: {
        fromCache,
        isFallback,
        provider: isFallback ? 'Deterministic Resilient Fallback Engine' : 'Open-Meteo Meteorological Live API',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve weather data', details: err?.message });
  }
});

// Weather History for User
router.get('/history', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const limit = parseInt((req.query.limit as string) || '30', 10);
  const history = Collections.WeatherHistory.findByUserId(req.user.id, limit);
  res.json({ history });
});

// Delete history item
router.delete('/history/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const success = Collections.WeatherHistory.delete(req.params.id, req.user.id);
  if (!success) {
    res.status(404).json({ error: 'History record not found' });
    return;
  }
  res.json({ message: 'History record removed' });
});

// Clear all history
router.delete('/history', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  Collections.WeatherHistory.clearForUser(req.user.id);
  res.json({ message: 'All weather history cleared' });
});

// Toggle simulated fallback mode
router.post('/toggle-fallback', (req: AuthenticatedRequest, res: Response): void => {
  const currentSettings = Collections.Settings.get();
  const updated = Collections.Settings.update({
    fallbackModeForceEnabled: !currentSettings.fallbackModeForceEnabled,
  });
  res.json({
    message: updated.fallbackModeForceEnabled
      ? 'Resilient Fallback Mode FORCED ON (simulating external API downtime)'
      : 'Resilient Fallback Mode FORCED OFF (using live external API when reachable)',
    fallbackModeForceEnabled: updated.fallbackModeForceEnabled,
  });
});

export default router;
