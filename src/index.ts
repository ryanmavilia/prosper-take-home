import {
  Appointment,
  AppointmentType,
  AvailableAppointmentSlot,
} from "./models/appointment";
import { Clinician } from "./models/clinician";
import { Patient } from "./models/patient";

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
 * First filters slots based on capacity constraints, then finds all valid pairs within 1 to 7 calendar days apart.
 *
 * @param patient patient seeking appointments
 * @returns available appointment pairs and matched clinician
 */
export const findAvailableAppointmentPairs = (
  patient: Patient,
  clinician: Clinician
) => {
  if (
    !clinician.states.includes(patient.state) ||
    !clinician.insurances.includes(patient.insurance)
  ) {
    return {
      clinician: null,
      pairs: [],
    };
  }

  const filteredByCapacity = filterSlotsPerCapacity(
    clinician.availableSlots,
    clinician.appointments,
    clinician.maxDailyAppointments,
    clinician.maxWeeklyAppointments
  );

  const sortedSlots = filteredByCapacity.sort(
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
 * First filters slots based on capacity constraints, then selects the maximum number of non-overlapping slots.
 *
 * @param availableAppointmentSlots the available apointment slots for a clinician(s)
 * @returns the optimized available slots
 */
export const optimizeAvailableAppointments = (
  availableAppointmentSlots: AvailableAppointmentSlot[],
  clinician: Clinician
) => {
  const filteredByCapacity = filterSlotsPerCapacity(
    availableAppointmentSlots,
    clinician.appointments,
    clinician.maxDailyAppointments,
    clinician.maxWeeklyAppointments
  );

  const intervals = filteredByCapacity.map((slot) => {
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

  const appointmentIntervals: Array<{ start: number; end: number }> = [];

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

    const start = date.getTime();
    const end =
      start + getAppointmentLength(appointment.appointmentType) * 60 * 1000;
    appointmentIntervals.push({ start, end });
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

    if (
      currentDailyCount >= maxDailyAppointments ||
      currentWeeklyCount >= maxWeeklyAppointments
    ) {
      return false;
    }

    const slotStart = date.getTime();
    const slotEnd = slotStart + slot.length * 60 * 1000;

    for (const appt of appointmentIntervals) {
      if (slotStart < appt.end && appt.start < slotEnd) {
        return false;
      }
    }

    return true;
  });
};

// Helper to get appointment length based on type
function getAppointmentLength(type: AppointmentType): number {
  switch (type) {
    case "ASSESSMENT_SESSION_1":
    case "ASSESSMENT_SESSION_2":
      return 90;
    case "THERAPY_INTAKE":
    case "THERAPY_SIXTY_MINS":
      return 60;
  }
}
