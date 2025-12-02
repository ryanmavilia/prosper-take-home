import { Patient } from "./models/patient";
import { patient } from "./models/mock-patient";
import { clinician } from "./models/mock-clinician";
import { Appointment, AvailableAppointmentSlot } from "./models/appointment";
console.log("Hello, World!");

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
export const availableAppointmentPairs = (patient: Patient) => {
  const sortedSlots = matchedClinician.availableSlots.sort(
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
    clinician: matchedClinician,
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

console.log(availableAppointmentPairs(patient));

console.log(
  optimizeAvailableAppointments(clinician.availableSlots).map((slot) =>
    slot.date.toISOString()
  )
);
