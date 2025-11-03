import { apiGet, apiPost, apiDelete } from "./api";
import { AuthStatus } from "../types";

export const checkGoogleAuthStatus = () =>
  apiGet<AuthStatus>("/google/calendar/status");

export const listGoogleCalendars = () =>
  apiGet<any[]>("/google/calendar/list");

export const unauthorizeGoogle = () =>
  apiDelete("/google/unauthorize");

export const fetchBulkEventsFromCalendars = async (
  calendarIds: string[]
): Promise<any[]> => {
  try {
    return await apiPost<any[], { calendarIds: string[] }>(
      "/google/calendar/events/bulk",
      { calendarIds: calendarIds}
    );
  } catch (error) {
    console.error("Failed to fetch events from calendars:", error);
    throw error;
  }
};
