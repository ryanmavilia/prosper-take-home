import {
  availableAppointmentPairs,
  optimizeAvailableAppointments,
  filterSlotsPerCapacity,
} from "./index";
import { AvailableAppointmentSlot, Appointment } from "./models/appointment";

describe("Task 1: availableAppointmentPairs", () => {
  it("should generate expected pairs from README example", () => {
    const expectedPairs = [
      ["2024-08-19T12:00:00.000Z", "2024-08-21T12:00:00.000Z"],
      ["2024-08-19T12:00:00.000Z", "2024-08-21T15:00:00.000Z"],
      ["2024-08-19T12:00:00.000Z", "2024-08-22T15:00:00.000Z"],
      ["2024-08-19T12:15:00.000Z", "2024-08-21T12:00:00.000Z"],
      ["2024-08-19T12:15:00.000Z", "2024-08-21T15:00:00.000Z"],
      ["2024-08-19T12:15:00.000Z", "2024-08-22T15:00:00.000Z"],
      ["2024-08-21T12:00:00.000Z", "2024-08-22T15:00:00.000Z"],
      ["2024-08-21T12:00:00.000Z", "2024-08-28T12:15:00.000Z"],
      ["2024-08-21T15:00:00.000Z", "2024-08-22T15:00:00.000Z"],
      ["2024-08-21T15:00:00.000Z", "2024-08-28T12:15:00.000Z"],
      ["2024-08-22T15:00:00.000Z", "2024-08-28T12:15:00.000Z"],
    ];

    const result = availableAppointmentPairs();

    expectedPairs.forEach((expectedPair) => {
      const found = result.pairs.some(
        (pair) => pair[0] === expectedPair[0] && pair[1] === expectedPair[1]
      );
      expect(found).toBe(true);
    });
  });
});

describe("Task 2: optimizeAvailableAppointments", () => {
  it("should return 12:00 and 13:30 for README example", () => {
    const slots: AvailableAppointmentSlot[] = [
      "2024-08-19T12:00:00.000Z",
      "2024-08-19T12:15:00.000Z",
      "2024-08-19T12:30:00.000Z",
      "2024-08-19T12:45:00.000Z",
      "2024-08-19T13:00:00.000Z",
      "2024-08-19T13:15:00.000Z",
      "2024-08-19T13:30:00.000Z",
    ].map((date, i) => ({
      id: `${i + 1}`,
      clinicianId: "test-clinician",
      date: new Date(date),
      length: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = optimizeAvailableAppointments(slots);

    expect(result).toHaveLength(2);
    expect(result[0].date.toISOString()).toBe("2024-08-19T12:00:00.000Z");
    expect(result[1].date.toISOString()).toBe("2024-08-19T13:30:00.000Z");
  });
});

describe("Task 3: filterSlotsPerCapacity", () => {
  it("should filter slots when maxDailyAppointments is reached", () => {
    const availableSlots: AvailableAppointmentSlot[] = [
      {
        id: "slot1",
        clinicianId: "clinician1",
        date: new Date("2024-08-19T10:00:00.000Z"),
        length: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const scheduledAppointments: Appointment[] = [
      {
        id: "appt1",
        patientId: "patient1",
        clinicianId: "clinician1",
        scheduledFor: new Date("2024-08-19T09:00:00.000Z"),
        appointmentType: "ASSESSMENT_SESSION_1",
        status: "UPCOMING",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "appt2",
        patientId: "patient2",
        clinicianId: "clinician1",
        scheduledFor: new Date("2024-08-19T12:00:00.000Z"),
        appointmentType: "ASSESSMENT_SESSION_2",
        status: "UPCOMING",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = filterSlotsPerCapacity(
      availableSlots,
      scheduledAppointments,
      2, // maxDailyAppointments
      8 // maxWeeklyAppointments
    );

    expect(result).toHaveLength(0);
  });

  it("should filter slots when maxWeeklyAppointments is reached", () => {
    const availableSlots: AvailableAppointmentSlot[] = [
      {
        id: "slot1",
        clinicianId: "clinician1",
        date: new Date("2024-08-19T10:00:00.000Z"),
        length: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 8 appointments spread across the week of Aug 18-24
    const scheduledAppointments: Appointment[] = [
      "2024-08-19T09:00:00.000Z",
      "2024-08-19T14:00:00.000Z",
      "2024-08-20T09:00:00.000Z",
      "2024-08-20T14:00:00.000Z",
      "2024-08-21T09:00:00.000Z",
      "2024-08-21T14:00:00.000Z",
      "2024-08-22T09:00:00.000Z",
      "2024-08-22T14:00:00.000Z",
    ].map((date, i) => ({
      id: `appt${i}`,
      patientId: `patient${i}`,
      clinicianId: "clinician1",
      scheduledFor: new Date(date),
      appointmentType: "ASSESSMENT_SESSION_1" as const,
      status: "UPCOMING" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = filterSlotsPerCapacity(
      availableSlots,
      scheduledAppointments,
      2, // maxDailyAppointments
      8 // maxWeeklyAppointments
    );

    expect(result).toHaveLength(0);
  });
});
