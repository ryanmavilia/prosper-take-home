import { clinician } from "./models/mock-clinician";
import { Appointment, AvailableAppointmentSlot } from "./models/appointment";

type SlotPair = {
  slot1: { id: string; clinicianId: string; date: Date; length: number };
  slot2: { id: string; clinicianId: string; date: Date; length: number };
};

const getCalendarDayDiff = (date1: Date, date2: Date) => {
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

/**
 * Finds available appointment slot pairs for a patient with a matched clinician.
 *
 * @param patient patient seeking appointments
 * @returns available appointment pairs and matched clinician
 */
export const availableAppointmentPairs = () => {
  const sortedSlots = clinician.availableSlots.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const pairs: SlotPair[] = [];

  // Two pointer early termination
  // O(n*k) where k is avg slots within range
  for (let i = 0; i < sortedSlots.length; i++) {
    for (let j = i + 1; j < sortedSlots.length; j++) {
      const daysDiff = getCalendarDayDiff(
        sortedSlots[i].date,
        sortedSlots[j].date
      );

      // Early termination - all remaining slots are too far
      if (daysDiff > 7) {
        break;
      }

      // At least 1 calendar day apart and no more than 7 calendar days
      if (daysDiff >= 1) {
        pairs.push({
          slot1: sortedSlots[i],
          slot2: sortedSlots[j],
        });
      }
    }
  }

  return {
    clinician: clinician,
    pairs: pairs.map((pair) => [
      pair.slot1.date.toISOString(),
      pair.slot2.date.toISOString(),
    ]),
  };
};

/**
 * Uses the greedy algorithm to optimize available appointment slots.
 *
 * @param availableAppointmentSlots the available apointment slots for a clinician(s)
 * @returns the optimized available slots
 */
export const optimizeAvailableAppointments = (
  availableAppointmentSlots: AvailableAppointmentSlot[]
) => {
  const intervals = availableAppointmentSlots.map((slot) => {
    const start = slot.date.getTime();
    const end = start + slot.length * 60 * 1000;
    return {
      start,
      end,
      iso: slot,
    };
  });
  intervals.sort((a, b) => a.end - b.end);

  const selected: AvailableAppointmentSlot[] = [];
  let lastEnd = -Infinity;

  for (const interval of intervals) {
    if (interval.start >= lastEnd) {
      selected.push(interval.iso);
      lastEnd = interval.end;
    }
  }

  return selected;
};

/**
 *
 * @param availableSlots current slots available
 * @param scheduledAppointments appointments already scheduled
 * @param maxDailyAppointments maximum allowed appointments per day
 * @param maxWeeklyAppointments maximum allowed appointments per week
 * @returns filtered available slots based on capacity constraints
 */
export const filterSlotsPerCapacity = (
  availableSlots: AvailableAppointmentSlot[],
  scheduledAppointments: Appointment[],
  maxDailyAppointments: number,
  maxWeeklyAppointments: number
): AvailableAppointmentSlot[] => {
  const dailyCount: Record<string, number> = {};
  const weeklyCount: Record<string, number> = {};

  for (const appointment of scheduledAppointments) {
    if (appointment.status !== "UPCOMING") {
      continue;
    }

    const date = appointment.scheduledFor;
    const dayKey = date.toISOString().split("T")[0];

    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split("T")[0];

    dailyCount[dayKey] = (dailyCount[dayKey] || 0) + 1;
    weeklyCount[weekKey] = (weeklyCount[weekKey] || 0) + 1;
  }

  return availableSlots.filter((slot) => {
    const date = slot.date;
    const dayKey = date.toISOString().split("T")[0];

    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split("T")[0];

    const currentDailyCount = dailyCount[dayKey] || 0;
    const currentWeeklyCount = weeklyCount[weekKey] || 0;

    return (
      currentDailyCount < maxDailyAppointments &&
      currentWeeklyCount < maxWeeklyAppointments
    );
  });
};
