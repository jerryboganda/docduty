/**
 * Server-side Soketi/Pusher trigger utility.
 * Pushes events to the local Soketi WebSocket server.
 *
 * Usage:
 *   import { triggerEvent, notifyUser, notifyBooking } from './pusher';
 *
 * Requires Soketi running locally. If Soketi is unavailable, events are silently dropped
 * (the DB notification row is still created, so the frontend can fall back to polling).
 */

import Pusher from 'pusher';
import { logger } from './logger.js';

const SOKETI_HOST = process.env.SOKETI_HOST || '127.0.0.1';
const SOKETI_PORT = process.env.SOKETI_PORT || '6001';
const SOKETI_APP_ID = process.env.SOKETI_APP_ID || 'app-id';
const SOKETI_APP_KEY = process.env.SOKETI_APP_KEY || 'app-key';
const SOKETI_APP_SECRET = process.env.SOKETI_APP_SECRET || 'app-secret';

let pusher: Pusher | null = null;

function getPusher(): Pusher | null {
  if (pusher) return pusher;
  try {
    pusher = new Pusher({
      appId: SOKETI_APP_ID,
      key: SOKETI_APP_KEY,
      secret: SOKETI_APP_SECRET,
      host: SOKETI_HOST,
      port: SOKETI_PORT,
      useTLS: false,
      cluster: 'mt1',
    });
    return pusher;
  } catch {
    logger.error('Failed to initialize Pusher client');
    return null;
  }
}

/**
 * Trigger a generic event on a channel.
 * Silently fails if Soketi is unavailable (polling fallback).
 */
export async function triggerEvent(
  channel: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const client = getPusher();
  if (!client) return;
  try {
    await client.trigger(channel, event, data);
  } catch {
    // Soketi not running — notifications still exist in DB for polling
  }
}

/**
 * Send a real-time notification to a specific user.
 * Channel: private-user.{userId}, Event: new-notification
 */
export async function notifyUser(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    entity_type?: string;
    entity_id?: string;
  }
): Promise<void> {
  await triggerEvent(`private-user.${userId}`, 'new-notification', notification);
}

/**
 * Send a real-time message event to a booking chat channel.
 * Channel: presence-messages.{bookingId}, Event: new-message
 */
export async function notifyBooking(
  bookingId: string,
  message: {
    id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    sent_at: string;
  }
): Promise<void> {
  await triggerEvent(`presence-messages.${bookingId}`, 'new-message', message);
}
