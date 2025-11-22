import type { Dayjs } from "dayjs";

export interface RecurrenceInput {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  selectedDays: number[];     // For weekly recurrence: [0 (Sun) - 6 (Sat)]
  ends: "never" | "on" | "after";
  endDate: Dayjs | null;
  occurrences: number;
  startDatetime: Dayjs;
  eventId: number;
  nthWeek?: number | null;    // For monthly recurrence: 1-5 or -1 for last week
}

export interface RecurrenceOutput {
  dbRecurrence: {
    frequency: string;
    interval: number;
    count: number | null;
    until: string | null;
    event_id: number;
    by_day: string[] | null;
    by_month: number | null;
    by_month_day: number | null;
    start_datetime: string;
  };
  summary: string;
}

export type RRuleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type DBRecurrenceEnds = "never" | "on" | "after";
