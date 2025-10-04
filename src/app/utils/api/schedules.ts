import { apiGet, apiPost, apiDelete } from "./api";
import { CoursesClubsResponse } from "../types";

// We can enhance this to automatically include the auth token
// For now, the page component will handle passing the token if needed
// based on how the getSchedule function on the page is implemented.

export const getSchedule = async (
  userId: string | null | undefined,
  scheduleId?: string | number
): Promise<CoursesClubsResponse> => {
  if (!userId) throw new Error("User ID is required to fetch schedule.");
  return apiGet<CoursesClubsResponse>("/schedule/", {
    headers: { "Clerk-User-Id": userId },
    params: scheduleId != null ? { schedule_id: scheduleId } : undefined,
  });
};

export const removeCategoryFromSchedule = async <T = unknown>(
  categoryId: number,
  userId?: string | null
): Promise<T> => {
  if (!userId) {
    throw new Error("User ID is required to remove a category.");
  }

  return apiDelete<T>(`/schedule/category/${categoryId}`, {
    headers: { "Clerk-User-Id": userId },
  });
};