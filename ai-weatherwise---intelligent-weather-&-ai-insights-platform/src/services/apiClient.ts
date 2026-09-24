import {
  WeatherData,
  AIInsight,
  FavoriteLocation,
  NotificationItem,
  User,
  AdminAnalytics,
  SystemSettings,
  ApiUsageLog,
  TestResult,
} from '../types/index.js';

const TOKEN_KEY = 'weatherwise_auth_token';
const USER_KEY = 'weatherwise_user';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
  getUser: (): User | null => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },
};

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T; error?: string }> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();

    if (!res.ok) {
      return { data: json, error: json.error || `HTTP ${res.status}: ${res.statusText}` };
    }
    return { data: json };
  } catch (err: any) {
    return { data: null as any, error: err?.message || 'Network request failed' };
  }
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  demoLogin: (type: 'admin' | 'user') =>
    request<{ user: User; token: string }>(`/api/auth/demo-login/${type}`),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (profile: Partial<User>) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Weather
  getWeather: (city: string, fallback = false) =>
    request<{
      weather: WeatherData;
      metadata: {
        fromCache: boolean;
        isFallback: boolean;
        provider: string;
        timestamp: string;
      };
    }>(`/api/weather/data?city=${encodeURIComponent(city)}&fallback=${fallback}`),

  searchCities: (q: string) =>
    request<{ results: { name: string; country: string; lat: number; lon: number }[] }>(
      `/api/weather/search?q=${encodeURIComponent(q)}`
    ),

  getWeatherHistory: (limit = 20) =>
    request<{ history: any[] }>(`/api/weather/history?limit=${limit}`),

  deleteWeatherHistoryItem: (id: string) =>
    request<{ message: string }>(`/api/weather/history/${id}`, { method: 'DELETE' }),

  clearWeatherHistory: () =>
    request<{ message: string }>('/api/weather/history', { method: 'DELETE' }),

  toggleFallbackMode: () =>
    request<{ message: string; fallbackModeForceEnabled: boolean }>('/api/weather/toggle-fallback', {
      method: 'POST',
    }),

  // AI Insights
  generateAIInsights: (city: string, userPrompt?: string, forceRefresh = false) =>
    request<{ insight: AIInsight; fromDb: boolean }>('/api/ai/insights', {
      method: 'POST',
      body: JSON.stringify({ city, userPrompt, forceRefresh }),
    }),

  getAIHistory: () => request<{ insights: AIInsight[] }>('/api/ai/history'),

  // User Favorites & Notifications
  getFavorites: () => request<{ favorites: FavoriteLocation[] }>('/api/user/favorites'),

  addFavorite: (city: string, notes?: string) =>
    request<{ message: string; favorite: FavoriteLocation }>('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify({ city, notes }),
    }),

  updateFavorite: (id: string, updates: Partial<FavoriteLocation>) =>
    request<{ message: string; favorite: FavoriteLocation }>(`/api/user/favorites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteFavorite: (id: string) =>
    request<{ message: string }>(`/api/user/favorites/${id}`, { method: 'DELETE' }),

  getNotifications: () =>
    request<{ notifications: NotificationItem[] }>('/api/user/notifications'),

  markNotificationRead: (id: string) =>
    request<{ notification: NotificationItem }>(`/api/user/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/api/user/notifications/read-all', { method: 'PUT' }),

  updatePreferences: (preferences: any) =>
    request<{ user: User }>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  // Admin
  getAdminAnalytics: () =>
    request<{ analytics: AdminAnalytics; cacheStats: { entries: number; keys: string[] } }>(
      '/api/admin/analytics'
    ),

  getAdminLogs: (limit = 50) => request<{ logs: ApiUsageLog[] }>(`/api/admin/logs?limit=${limit}`),

  getAdminUsers: () => request<{ users: User[]; count: number }>('/api/admin/users'),

  updateUserRole: (id: string, role: 'user' | 'admin') =>
    request<{ message: string; user: User }>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  getAdminSettings: () => request<{ settings: SystemSettings }>('/api/admin/settings'),

  updateAdminSettings: (settings: Partial<SystemSettings>) =>
    request<{ message: string; settings: SystemSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  broadcastNotification: (title: string, message: string, type?: string, severity?: string) =>
    request<{ message: string; notification: NotificationItem }>('/api/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, message, type, severity }),
    }),

  clearCache: () => request<{ message: string }>('/api/admin/cache/clear', { method: 'POST' }),

  // System Test Runner
  runAllTests: () =>
    request<{
      summary: { total: number; passed: number; failed: number; timestamp: string };
      results: TestResult[];
    }>('/api/test/run-all', { method: 'POST' }),
};
