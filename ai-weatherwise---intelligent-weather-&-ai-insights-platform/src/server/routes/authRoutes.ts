import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Collections } from '../db.js';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Register new user
router.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = Collections.Users.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = Collections.Users.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      preferences: {
        units: 'celsius',
        speedUnit: 'kmh',
        theme: 'dark',
        autoLocation: false,
        emailAlerts: true,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;
    const token = generateToken(safeUser);

    res.status(201).json({
      message: 'Account registered successfully',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed', details: err?.message });
  }
});

// Login
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = Collections.Users.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const { passwordHash, ...safeUser } = user;
    const token = generateToken(safeUser);

    res.json({
      message: 'Authentication successful',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', details: err?.message });
  }
});

// Get current user profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: req.user });
});

// Update Profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { name, avatar, preferences } = req.body;
  const updates: any = {};
  if (name) updates.name = name.trim();
  if (avatar) updates.avatar = avatar;
  if (preferences) {
    updates.preferences = { ...req.user.preferences, ...preferences };
  }

  const updated = Collections.Users.update(req.user.id, updates);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { passwordHash, ...safeUser } = updated;
  res.json({ message: 'Profile updated', user: safeUser });
});

// Change Password
router.put('/password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const fullUser = Collections.Users.findById(req.user.id);
    if (!fullUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, fullUser.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    Collections.Users.update(req.user.id, { passwordHash });

    res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password', details: err?.message });
  }
});

// Quick Demo Login (for frictionless testing)
router.get('/demo-login/:type', (req: AuthenticatedRequest, res: Response): void => {
  const type = req.params.type;
  const email = type === 'admin' ? 'admin@weatherwise.ai' : 'demo@weatherwise.ai';
  const user = Collections.Users.findByEmail(email);

  if (!user) {
    res.status(404).json({ error: 'Demo user not found' });
    return;
  }

  const { passwordHash, ...safeUser } = user;
  const token = generateToken(safeUser);

  res.json({
    message: `Logged in as ${safeUser.role.toUpperCase()}`,
    user: safeUser,
    token,
  });
});

export default router;
