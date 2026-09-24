import { Router, Response } from 'express';
import { generateWeatherInsight } from '../services/geminiService.js';
import { getWeatherData } from '../services/weatherService.js';
import { Collections } from '../db.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Generate or fetch AI Insights for a city
router.post('/insights', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { city, userPrompt, forceRefresh } = req.body;
    const targetCity = city || 'Tokyo';

    // If not forcing refresh, check if we have a recent insight in DB (< 30 min old)
    if (!forceRefresh) {
      const existing = Collections.AIInsights.findByCity(targetCity);
      if (existing) {
        const ageMinutes = (Date.now() - new Date(existing.generatedAt).getTime()) / 60000;
        if (ageMinutes < 30) {
          res.json({ insight: existing, fromDb: true });
          return;
        }
      }
    }

    // Get current weather first
    const { weather } = await getWeatherData(targetCity);
    const forecastSummary = weather.daily
      .slice(0, 3)
      .map((d) => `${d.dayOfWeek}: ${d.condition}, high ${d.maxTempC}°C, rain chance ${d.precipitationProb}%`)
      .join('; ');

    const insight = await generateWeatherInsight(weather.current, forecastSummary, userPrompt);

    // Save to AIInsights collection
    const saved = Collections.AIInsights.create({
      ...insight,
      userId: req.user?.id,
    });

    res.json({ insight: saved, fromDb: false });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate AI insights', details: err?.message });
  }
});

// Get latest insight by city
router.get('/insights/:city', (req: AuthenticatedRequest, res: Response): void => {
  const city = req.params.city;
  const existing = Collections.AIInsights.findByCity(city);
  if (!existing) {
    res.status(404).json({ error: 'No cached insight for this city' });
    return;
  }
  res.json({ insight: existing });
});

// Get recent insights list
router.get('/history', optionalAuth, (req: AuthenticatedRequest, res: Response): void => {
  const all = Collections.AIInsights.find();
  const sorted = all.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()).slice(0, 20);
  res.json({ insights: sorted });
});

export default router;
