import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Users,
  BarChart3,
  Sliders,
  Bell,
  Trash2,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle,
  Database,
} from 'lucide-react';
import { User, AdminAnalytics, SystemSettings, ApiUsageLog } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'settings' | 'broadcast'>('analytics');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [cacheStats, setCacheStats] = useState<{ entries: number; keys: string[] } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState('system');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, usersRes, settingsRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminUsers(),
        api.getAdminSettings(),
      ]);

      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data.analytics);
        setCacheStats(analyticsRes.data.cacheStats);
      }
      if (usersRes.data?.users) {
        setUsers(usersRes.data.users);
      }
      if (settingsRes.data?.settings) {
        setSettings(settingsRes.data.settings);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin') => {
    const { error } = await api.updateUserRole(userId, newRole);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setStatusMsg(`User role updated to ${newRole}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Permanently delete this user and all their records?')) {
      const { error } = await api.deleteUser(userId);
      if (!error) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setStatusMsg('User removed successfully');
      }
    }
  };

  const handleToggleFallbackMode = async () => {
    if (!settings) return;
    const { data } = await api.updateAdminSettings({
      fallbackModeForceEnabled: !settings.fallbackModeForceEnabled,
    });
    if (data?.settings) {
      setSettings(data.settings);
      setStatusMsg(
        data.settings.fallbackModeForceEnabled
          ? 'Resilient Fallback Mode forced ON platform-wide'
          : 'Resilient Fallback Mode set to automatic failover'
      );
    }
  };

  const handleClearCache = async () => {
    const { data } = await api.clearCache();
    setStatusMsg(data?.message || 'Weather cache purged');
    if (cacheStats) {
      setCacheStats({ entries: 0, keys: [] });
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;
    const { error } = await api.broadcastNotification(broadcastTitle, broadcastMsg, broadcastType);
    if (!error) {
      setStatusMsg('Broadcast notification delivered to all users');
      setBroadcastTitle('');
      setBroadcastMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Meteorological Admin Console</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Supervisor Level
                </span>
              </div>
              <p className="text-xs text-slate-400">
                System telemetry, user authorization, API caching & resilience management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status notice */}
        {statusMsg && (
          <div className="bg-cyan-950/40 border-b border-cyan-500/30 px-6 py-2 text-xs text-cyan-300 flex items-center justify-between">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg(null)} className="text-cyan-400 hover:text-cyan-200">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/40 overflow-x-auto no-scrollbar">
          {[
            { id: 'analytics', label: 'Telemetry & Analytics', icon: BarChart3 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'settings', label: 'Engine & Cache Controls', icon: Sliders },
            { id: 'broadcast', label: 'Broadcast Alerts', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ANALYTICS & TELEMETRY */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Stat metrics cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Registered Users</div>
                  <div className="text-2xl font-bold text-white mt-1">{analytics.totalUsers}</div>
                  <div className="text-[11px] text-emerald-400 mt-1">Full RBAC activated</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Weather Searches</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">{analytics.totalSearches}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Document collection items</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Avg API Latency</div>
                  <div className="text-2xl font-bold text-indigo-400 mt-1">
                    {analytics.averageResponseTimeMs} ms
                  </div>
                  <div className="text-[11px] text-indigo-300 mt-1">Optimized caching active</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Fallback Rate</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {analytics.fallbackRatePercentage}%
                  </div>
                  <div className="text-[11px] text-amber-300 mt-1">Deterministic resilience</div>
                </div>
              </div>

              {/* Popular cities & Cache status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Top Monitored Cities
                  </div>
                  <div className="space-y-2">
                    {analytics.popularCities.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-medium">{item.city}</span>
                        <span className="text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                          {item.count} queries
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                      <span>In-Memory Meteorological Cache</span>
                      <Database className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">
                      Cached entries: <span className="font-bold text-cyan-400">{cacheStats?.entries || 0}</span>
                      <div className="text-[11px] text-slate-400 mt-1 truncate">
                        Active keys: {cacheStats?.keys.join(', ') || 'No active cached keys'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="mt-4 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors self-start border border-slate-700"
                  >
                    Flush In-Memory Cache
                  </button>
                </div>
              </div>

              {/* Recent API Logs Table */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Recent API Usage Telemetry Logs
                  </div>
                  <span className="text-[11px] text-slate-400">Live request stream</span>
                </div>
                <div className="overflow-x-auto max-h-60 scrollbar-thin">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-2 font-medium">Method</th>
                        <th className="pb-2 font-medium">Endpoint</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Duration</th>
                        <th className="pb-2 font-medium">Fallback</th>
                        <th className="pb-2 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {analytics.recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/50">
                          <td className="py-2 font-mono text-cyan-400 font-bold">{log.method}</td>
                          <td className="py-2 truncate max-w-xs">{log.endpoint}</td>
                          <td className="py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                log.statusCode >= 400
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {log.statusCode}
                            </span>
                          </td>
                          <td className="py-2 font-mono">{log.responseTimeMs} ms</td>
                          <td className="py-2">
                            {log.isFallback ? (
                              <span className="text-amber-400 font-semibold text-[10px]">YES</span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">NO</span>
                            )}
                          </td>
                          <td className="py-2 text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                  Registered User Accounts ({users.length})
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Registered</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/50">
                          <td className="py-3 flex items-center gap-2">
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                              alt={u.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-semibold text-white">{u.name}</span>
                          </td>
                          <td className="py-3 text-slate-400">{u.email}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400 text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {u.id !== currentUser.id && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')
                                  }
                                  className="text-xs text-cyan-400 hover:underline font-medium"
                                >
                                  Make {u.role === 'admin' ? 'User' : 'Admin'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-xs text-rose-400 hover:underline font-medium ml-2"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENGINE & CACHE CONTROLS */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Resilience & Fallback Architecture
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Simulate Weather API Outage (Force Fallback Mode)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Forces the deterministic climatological synthesis engine to handle all queries, ensuring continuous availability even during total external network failure.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleFallbackMode}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      settings.fallbackModeForceEnabled
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {settings.fallbackModeForceEnabled ? 'Simulating Outage (ON)' : 'Live Mode (OFF)'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">External Provider</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {settings.externalProvider}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">AI Intelligence Core</div>
                    <div className="text-sm font-bold text-cyan-400 mt-1">
                      Google Gemini 3.8 Flash
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BROADCAST NOTIFICATIONS */}
          {activeTab === 'broadcast' && (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Broadcast System Notice to All Users
              </div>
              <p className="text-xs text-slate-400">
                Pushes an instantaneous notification into every active user&apos;s notification drawer.
              </p>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Typhoon Alert for East Asia"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Message Body</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide actionable advisory details..."
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="system">System Announcement</option>
                      <option value="alert">Severe Weather Alert</option>
                      <option value="forecast">Seasonal Forecast</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                >
                  Broadcast Notification
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
