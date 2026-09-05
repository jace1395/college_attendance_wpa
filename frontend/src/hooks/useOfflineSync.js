import { useState, useEffect, useCallback } from 'react';
import { getPendingAttendance, removePendingAttendance } from '../utils/indexedDB';
import { markAttendance } from '../services/api';

/**
 * useOfflineSync
 *
 * Tracks navigator.onLine and automatically flushes the IndexedDB
 * attendance queue when the browser reconnects to the internet.
 *
 * Returns:
 *   isOnline  {boolean} — current connection status
 *   isSyncing {boolean} — true while a flush is in progress
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  const flushQueue = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const pending = await getPendingAttendance();
      if (pending.length === 0) return;

      console.log(`[OfflineSync] Flushing ${pending.length} queued attendance record(s)...`);

      for (const record of pending) {
        try {
          const { id, timestamp, ...payload } = record; // Strip IDB metadata before posting
          await markAttendance(payload);
          await removePendingAttendance(id);
          console.log(`[OfflineSync] Record id=${id} synced and removed from queue.`);
        } catch (err) {
          // Keep in queue on failure (server error / validation) and continue
          console.error(`[OfflineSync] Failed to sync record id=${record.id}:`, err);
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue(); // Auto-trigger sync the moment connection is restored
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  return { isOnline, isSyncing };
};
