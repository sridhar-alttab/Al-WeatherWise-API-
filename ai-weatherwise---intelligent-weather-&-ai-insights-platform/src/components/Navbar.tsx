import React, { useState, useEffect, useRef } from 'react';
import {
  CloudLightning,
  Search,
  Bookmark,
  History,
  Bell,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Sparkles,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { User, TemperatureUnit, SpeedUnit, NotificationItem } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface NavbarProps {
  currentUser: User | null;
  currentCity: string;
  onSelectCity: (city: string) => void;
  tempUnit: TemperatureUnit;
  onToggleTempUnit: () => void;
  speedUnit: SpeedUnit;
  onToggleSpeedUnit: () => void;
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenTests: () => void;
  onLogout: () => void;
  onDemoLogin: (type: 'admin' | 'user') => void;
  favoriteCount: number;
  isFallbackMode: boolean;
  onToggleFallbackMode: () => void;
  isLoadingWeather: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentCity,
  onSelectCity,
  tempUnit,
  onToggleTempUnit,
  onOpenFavorites,
  onOpenHistory,
  onOpenAdmin,
  onOpenProfile,
  onOpenAuth,
  onOpenTests,
  onLogout,
  onDemoLogin,
  favoriteCount,
  isFallbackMode,
  onToggleFallbackMode,
  isLoadingWeather,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (currentUser) {
      api.getNotifications().then(({ data }) => {
        if (data?.notifications) {
          setNotifications(data.notifications);
        }
      });
    }
  }, [currentUser]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectCity(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const QUICK_CITIES = ['Tokyo', 'New York', 'London', 'Paris', 'Sydney', 'San Francisco', 'Dubai'];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCity('Tokyo')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <CloudLightning className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                    AI WeatherWise
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    API Platform
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>MERN + Gemini AI</span>
                </div>
              </div>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search city (e.g., Tokyo, London, Singapore)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {isLoadingWeather && (
                <RefreshCw className="w-4 h-4 text-cyan-400 absolute right-3.5 top-3 animate-spin" />
              )}
            </form>
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Unit Toggle */}
            <button
              onClick={onToggleTempUnit}
              title={`Switch to ${tempUnit === 'celsius' ? '°F' : '°C'}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
            >
              <span className={tempUnit === 'celsius' ? 'text-cyan-400' : 'text-slate-500'}>°C</span>
              <span className="text-slate-600">/</span>
              <span className={tempUnit === 'fahrenheit' ? 'text-cyan-400' : 'text-slate-500'}>°F</span>
            </button>

            {/* Fallback Mode Toggle */}
            <button
              onClick={onToggleFallbackMode}
              title={
                isFallbackMode
                  ? 'Simulating Fallback Mode (Click to toggle Live API)'
                  : 'Live Meteorological Mode (Click to simulate fallback downtime)'
              }
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isFallbackMode
                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/40'
                  : 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isFallbackMode ? 'Fallback Mode' : 'Live Feed'}</span>
            </button>

            {/* System Test Suite Button */}
            <button
              onClick={onOpenTests}
              title="Run Automated Verification Tests"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs font-medium text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-400 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">System Tests</span>
            </button>

            {/* Favorites Button */}
            <button
              onClick={onOpenFavorites}
              title="Saved Cities"
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-cyan-500 text-slate-950">
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              title="Search History"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="font-semibold text-sm text-slate-200">System Notifications</div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No notifications currently.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            n.read ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-800/40 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-slate-200">{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth Menu */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-cyan-500/50"
                  />
                  <span className="text-xs font-medium text-slate-200 max-w-[90px] truncate hidden sm:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <div className="font-medium text-xs text-slate-200 truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                    </div>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAdmin();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-amber-300 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Manage Profile</span>
                    </button>

                    <div className="border-t border-slate-800 my-1" />

                    <div className="px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Switch Demo Persona
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onDemoLogin(currentUser.role === 'admin' ? 'user' : 'admin');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-cyan-400 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Switch to {currentUser.role === 'admin' ? 'Demo User' : 'Admin'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDemoLogin('user')}
                  title="Instant login with pre-configured demo account"
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-medium transition-all"
                >
                  Demo User
                </button>
                <button
                  onClick={() => onDemoLogin('admin')}
                  title="Instant login with full admin rights"
                  className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/40 text-xs font-medium transition-all hidden sm:block"
                >
                  Admin
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="py-2.5 md:hidden border-t border-slate-900">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          </form>
        </div>

        {/* Quick city selectors chips */}
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Popular:
          </span>
          {QUICK_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => onSelectCity(city)}
              className={`px-2.5 py-0.5 rounded-full shrink-0 transition-all font-medium text-[11px] ${
                currentCity.toLowerCase() === city.toLowerCase()
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
