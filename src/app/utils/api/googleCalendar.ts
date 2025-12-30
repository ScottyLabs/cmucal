import { apiGet, apiPost, apiDelete } from "./api";
import { AuthStatus, CalendarFields } from "../types";

export const checkGoogleAuthStatus = () =>
  apiGet<AuthStatus>("/google/calendar/status");

export const fetchCalendars = (clerkId: string) =>
  apiGet<CalendarFields[]>("/google/calendar");

export interface EnsureCalendarResponse {
  calendar_id: string;
  created: boolean; // true if newly created, false if already existed
}

export type EnsureCalendarRequest = null;
export const ensureCalendarExists = (clerkId: string) =>
  apiPost<EnsureCalendarResponse, EnsureCalendarRequest>(
    "/google/calendars/init",
    null,
    {
      headers: { "Clerk-User-Id": clerkId },
    },
  );

export const listGoogleCalendars = () => apiGet<any[]>("/google/calendar/list");

export const unauthorizeGoogle = () => apiDelete("/google/unauthorize");

export const fetchBulkEventsFromCalendars = async (
  calendarIds: string[],
): Promise<any[]> => {
  try {
    return await apiPost<any[], { calendarIds: string[] }>(
      "/google/calendar/events/bulk",
      { calendarIds: calendarIds },
    );
  } catch (error) {
    console.error("Failed to fetch events from calendars:", error);
    throw error;
  }
};
