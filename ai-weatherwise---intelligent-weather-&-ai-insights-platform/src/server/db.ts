import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import {
  User,
  WeatherHistoryItem,
  FavoriteLocation,
  AIInsight,
  NotificationItem,
  SystemSettings,
  ApiUsageLog,
} from '../types/index.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  weatherHistory: WeatherHistoryItem[];
  favoriteLocations: FavoriteLocation[];
  aiInsights: AIInsight[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  apiLogs: ApiUsageLog[];
}

const DEFAULT_SETTINGS: SystemSettings = {
  defaultUnit: 'celsius',
  defaultSpeedUnit: 'kmh',
  apiRateLimitPerMinute: 120,
  cacheDurationMinutes: 15,
  externalProvider: 'Open-Meteo & Meteorological Live Feeds',
  aiModel: 'gemini-3.8-flash',
  fallbackModeForceEnabled: false,
};

let db: DatabaseSchema = {
  users: [],
  weatherHistory: [],
  favoriteLocations: [],
  aiInsights: [],
  notifications: [],
  settings: DEFAULT_SETTINGS,
  apiLogs: [],
};

// Initialize DB with seed accounts if empty
export async function initDatabase(): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      return;
    }
  } catch (err) {
    console.warn('Could not read saved database file, initializing in-memory store:', err);
  }

  // Seed default admin and user
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin123!', adminSalt);

  const demoSalt = await bcrypt.genSalt(10);
  const demoHash = await bcrypt.hash('Demo123!', demoSalt);

  const now = new Date().toISOString();

  const adminUser: User & { passwordHash: string } = {
    id: 'user_admin_001',
    name: 'Chief Meteorologist (Admin)',
    email: 'admin@weatherwise.ai',
    passwordHash: adminHash,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    preferences: {
      units: 'celsius',
      speedUnit: 'kmh',
      theme: 'dark',
      autoLocation: true,
      emailAlerts: true,
    },
    createdAt: now,
    updatedAt: now,
  };

  const demoUser: User & { passwordHash: string } = {
    id: 'user_demo_002',
    name: 'Alex Rivera',
    email: 'demo@weatherwise.ai',
    passwordHash: demoHash,
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    preferences: {
      units: 'celsius',
      speedUnit: 'kmh',
      theme: 'dark',
      autoLocation: false,
      emailAlerts: true,
    },
    createdAt: now,
    updatedAt: now,
  };

  db.users = [adminUser, demoUser];

  // Seed favorite locations for demo user
  db.favoriteLocations = [
    {
      id: 'fav_tokyo_01',
      userId: demoUser.id,
      city: 'Tokyo',
      country: 'Japan',
      lat: 35.6762,
      lon: 139.6503,
      notes: 'Headquarters & Travel hub',
      alertEnabled: true,
      pinned: true,
      createdAt: now,
    },
    {
      id: 'fav_paris_02',
      userId: demoUser.id,
      city: 'Paris',
      country: 'France',
      lat: 48.8566,
      lon: 2.3522,
      notes: 'Upcoming conference site',
      alertEnabled: true,
      pinned: false,
      createdAt: now,
    },
    {
      id: 'fav_sf_03',
      userId: demoUser.id,
      city: 'San Francisco',
      country: 'United States',
      lat: 37.7749,
      lon: -122.4194,
      notes: 'Pacific coast weather',
      alertEnabled: false,
      pinned: false,
      createdAt: now,
    },
  ];

  // Seed initial notification
  db.notifications = [
    {
      id: 'notif_welcome_01',
      userId: 'all',
      title: 'Welcome to AI WeatherWise API',
      message: 'Explore real-time forecasting and personalized Gemini AI weather intelligence.',
      type: 'system',
      severity: 'info',
      read: false,
      createdAt: now,
    },
    {
      id: 'notif_demo_02',
      userId: demoUser.id,
      title: 'Rain Forecast for Tokyo Tomorrow',
      message: 'Expect scattered showers around 14:00. An umbrella is recommended.',
      type: 'forecast',
      severity: 'warning',
      read: false,
      createdAt: now,
    },
  ];

  saveDatabase();
}

function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    // If running in read-only environment, keep in memory
  }
}

// Collections API
export const Collections = {
  Users: {
    find: (filter?: (u: User & { passwordHash: string }) => boolean) => {
      return filter ? db.users.filter(filter) : [...db.users];
    },
    findOne: (filter: (u: User & { passwordHash: string }) => boolean) => {
      return db.users.find(filter) || null;
    },
    findById: (id: string) => {
      return db.users.find((u) => u.id === id) || null;
    },
    findByEmail: (email: string) => {
      return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    create: (data: Omit<User & { passwordHash: string }, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newUser: User & { passwordHash: string } = {
        ...data,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(newUser);
      saveDatabase();
      return newUser;
    },
    update: (id: string, updates: Partial<User & { passwordHash: string }>) => {
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      db.users[idx] = {
        ...db.users[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveDatabase();
      return db.users[idx];
    },
    delete: (id: string) => {
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx === -1) return false;
      db.users.splice(idx, 1);
      // Clean up user's data
      db.favoriteLocations = db.favoriteLocations.filter((f) => f.userId !== id);
      db.weatherHistory = db.weatherHistory.filter((h) => h.userId !== id);
      db.aiInsights = db.aiInsights.filter((a) => a.userId !== id);
      saveDatabase();
      return true;
    },
    count: () => db.users.length,
  },

  WeatherHistory: {
    find: (filter?: (item: WeatherHistoryItem) => boolean) => {
      return filter ? db.weatherHistory.filter(filter) : [...db.weatherHistory];
    },
    findByUserId: (userId: string, limit = 50) => {
      return db.weatherHistory
        .filter((item) => item.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
    create: (data: Omit<WeatherHistoryItem, 'id' | 'timestamp'>) => {
      const item: WeatherHistoryItem = {
        ...data,
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      };
      db.weatherHistory.unshift(item);
      // Keep max 1000 items in history
      if (db.weatherHistory.length > 1000) {
        db.weatherHistory.pop();
      }
      saveDatabase();
      return item;
    },
    delete: (id: string, userId?: string) => {
      const idx = db.weatherHistory.findIndex(
        (h) => h.id === id && (!userId || h.userId === userId)
      );
      if (idx === -1) return false;
      db.weatherHistory.splice(idx, 1);
      saveDatabase();
      return true;
    },
    clearForUser: (userId: string) => {
      db.weatherHistory = db.weatherHistory.filter((h) => h.userId !== userId);
      saveDatabase();
      return true;
    },
    count: () => db.weatherHistory.length,
  },

  FavoriteLocations: {
    find: (filter?: (f: FavoriteLocation) => boolean) => {
      return filter ? db.favoriteLocations.filter(filter) : [...db.favoriteLocations];
    },
    findByUserId: (userId: string) => {
      return db.favoriteLocations
        .filter((f) => f.userId === userId)
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    },
    findById: (id: string) => {
      return db.favoriteLocations.find((f) => f.id === id) || null;
    },
    create: (data: Omit<FavoriteLocation, 'id' | 'createdAt'>) => {
      const now = new Date().toISOString();
      const fav: FavoriteLocation = {
        ...data,
        id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
      };
      db.favoriteLocations.push(fav);
      saveDatabase();
      return fav;
    },
    update: (id: string, updates: Partial<FavoriteLocation>) => {
      const idx = db.favoriteLocations.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      db.favoriteLocations[idx] = { ...db.favoriteLocations[idx], ...updates };
      saveDatabase();
      return db.favoriteLocations[idx];
    },
    delete: (id: string, userId?: string) => {
      const idx = db.favoriteLocations.findIndex(
        (f) => f.id === id && (!userId || f.userId === userId)
      );
      if (idx === -1) return false;
      db.favoriteLocations.splice(idx, 1);
      saveDatabase();
      return true;
    },
    count: () => db.favoriteLocations.length,
  },

  AIInsights: {
    find: (filter?: (a: AIInsight) => boolean) => {
      return filter ? db.aiInsights.filter(filter) : [...db.aiInsights];
    },
    findByCity: (city: string) => {
      return (
        db.aiInsights
          .filter((a) => a.city.toLowerCase() === city.toLowerCase())
          .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0] ||
        null
      );
    },
    create: (data: Omit<AIInsight, 'id' | 'generatedAt'>) => {
      const insight: AIInsight = {
        ...data,
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        generatedAt: new Date().toISOString(),
      };
      db.aiInsights.unshift(insight);
      // Keep last 200 insights
      if (db.aiInsights.length > 200) db.aiInsights.pop();
      saveDatabase();
      return insight;
    },
    count: () => db.aiInsights.length,
  },

  Notifications: {
    findForUser: (userId: string) => {
      return db.notifications
        .filter((n) => n.userId === userId || n.userId === 'all')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    create: (data: Omit<NotificationItem, 'id' | 'createdAt'>) => {
      const notif: NotificationItem = {
        ...data,
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      db.notifications.unshift(notif);
      saveDatabase();
      return notif;
    },
    markAsRead: (id: string) => {
      const notif = db.notifications.find((n) => n.id === id);
      if (notif) {
        notif.read = true;
        saveDatabase();
      }
      return notif;
    },
    markAllAsRead: (userId: string) => {
      db.notifications.forEach((n) => {
        if (n.userId === userId || n.userId === 'all') {
          n.read = true;
        }
      });
      saveDatabase();
    },
    delete: (id: string) => {
      const idx = db.notifications.findIndex((n) => n.id === id);
      if (idx !== -1) {
        db.notifications.splice(idx, 1);
        saveDatabase();
        return true;
      }
      return false;
    },
  },

  Settings: {
    get: (): SystemSettings => ({ ...db.settings }),
    update: (updates: Partial<SystemSettings>): SystemSettings => {
      db.settings = { ...db.settings, ...updates };
      saveDatabase();
      return { ...db.settings };
    },
  },

  APIUsageLogs: {
    log: (entry: Omit<ApiUsageLog, 'id' | 'timestamp'>) => {
      const logItem: ApiUsageLog = {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      db.apiLogs.unshift(logItem);
      // Keep last 1000 logs in memory
      if (db.apiLogs.length > 1000) {
        db.apiLogs.pop();
      }
      return logItem;
    },
    getRecent: (limit = 100) => db.apiLogs.slice(0, limit),
    getAnalytics: () => {
      const logs = db.apiLogs;
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter((l) => l.timestamp.startsWith(today));
      const totalRequests = todayLogs.length || logs.length;
      const avgResponseTime =
        logs.length > 0
          ? Math.round(logs.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / logs.length)
          : 45;
      const fallbackLogs = logs.filter((l) => l.isFallback);
      const fallbackRate =
        logs.length > 0 ? Math.round((fallbackLogs.length / logs.length) * 100) : 0;

      // Group searches by city from history
      const cityCounts: Record<string, number> = {};
      db.weatherHistory.forEach((h) => {
        cityCounts[h.city] = (cityCounts[h.city] || 0) + 1;
      });

      const popularCities = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      return {
        totalUsers: db.users.length,
        totalSearches: db.weatherHistory.length,
        totalAiInsights: db.aiInsights.length,
        totalFavorites: db.favoriteLocations.length,
        apiRequestsToday: totalRequests,
        averageResponseTimeMs: avgResponseTime,
        fallbackRatePercentage: fallbackRate,
        popularCities:
          popularCities.length > 0
            ? popularCities
            : [
                { city: 'Tokyo', count: 18 },
                { city: 'Paris', count: 12 },
                { city: 'New York', count: 15 },
                { city: 'London', count: 9 },
              ],
        recentLogs: logs.slice(0, 30),
      };
    },
  },
};
