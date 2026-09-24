import React, { useState } from 'react';
import {
  Sparkles,
  Shirt,
  Car,
  Compass,
  AlertTriangle,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bot,
} from 'lucide-react';
import { AIInsight, CurrentWeather } from '../types/index.js';

interface AIInsightSectionProps {
  insight: AIInsight | null;
  current: CurrentWeather;
  onRegenerate: (customPrompt?: string) => Promise<void>;
  isLoading: boolean;
}

export const AIInsightSection: React.FC<AIInsightSectionProps> = ({
  insight,
  current,
  onRegenerate,
  isLoading,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'clothing' | 'travel' | 'activities' | 'severe'>('overview');

  const handleSubmitCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || isLoading) return;
    await onRegenerate(customPrompt.trim());
    setCustomPrompt('');
  };

  const getDrivingBadge = (condition: string) => {
    switch (condition) {
      case 'Optimal':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Caution':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Hazardous':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Google Gemini AI Insights</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {insight?.aiModel || 'Gemini 3.8 Flash'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Intelligent meteorological summaries, clothing, commute & lifestyle recommendations
            </p>
          </div>
        </div>

        <button
          onClick={() => onRegenerate()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Synthesizing...' : 'Regenerate'}</span>
        </button>
      </div>

      {/* Custom Prompt Bar */}
      <form onSubmit={handleSubmitCustomPrompt} className="my-5 relative">
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-2xl p-1.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all">
          <Bot className="w-5 h-5 text-cyan-400 ml-3 shrink-0" />
          <input
            type="text"
            placeholder="Ask Gemini AI (e.g. 'Can I jog at 6 PM?', 'What should a toddler wear today?')..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={isLoading}
            className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!customPrompt.trim() || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:hover:bg-cyan-500 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-800/80 no-scrollbar">
        {[
          { id: 'overview', label: 'Summary', icon: Sparkles },
          { id: 'clothing', label: 'Clothing Advisor', icon: Shirt },
          { id: 'travel', label: 'Commute & Travel', icon: Car },
          { id: 'activities', label: 'Activity Suggestions', icon: Compass },
          { id: 'severe', label: 'Severe & Safety', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {isLoading && !insight ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-sm font-semibold text-slate-200">
            Synthesizing weather data with Gemini 3.8 Flash...
          </div>
          <div className="text-xs text-slate-500 max-w-sm">
            Analyzing temperature curves, humidity, UV index, and atmospheric variables for {current.city}
          </div>
        </div>
      ) : insight ? (
        <div className="space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 leading-relaxed text-sm text-slate-200">
                <p className="text-slate-200">{insight.summary}</p>
              </div>

              {/* Quick highlight cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                    <Shirt className="w-4 h-4" />
                    <span>Outfit Style</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{insight.clothing.title}</div>
                  <div className="text-xs text-slate-400 line-clamp-2">{insight.clothing.advice}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 mb-1.5">
                    <Car className="w-4 h-4" />
                    <span>Transit Condition</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">Driving:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getDrivingBadge(
                        insight.travel.drivingCondition
                      )}`}
                    >
                      {insight.travel.drivingCondition}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-2">
                    Flights: {insight.travel.flightImpact}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                    <Compass className="w-4 h-4" />
                    <span>Prime Window</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Best Outdoor Time</div>
                  <div className="text-xs text-slate-400">{insight.activities.bestTimeOfDay}</div>
                </div>
              </div>
            </div>
          )}

          {/* CLOTHING TAB */}
          {activeTab === 'clothing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-sm font-bold text-white mb-1">{insight.clothing.title}</div>
                <div className="text-xs text-slate-300">{insight.clothing.advice}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Outfit list */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                    Recommended Garments
                  </div>
                  <ul className="space-y-2">
                    {insight.clothing.outfit.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Accessories list */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                    Essential Accessories
                  </div>
                  <ul className="space-y-2">
                    {insight.clothing.accessories.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TRAVEL TAB */}
          {activeTab === 'travel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Roadway Driving Safety</div>
                    <div className="text-base font-bold text-white mt-1">Driving Index</div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getDrivingBadge(
                      insight.travel.drivingCondition
                    )}`}
                  >
                    {insight.travel.drivingCondition}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Commercial Aviation Impact</div>
                    <div className="text-base font-bold text-white mt-1">Airport Departure Status</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {insight.travel.flightImpact}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                  Commuter Precautions
                </div>
                <ul className="space-y-2">
                  {insight.travel.precautions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ACTIVITIES TAB */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                <Compass className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-slate-400">Optimal Window for Outdoor Recreation</div>
                  <div className="text-sm font-bold text-white">{insight.activities.bestTimeOfDay}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Recommended Pursuits</span>
                  </div>
                  <ul className="space-y-2">
                    {insight.activities.recommended.map((act, idx) => (
                      <li key={idx} className="text-xs text-slate-200">
                        • {act}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Avoid or Reschedule</span>
                  </div>
                  <ul className="space-y-2">
                    {insight.activities.avoid.length > 0 ? (
                      insight.activities.avoid.map((act, idx) => (
                        <li key={idx} className="text-xs text-slate-300">
                          • {act}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-400">No outdoor restrictions detected.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SEVERE & SAFETY TAB */}
          {activeTab === 'severe' && (
            <div className="space-y-4">
              <div
                className={`p-5 rounded-2xl border ${
                  insight.severeAlerts.severity === 'none'
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      insight.severeAlerts.severity === 'none' ? 'text-slate-400' : 'text-rose-400'
                    }`}
                  />
                  <div className="text-base font-bold text-white">{insight.severeAlerts.title}</div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      insight.severeAlerts.severity === 'none'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    Severity: {insight.severeAlerts.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{insight.severeAlerts.description}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                  Safety & Health Directives
                </div>
                <ul className="space-y-2">
                  {insight.severeAlerts.actionableSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
