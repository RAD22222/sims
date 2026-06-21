import type { GameState, GameEvent, Notification } from '../types';
import { pickEvent, eventToGameEvent } from '../data/events.pool';

// Each day, small chance to spawn a new event
export function maybeSpawnEvent(state: GameState): GameState {
  // 12% chance per day, but only if no event fires today already
  if (Math.random() > 0.12) return state;
  const template = pickEvent(state.day, state.products.length);
  if (!template) return state;

  // Pick target product (if randomProduct/allProducts)
  let productId: 'company' | string = 'company';
  if (template.applyTo === 'randomProduct' && state.products.length > 0) {
    const live = state.products.filter((p) => p.status === 'live' || p.status === 'scaling');
    if (live.length > 0) {
      productId = live[Math.floor(Math.random() * live.length)].id;
    }
  }

  const gameEvent = eventToGameEvent(template, state.day, productId);
  const events = [...state.activeEvents, gameEvent];
  const notifications: Notification[] = [
    ...state.notifications,
    {
      id: `notif_${gameEvent.id}`,
      day: state.day,
      title: template.notification.title,
      body: template.notification.body,
      type: template.notification.type,
      read: false,
    },
  ];
  return { ...state, activeEvents: events, notifications };
}

// Expire events whose day + duration < state.day
export function expireEvents(state: GameState): GameState {
  const events = state.activeEvents.filter((e) => state.day - e.day < e.durationDays);
  return { ...state, activeEvents: events };
}
