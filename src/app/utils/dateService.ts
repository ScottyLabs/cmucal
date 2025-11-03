import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { DBRecurrenceEnds, RecurrenceInput, RecurrenceOutput, RRuleFrequency } from "./types"; // Adjust the import path as necessary

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);


export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",      // "Feb"
      day: "numeric",      // "2"
      hour: "numeric",     // "10"
      minute: "2-digit",   // "00"
      hour12: true         // "AM/PM"
    }).format(date);
  }
  

export const getDateString = (date: string) => {
    // return: 2024-08-02
    return new Date(date).toISOString().slice(0, 10);
}

export const get24Hour = (time: string) => {
    // time: 07:00PM
    const suffix = time.slice(5); //default end is the lenght of string
    if (suffix == 'PM') {
        let hour = Number(time.slice(0,2));
        hour = hour + 12;
        const newH = `${hour}`;
        return newH+time.slice(2,5);
    } 
    return time.slice(0,5);
}

export const getFormattedDateStr = (date:string, time:string) => {
    const formattedDate = getDateString(date);
    const formattedTime = get24Hour(time);
    return formattedDate + 'T' + formattedTime;
}

// used in CustomRecurrencePicker.tsx
export function generateRRuleString(input: RecurrenceInput): string {
  const { frequency, interval, selectedDays, ends, endDate, occurrences, startDatetime, nthWeek } = input;
  const freq = frequency.toUpperCase();
  const rruleParts = [`FREQ=${freq}`, `INTERVAL=${interval}`];

  const weekdayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  if (frequency === "WEEKLY" && selectedDays.length > 0) {
    const byDay = selectedDays.map(i => weekdayMap[i]).join(",");
    rruleParts.push(`BYDAY=${byDay}`);
  }

  if (frequency === "MONTHLY") {
    if (nthWeek !== null && nthWeek !== undefined) {
      const weekday = weekdayMap[startDatetime.day()];
      rruleParts.push(`BYDAY=${nthWeek}${weekday}`);
    } else {
      rruleParts.push(`BYMONTHDAY=${startDatetime.date()}`);
    }
  }

  if (frequency === "YEARLY") {
    rruleParts.push(`BYMONTH=${startDatetime.month() + 1}`);
    rruleParts.push(`BYMONTHDAY=${startDatetime.date()}`);
  }

  if (ends === "on" && endDate) {
    rruleParts.push(`UNTIL=${endDate.utc().format("YYYYMMDDTHHmmss[Z]")}`);
  } else if (ends === "after") {
    rruleParts.push(`COUNT=${occurrences}`);
  }

  return rruleParts.join(";");
}


export function formatRecurrence(input: RecurrenceInput): RecurrenceOutput {
  const {
    frequency, interval, selectedDays, ends, endDate, occurrences,
    startDatetime, eventId, nthWeek
  } = input;

  const weekdayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const frequencyMap: Record<string, string> = {
    DAILY: "day",
    WEEKLY: "week",
    MONTHLY: "month",
    YEARLY: "year"
  };

  let by_day: string[] | null = null;
  let by_month_day: number | null = null;
  let by_month: number | null = null;

  if (frequency === "WEEKLY") {
    by_day = selectedDays
      .filter((i): i is number => typeof i === "number" && i >= 0 && i <= 6)
      .sort((a, b) => a - b)
      .map(i => weekdayMap[i]!);
  }

  if (frequency === "MONTHLY") {
    if (nthWeek !== null && nthWeek !== undefined) {
      const weekday = weekdayMap[startDatetime.day()];
      by_day = [`${nthWeek}${weekday}`]; // e.g. "-1FR"
    } else {
      by_month_day = startDatetime.date();
    }
  }

  if (frequency === "YEARLY") {
    by_month_day = startDatetime.date();
    by_month = startDatetime.month() + 1;
  }

  const everyPart = `Every ${interval > 1 ? interval + " " : ""}${frequencyMap[frequency]}${interval > 1 ? "s" : ""}`;
  let onPart = "";

  if (frequency === "WEEKLY") {
    const daysText = selectedDays
      .sort((a, b) => a - b)
      .map(i => dayNames[i])
      .join(", ")
      .replace(/, ([^,]*)$/, " and $1");
    onPart = `on ${daysText}`;
  } else if (frequency === "MONTHLY") {
    if (nthWeek !== null && nthWeek !== undefined) {
      const dayName = dayNames[startDatetime.day()];
      const nth = nthWeek === -1 ? "last" : ordinal(nthWeek);
      onPart = `on the ${nth} ${dayName}`;
    } else {
      onPart = `on the ${ordinal(startDatetime.date())}`;
    }
  } else if (frequency === "YEARLY") {
    const day = by_month_day ?? startDatetime.date();
    const monthName = monthNames[(by_month ?? (startDatetime.month() + 1)) - 1];
    onPart = `on ${monthName} ${day}`;
  }

  const summary = [everyPart, onPart].filter(Boolean).join(" ");

  const dbRecurrence = {
    frequency: frequency.toUpperCase(),
    interval,
    count: ends === "after" ? occurrences : null,
    until: ends === "on" && endDate ? endDate.toISOString() : null,
    event_id: eventId,
    by_day,
    by_month,
    by_month_day,
    start_datetime: startDatetime.toISOString()
  };

  return { dbRecurrence, summary };
}



// Helper to convert 1 -> "1st", 2 -> "2nd", etc.
function ordinal(n: number): string {
  const suffix = (n % 10 === 1 && n % 100 !== 11) ? "st" :
                 (n % 10 === 2 && n % 100 !== 12) ? "nd" :
                 (n % 10 === 3 && n % 100 !== 13) ? "rd" : "th";
  return `${n}${suffix}`;
}



export function toRRuleFrequency(input: string): RRuleFrequency {
  const map: Record<string, RRuleFrequency> = {
    daily: "DAILY",
    weekly: "WEEKLY",
    monthly: "MONTHLY",
    yearly: "YEARLY"
  };

  const key = input.toLowerCase();
  const value = map[key];

  if (value) {
    return value;
  }

  throw new Error(`Invalid frequency: ${input}`);
}

export function toDBRecurrenceEnds(input: string): DBRecurrenceEnds {
  const map: Record<string, DBRecurrenceEnds> = {
    never: "never",
    on: "on",
    after: "after"
  };

  const key = input.toLowerCase();
  const value = map[key];

  if (value) {
    return value;
  }

  throw new Error(`Invalid ends: ${input}`);
}

export function getNthDayOfWeekInMonth(date: Dayjs): number {
  const dayOfMonth = date.date(); // 1-based
  return Math.ceil(dayOfMonth / 7);
}

export function isLastWeekdayInMonth(date: Dayjs): boolean {
  const dayOfWeek = date.day();
  const lastSameDay = date.endOf('month').date(); // e.g. 31
  let last = date.endOf('month');

  while (last.day() !== dayOfWeek) {
    last = last.subtract(1, 'day');
  }

  return last.date() === date.date();
}
