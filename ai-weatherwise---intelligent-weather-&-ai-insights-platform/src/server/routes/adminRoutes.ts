import { Router, Response } from 'express';
import { Collections } from '../db.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { clearWeatherCache, getCacheStats } from '../services/weatherService.js';

const router = Router();

// Apply admin requirement to all endpoints here
router.use(requireAdmin);

// List all users
router.get('/users', (req: AuthenticatedRequest, res: Response): void => {
  const users = Collections.Users.find().map(({ passwordHash, ...u }) => u);
  res.json({ users, count: users.length });
});

// Update user role
router.put('/users/:id/role', (req: AuthenticatedRequest, res: Response): void => {
  const { role } = req.body;
  if (role !== 'user' && role !== 'admin') {
    res.status(400).json({ error: 'Role must be user or admin' });
    return;
  }

  // Prevent self-demotion if last admin
  if (req.user?.id === req.params.id && role !== 'admin') {
    res.status(400).json({ error: 'Cannot demote your own admin account.' });
    return;
  }

  const updated = Collections.Users.update(req.params.id, { role });
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { passwordHash, ...safeUser } = updated;
  res.json({ message: 'User role updated', user: safeUser });
});

// Delete user
router.delete('/users/:id', (req: AuthenticatedRequest, res: Response): void => {
  if (req.user?.id === req.params.id) {
    res.status(400).json({ error: 'Cannot delete your own admin account.' });
    return;
  }

  const success = Collections.Users.delete(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ message: 'User and all related records deleted' });
});

// Admin Analytics & API Telemetry
router.get('/analytics', (req: AuthenticatedRequest, res: Response): void => {
  const analytics = Collections.APIUsageLogs.getAnalytics();
  const cacheStats = getCacheStats();
  res.json({ analytics, cacheStats });
});

// Recent API logs
router.get('/logs', (req: AuthenticatedRequest, res: Response): void => {
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const logs = Collections.APIUsageLogs.getRecent(limit);
  res.json({ logs });
});

// Get system settings
router.get('/settings', (req: AuthenticatedRequest, res: Response): void => {
  const settings = Collections.Settings.get();
  res.json({ settings });
});

// Update system settings
router.put('/settings', (req: AuthenticatedRequest, res: Response): void => {
  const updated = Collections.Settings.update(req.body);
  res.json({ message: 'System settings updated', settings: updated });
});

// Broadcast notification to all users
router.post('/notifications/broadcast', (req: AuthenticatedRequest, res: Response): void => {
  const { title, message, type, severity } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: 'Title and message are required' });
    return;
  }

  const notif = Collections.Notifications.create({
    userId: 'all',
    title,
    message,
    type: type || 'system',
    severity: severity || 'info',
    read: false,
  });

  res.status(201).json({ message: 'Broadcast notification sent to all active users', notification: notif });
});

// Flush in-memory cache
router.post('/cache/clear', (req: AuthenticatedRequest, res: Response): void => {
  const clearedCount = clearWeatherCache();
  res.json({ message: `Purged ${clearedCount} cached weather entries.` });
});

export default router;
