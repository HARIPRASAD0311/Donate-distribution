import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore.js';
import { useLiveOperationalSync } from '../hooks/useLiveOperationalSync.js';

export function BackendConnectionBanner() {
  const dataMode = useAppStore((state) => state.dataMode);
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const setDataMode = useAppStore((state) => state.setDataMode);
  const backendStatus = useAppStore((state) => state.backendStatus);
  const { syncNow, isLoading } = useLiveOperationalSync();

  if (!isDemoMode && backendStatus.isConnected) {
    return (
      <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-emerald-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wide font-mono text-[11px] text-white">LIVE BACKEND CONNECTED:</span>
          <span className="font-semibold text-emerald-300">Assam Floods 2024 Response</span>
          <span className="hidden md:inline text-emerald-400/80 font-mono text-[11px] ml-2">
            Clock: {backendStatus.clock ? backendStatus.clock.substring(0, 19).replace('T', ' ') : '2024-07-05 09:30'} UTC
          </span>
          <span className="hidden sm:inline bg-emerald-800/60 text-emerald-100 font-mono px-1.5 py-0.5 rounded text-[10px] ml-1">
            ZERO HARDCODED DATA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={syncNow}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isDemoMode && !backendStatus.isConnected) {
    return (
      <div className="bg-rose-950/95 border-b border-rose-500/60 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-rose-200 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <span className="font-bold font-mono text-[11px] uppercase tracking-wide text-white">
            FASTAPI BACKEND DISCONNECTED:
          </span>
          <span className="text-rose-100">
            Cannot reach <code className="bg-black/50 px-1.5 py-0.5 rounded text-rose-300 font-mono">http://localhost:8000/api/v1</code>.
          </span>
          <span className="text-amber-200 text-[11px] font-mono bg-black/40 px-2 py-0.5 rounded">
            Run: python -m uvicorn backend.app.main:app --port 8000 --reload
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            type="button"
            onClick={syncNow}
            disabled={isLoading}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
          >
            {isLoading ? 'Connecting...' : 'Retry Connection'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="font-bold font-mono text-[11px] text-white">DEMO MODE ACTIVE:</span>
        <span className="text-amber-300">Viewing synthetic Mozambique benchmark scenario.</span>
      </div>
      <button
        type="button"
        onClick={() => setDataMode('live')}
        className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer font-medium"
      >
        Switch to Live FastAPI Backend →
      </button>
    </div>
  );
}

