import { Router, Response } from 'express';
import { Collections } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { geocodeCity } from '../services/weatherService.js';

const router = Router();

// Get user favorite locations
router.get('/favorites', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const favorites = Collections.FavoriteLocations.findByUserId(req.user.id);
  res.json({ favorites });
});

// Add favorite location
router.post('/favorites', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { city, notes } = req.body;
    if (!city) {
      res.status(400).json({ error: 'City is required' });
      return;
    }

    const geo = await geocodeCity(city);

    // Check duplicate
    const existing = Collections.FavoriteLocations.findByUserId(req.user.id).find(
      (f) => f.city.toLowerCase() === geo.city.toLowerCase()
    );
    if (existing) {
      res.status(409).json({ error: `${geo.city} is already in your favorites` });
      return;
    }

    const fav = Collections.FavoriteLocations.create({
      userId: req.user.id,
      city: geo.city,
      country: geo.country,
      lat: geo.lat,
      lon: geo.lon,
      notes: notes || '',
      alertEnabled: true,
      pinned: false,
    });

    res.status(201).json({ message: 'Added to favorites', favorite: fav });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add favorite', details: err?.message });
  }
});

// Update favorite location (pinned, notes, alertEnabled)
router.put('/favorites/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const id = req.params.id;
  const { notes, alertEnabled, pinned } = req.body;

  const existing = Collections.FavoriteLocations.findById(id);
  if (!existing || existing.userId !== req.user.id) {
    res.status(404).json({ error: 'Favorite location not found' });
    return;
  }

  const updated = Collections.FavoriteLocations.update(id, {
    notes: notes !== undefined ? notes : existing.notes,
    alertEnabled: alertEnabled !== undefined ? alertEnabled : existing.alertEnabled,
    pinned: pinned !== undefined ? pinned : existing.pinned,
  });

  res.json({ message: 'Favorite updated', favorite: updated });
});

// Delete favorite location
router.delete('/favorites/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const success = Collections.FavoriteLocations.delete(req.params.id, req.user.id);
  if (!success) {
    res.status(404).json({ error: 'Favorite location not found' });
    return;
  }
  res.json({ message: 'Removed from favorites' });
});

// Get user notifications
router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const notifications = Collections.Notifications.findForUser(req.user.id);
  res.json({ notifications });
});

// Mark notification as read
router.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const notif = Collections.Notifications.markAsRead(req.params.id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json({ message: 'Notification marked as read', notification: notif });
});

// Mark all notifications as read
router.put('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  Collections.Notifications.markAllAsRead(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

// Update user preferences
router.put('/preferences', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const updatedUser = Collections.Users.update(req.user.id, {
    preferences: {
      ...req.user.preferences,
      ...req.body,
    },
  });

  if (!updatedUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { passwordHash, ...safeUser } = updatedUser;
  res.json({ message: 'Preferences updated', user: safeUser });
});

export default router;
