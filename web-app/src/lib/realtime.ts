/**
 * Soketi/Pusher-compatible realtime client singleton.
 * If realtime is unavailable or disabled, consumers transparently fall back to polling.
 */

import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;
let connectionAttempted = false;
let fallbackLogged = false;

const SOKETI_HOST = import.meta.env.VITE_SOKETI_HOST || 'localhost';
const SOKETI_PORT = parseInt(import.meta.env.VITE_SOKETI_PORT || '6001', 10);
const SOKETI_APP_KEY = import.meta.env.VITE_SOKETI_APP_KEY || 'app-key';
const REALTIME_ENABLED = String(import.meta.env.VITE_ENABLE_REALTIME || 'false').toLowerCase() === 'true';

function logRealtimeFallback(reason: string): void {
  if (fallbackLogged) return;
  fallbackLogged = true;
  console.warn(`[Realtime] ${reason}; using polling fallback`);
}

/**
 * Get or create the Pusher client singleton.
 * Returns null when realtime is disabled/unavailable.
 */
export function getRealtimeClient(): Pusher | null {
  if (!REALTIME_ENABLED) {
    logRealtimeFallback('disabled by VITE_ENABLE_REALTIME');
    return null;
  }

  if (pusherInstance) return pusherInstance;
  if (connectionAttempted) return null;

  try {
    connectionAttempted = true;
    pusherInstance = new Pusher(SOKETI_APP_KEY, {
      wsHost: SOKETI_HOST,
      wsPort: SOKETI_PORT,
      wssPort: SOKETI_PORT,
      forceTLS: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      cluster: 'mt1',
    });

    pusherInstance.connection.bind('error', () => {
      logRealtimeFallback('connection error');
      pusherInstance?.disconnect();
      pusherInstance = null;
    });

    pusherInstance.connection.bind('unavailable', () => {
      logRealtimeFallback('service unavailable');
      pusherInstance?.disconnect();
      pusherInstance = null;
    });

    return pusherInstance;
  } catch {
    logRealtimeFallback('failed to initialize client');
    pusherInstance = null;
    return null;
  }
}

export function subscribeToChannel(channelName: string) {
  const client = getRealtimeClient();
  if (!client) return null;
  return client.subscribe(channelName);
}

export function unsubscribeFromChannel(channelName: string) {
  const client = getRealtimeClient();
  if (!client) return;
  client.unsubscribe(channelName);
}

export function useRealtimeNotifications(
  userId: string | undefined,
  onNotification: (data: any) => void
) {
  if (!userId) return;

  const channel = subscribeToChannel(`private-user.${userId}`);
  if (!channel) return;

  channel.bind('new-notification', onNotification);

  return () => {
    channel.unbind('new-notification', onNotification);
    unsubscribeFromChannel(`private-user.${userId}`);
  };
}

export function useRealtimeMessages(
  bookingId: string | undefined,
  onMessage: (data: any) => void
) {
  if (!bookingId) return;

  const channel = subscribeToChannel(`presence-messages.${bookingId}`);
  if (!channel) return;

  channel.bind('new-message', onMessage);

  return () => {
    channel.unbind('new-message', onMessage);
    unsubscribeFromChannel(`presence-messages.${bookingId}`);
  };
}
