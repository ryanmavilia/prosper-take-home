import { Clinician } from "./clinician";
import { MOCK_SLOT_DATA } from "./mock-slot-data";
import { randomUUID } from "crypto";

const clinicianId = "9c516382-c5b2-4677-a7ac-4e100fa35bdd";

export const clinician: Clinician = {
  id: clinicianId,
  firstName: "Jane",
  lastName: "Doe",
  states: ["NY", "CA"],
  insurances: ["AETNA", "CIGNA"],
  clinicianType: "PSYCHOLOGIST",
  appointments: [],
  availableSlots: MOCK_SLOT_DATA.map((slot) => ({
    id: randomUUID(),
    clinicianId,
    date: new Date(slot.date),
    length: slot.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  maxDailyAppointments: 2,
  maxWeeklyAppointments: 8,
  createdAt: new Date(),
  updatedAt: new Date(),
};
