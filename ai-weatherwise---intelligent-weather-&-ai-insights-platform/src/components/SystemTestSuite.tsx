import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { TestResult } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface SystemTestSuiteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemTestSuite: React.FC<SystemTestSuiteProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    timestamp: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const { data } = await api.runAllTests();
      if (data?.results) {
        setResults(data.results);
        setSummary(data.summary);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">System Verification Test Suite</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Automated End-to-End
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exercises Auth, Meteorological APIs, Resilient Fallback Engine, and Gemini AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run All System Tests</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Total Test Cases</div>
                <div className="text-2xl font-bold text-white mt-1">{summary.total}</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center">
                <div className="text-xs text-emerald-400">Passed Assertions</div>
                <div className="text-2xl font-bold text-emerald-300 mt-1">{summary.passed}</div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center">
                <div className="text-xs text-rose-400">Failed Assertions</div>
                <div className="text-2xl font-bold text-rose-300 mt-1">{summary.failed}</div>
              </div>
            </div>
          )}

          {results.length === 0 && !isRunning ? (
            <div className="py-16 text-center space-y-3">
              <Terminal className="w-10 h-10 text-indigo-400 mx-auto opacity-70" />
              <div className="text-sm font-semibold text-slate-200">
                Ready to execute system verification suite
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Validates JWT bcrypt authentication, User Document CRUD, live weather retrieval,
                fallback synthesizer resilience, and Gemini AI structured insight payloads.
              </p>
              <button
                onClick={handleRunTests}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/25"
              >
                <Play className="w-4 h-4" />
                <span>Launch Test Suite</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
                <span>Test Suite / Target</span>
                <span>Latency</span>
              </div>

              {results.map((res, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    res.status === 'passed'
                      ? 'bg-slate-950/70 border-slate-800/80 hover:border-emerald-500/40'
                      : 'bg-rose-950/30 border-rose-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {res.status === 'passed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/20">
                            {res.suite}
                          </span>
                          <span className="text-sm font-bold text-white">{res.testName}</span>
                        </div>
                        {res.details && (
                          <div className="text-xs text-slate-400 font-mono mt-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            {res.details}
                          </div>
                        )}
                        {res.error && (
                          <div className="text-xs text-rose-300 font-mono mt-1.5 bg-rose-950/60 p-2 rounded-lg border border-rose-800/50">
                            Error: {res.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      {res.durationMs} ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
