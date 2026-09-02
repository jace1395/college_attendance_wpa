import { precacheAndRoute } from 'workbox-precaching';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

// Precache static assets (injected by build tool)
precacheAndRoute(self.__WB_MANIFEST || []);

// Background Sync for Attendance
const bgSyncPlugin = new BackgroundSyncPlugin('attendance-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)
});

registerRoute(
  /\/api\/attendance/,
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

self.addEventListener('sync', (event) => {
  if (event.tag === 'workbox-background-sync:attendance-sync-queue') {
    // Attempting to sync, could message clients if needed
    console.log('[Service Worker] Background sync triggered for attendance queue.');
  }
});
