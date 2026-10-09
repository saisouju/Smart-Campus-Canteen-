import type { TimeSlot } from '@canteen/shared';
import { addDays, toLocalDate } from './dates.js';

/** Canteen pickup window and slot granularity. */
export const SLOT_CONFIG = {
  openMinutes: 8 * 60, // 08:00
  closeMinutes: 20 * 60, // 20:00
  slotMinutes: 30,
  /** Kitchen needs this much lead time before a slot starts. */
  leadMinutes: 10,
  /** Max orders accepted per slot. */
  capacity: 15,
} as const;

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

function to12h(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(minutes % 60)} ${h24 < 12 ? 'AM' : 'PM'}`;
}

interface SlotDefinition {
  id: string;
  label: string;
  startMinutes: number;
}

/** All slots for a calendar day. Ids look like "2026-10-07@12:00-12:30". */
function slotsForDay(day: Date, isToday: boolean): SlotDefinition[] {
  const date = toLocalDate(day);
  const slots: SlotDefinition[] = [];
  for (let start = SLOT_CONFIG.openMinutes; start < SLOT_CONFIG.closeMinutes; start += SLOT_CONFIG.slotMinutes) {
    const end = start + SLOT_CONFIG.slotMinutes;
    const range = `${to12h(start)} - ${to12h(end)}`;
    slots.push({
      id: `${date}@${hhmm(start)}-${hhmm(end)}`,
      label: isToday ? range : `Tomorrow · ${range}`,
      startMinutes: start,
    });
  }
  return slots;
}

/**
 * Slots a customer may still book. Once today's last slot has passed, tomorrow's
 * schedule is offered so the app is usable at any hour.
 */
function bookableDefinitions(now: Date): SlotDefinition[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = slotsForDay(now, true).filter(
    (s) => s.startMinutes - SLOT_CONFIG.leadMinutes >= nowMinutes,
  );
  return today.length > 0 ? today : slotsForDay(addDays(now, 1), false);
}

/**
 * @param bookedCount returns how many orders already hold a given slot label.
 */
export function listTimeSlots(now: Date, bookedCount: (label: string) => number): TimeSlot[] {
  return bookableDefinitions(now).map((slot) => {
    const remaining = Math.max(0, SLOT_CONFIG.capacity - bookedCount(slot.label));
    return { id: slot.id, label: slot.label, remaining, available: remaining > 0 };
  });
}

/** Maps a client-supplied slot id to its stored label, or null if it is not bookable right now. */
export function resolveTimeSlot(id: string, now: Date): { label: string } | null {
  const match = bookableDefinitions(now).find((s) => s.id === id);
  return match ? { label: match.label } : null;
}

/** Label for an arbitrary start time on "today" (used by the seeder). */
export function slotLabelAt(startMinutes: number): string {
  return `${to12h(startMinutes)} - ${to12h(startMinutes + SLOT_CONFIG.slotMinutes)}`;
}
