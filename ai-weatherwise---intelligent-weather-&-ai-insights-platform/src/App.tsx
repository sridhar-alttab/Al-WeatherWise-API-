/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.js';
import { WeatherHero } from './components/WeatherHero.js';
import { HourlyForecastCard } from './components/HourlyForecastCard.js';
import { DailyForecastCard } from './components/DailyForecastCard.js';
import { WeatherMetricsGrid } from './components/WeatherMetricsGrid.js';
import { AIInsightSection } from './components/AIInsightSection.js';
import { FavoritesDrawer } from './components/FavoritesDrawer.js';
import { WeatherHistoryModal } from './components/WeatherHistoryModal.js';
import { AuthModal } from './components/AuthModal.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { SystemTestSuite } from './components/SystemTestSuite.js';
import {
  WeatherData,
  AIInsight,
  FavoriteLocation,
  User,
  TemperatureUnit,
  SpeedUnit,
} from './types/index.js';
import { api, authStorage } from './services/apiClient.js';
import { CloudRain, Sparkles, Shield, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authStorage.getUser());
  const [currentCity, setCurrentCity] = useState<string>('Tokyo');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>(
    currentUser?.preferences?.units || 'celsius'
  );
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>(
    currentUser?.preferences?.speedUnit || 'kmh'
  );
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showTests, setShowTests] = useState(false);

  const aiSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Verify auth session on start
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      api.getMe().then(({ data, error }) => {
        if (data?.user) {
          setCurrentUser(data.user);
          authStorage.setUser(data.user);
          if (data.user.preferences) {
            setTempUnit(data.user.preferences.units);
            setSpeedUnit(data.user.preferences.speedUnit);
          }
        } else if (error) {
          authStorage.removeToken();
          setCurrentUser(null);
        }
      });
    }
  }, []);

  // Fetch favorites when user changes
  useEffect(() => {
    if (currentUser) {
      api.getFavorites().then(({ data }) => {
        if (data?.favorites) {
          setFavorites(data.favorites);
        }
      });
    } else {
      setFavorites([]);
    }
  }, [currentUser]);

  // Load weather and AI insights for city
  const loadWeatherData = async (city: string, forceFallback = false) => {
    setIsLoadingWeather(true);
    try {
      const { data, error } = await api.getWeather(city, forceFallback);
      if (error || !data?.weather) {
        showToast(`Failed to load weather for ${city}`);
        return;
      }
      setWeatherData(data.weather);
      setIsFallbackMode(data.metadata.isFallback);

      // Fetch AI Insights in parallel / sequentially
      loadAiInsights(city, data.weather);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const loadAiInsights = async (
    city: string,
    currentWeatherContext?: WeatherData,
    customPrompt?: string
  ) => {
    setIsLoadingAi(true);
    try {
      const { data } = await api.generateAIInsights(city, customPrompt);
      if (data?.insight) {
        setAiInsight(data.insight);
      }
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadWeatherData(currentCity);
  }, [currentCity]);

  // Favorite handler
  const isCityFavorite = favorites.some(
    (f) => f.city.toLowerCase() === (weatherData?.current.city.toLowerCase() || currentCity.toLowerCase())
  );

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      setAuthMode('login');
      setShowAuth(true);
      return;
    }

    const cityToToggle = weatherData?.current.city || currentCity;
    const existing = favorites.find((f) => f.city.toLowerCase() === cityToToggle.toLowerCase());

    if (existing) {
      await api.deleteFavorite(existing.id);
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      showToast(`Removed ${cityToToggle} from favorites`);
    } else {
      const { data } = await api.addFavorite(cityToToggle);
      if (data?.favorite) {
        setFavorites((prev) => [...prev, data.favorite]);
        showToast(`Saved ${cityToToggle} to favorites`);
      }
    }
  };

  const handleAddFavorite = async (city: string, notes?: string) => {
    if (!currentUser) return;
    const { data, error } = await api.addFavorite(city, notes);
    if (error) {
      showToast(error);
      return;
    }
    if (data?.favorite) {
      setFavorites((prev) => [...prev, data.favorite]);
      showToast(`Added ${city} to favorites`);
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    await api.deleteFavorite(id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const handleTogglePinFavorite = async (id: string, pinned: boolean) => {
    const { data } = await api.updateFavorite(id, { pinned });
    if (data?.favorite) {
      setFavorites((prev) => prev.map((f) => (f.id === id ? data.favorite : f)));
    }
  };

  // Fallback mode toggle
  const handleToggleFallbackMode = async () => {
    const { data } = await api.toggleFallbackMode();
    if (data) {
      setIsFallbackMode(data.fallbackModeForceEnabled);
      showToast(data.message);
      // Reload weather to reflect mode
      loadWeatherData(currentCity, data.fallbackModeForceEnabled);
    }
  };

  // Demo login
  const handleDemoLogin = async (type: 'admin' | 'user') => {
    const { data, error } = await api.demoLogin(type);
    if (data?.user) {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      setCurrentUser(data.user);
      setTempUnit(data.user.preferences.units);
      setSpeedUnit(data.user.preferences.speedUnit);
      showToast(`Logged in as ${data.user.role.toUpperCase()} (${data.user.name})`);
    } else if (error) {
      showToast(error);
    }
  };

  const handleLogout = () => {
    authStorage.removeToken();
    setCurrentUser(null);
    setFavorites([]);
    showToast('Signed out successfully');
  };

  const scrollToAiSection = () => {
    aiSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Compute daily highs and lows
  const highC = weatherData?.daily?.[0]?.maxTempC ?? 24;
  const lowC = weatherData?.daily?.[0]?.minTempC ?? 16;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-2xl text-xs font-semibold text-white animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        currentCity={currentCity}
        onSelectCity={(city) => {
          setCurrentCity(city);
          loadWeatherData(city);
        }}
        tempUnit={tempUnit}
        onToggleTempUnit={() => setTempUnit((u) => (u === 'celsius' ? 'fahrenheit' : 'celsius'))}
        speedUnit={speedUnit}
        onToggleSpeedUnit={() => setSpeedUnit((s) => (s === 'kmh' ? 'mph' : 'kmh'))}
        onOpenFavorites={() => setShowFavorites(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'login');
          setShowAuth(true);
        }}
        onOpenTests={() => setShowTests(true)}
        onLogout={handleLogout}
        onDemoLogin={handleDemoLogin}
        favoriteCount={favorites.length}
        isFallbackMode={isFallbackMode}
        onToggleFallbackMode={handleToggleFallbackMode}
        isLoadingWeather={isLoadingWeather}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {weatherData ? (
          <>
            {/* Primary Current Weather Display */}
            <WeatherHero
              current={weatherData.current}
              highC={highC}
              lowC={lowC}
              tempUnit={tempUnit}
              isFavorite={isCityFavorite}
              onToggleFavorite={handleToggleFavorite}
              onRefreshWeather={() => loadWeatherData(currentCity, isFallbackMode)}
              onFocusAi={scrollToAiSection}
              isLoading={isLoadingWeather}
            />

            {/* 24-Hour Forecast Scrollable Track */}
            <HourlyForecastCard
              hourly={weatherData.hourly}
              tempUnit={tempUnit}
              speedUnit={speedUnit}
            />

            {/* Meteorological Metrics Details Grid */}
            <WeatherMetricsGrid current={weatherData.current} speedUnit={speedUnit} />

            {/* Gemini AI Intelligence Section */}
            <div ref={aiSectionRef}>
              <AIInsightSection
                insight={aiInsight}
                current={weatherData.current}
                onRegenerate={(prompt) =>
                  loadAiInsights(currentCity, weatherData, prompt)
                }
                isLoading={isLoadingAi}
              />
            </div>

            {/* 7-Day Extended Outlook */}
            <DailyForecastCard daily={weatherData.daily} tempUnit={tempUnit} />
          </>
        ) : (
          <div className="py-24 text-center space-y-4">
            <CloudRain className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
            <h3 className="text-lg font-bold text-white">Loading Meteorological Feed...</h3>
            <p className="text-xs text-slate-400">
              Querying atmospheric variables for {currentCity}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AI WeatherWise API</span>
            <span>• Full-Stack MERN Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {isFallbackMode ? 'Deterministic Fallback Online' : 'Live Open-Meteo & Gemini 3.8'}
            </span>
            <button
              onClick={() => setShowTests(true)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Verify System Tests
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setShowAdmin(true)}
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                Admin Console
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <FavoritesDrawer
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        favorites={favorites}
        onSelectCity={(city) => {
          setCurrentCity(city);
          loadWeatherData(city);
        }}
        onAddFavorite={handleAddFavorite}
        onDeleteFavorite={handleDeleteFavorite}
        onTogglePin={handleTogglePinFavorite}
      />

      <WeatherHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectCity={(city) => {
          setCurrentCity(city);
          loadWeatherData(city);
        }}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        initialMode={authMode}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}`);
        }}
      />

      {currentUser && (
        <UserProfileModal
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          user={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            setTempUnit(updated.preferences.units);
            setSpeedUnit(updated.preferences.speedUnit);
            showToast('Preferences updated');
          }}
        />
      )}

      {currentUser?.role === 'admin' && (
        <AdminDashboard
          isOpen={showAdmin}
          onClose={() => setShowAdmin(false)}
          currentUser={currentUser}
        />
      )}

      <SystemTestSuite isOpen={showTests} onClose={() => setShowTests(false)} />
    </div>
  );
}
