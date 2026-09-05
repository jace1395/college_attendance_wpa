import React from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

/**
 * OfflineBanner
 *
 * Global offline/sync status banner. Mount ONCE in App.jsx inside <Router>
 * and above <Routes>. It:
 *   - Shows an amber banner when navigator.onLine is false.
 *   - Shows a blue "syncing" banner while flushing the IndexedDB queue.
 *   - Disables nothing on its own — consumers should use the exported
 *     `isOnline` value from useOfflineSync() to gate form submissions.
 */
const OfflineBanner = () => {
  const { isOnline, isSyncing } = useOfflineSync();

  if (isOnline && !isSyncing) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold shadow-lg transition-all
        ${isOnline
          ? 'bg-blue-600 text-white'        // Syncing — blue
          : 'bg-amber-500 text-slate-900'   // Offline — amber
        }`}
    >
      {!isOnline ? (
        <>
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M9 10a3 3 0 106 0"
            />
          </svg>
          You are offline. Attendance can still be marked — it will sync automatically when you reconnect.
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 animate-spin shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Back online — syncing queued attendance records...
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
