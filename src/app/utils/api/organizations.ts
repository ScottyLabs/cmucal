import { apiGet, apiPost, apiPatch, apiDelete } from "./api";
import { AdminInOrg, ClubOrganization, CourseOption, Org, Course, Club, CalendarSourceType } from "../types";


export const getClubOrganizations = async (): Promise<ClubOrganization[]> => {
  return apiGet<ClubOrganization[]>("/organizations/get_club_orgs");
};

export const getAllOrganizations = async (): Promise<Org[]> => {
  return apiGet<Org[]>("/organizations/get_all_orgs");
};

export const addOrgToSchedule = async (
  scheduleId: number,
  orgId: number
): Promise<void> => {
  try {
    await apiPost<void, { schedule_id: number; org_id: number }>(
      "/users/add_org_to_schedule",
      { schedule_id: scheduleId, org_id: orgId }
    );
  } catch (error) {
    console.error("Failed to add organization to schedule:", error);
    throw error;
  }
};

export const removeOrgFromSchedule = async (scheduleId: number, orgId: number): Promise<void> => {
  try {
    await apiPost<void, { schedule_id: number; org_id: number }>(
      "/users/remove_org_from_schedule",
      { schedule_id: scheduleId, org_id: orgId }
    );
  } catch (error) {
    console.error("Failed to remove organization from schedule:", error);
    throw error;
  }
};

export const getCourseOrgs = async () : Promise<CourseOption[]> => {
  return apiGet<CourseOption[]>("/organizations/get_course_orgs");
};

export const getAdminsInOrg = async (clerkId: string, orgId: number): Promise<AdminInOrg[]> => {
  return apiGet<AdminInOrg[]>("/organizations/get_admins_in_org", {
    headers: { "Clerk-User-Id": clerkId },
    params: { org_id: orgId },
  });
};

// Fetch a single organization's data with categories and events
export const getOrganizationData = async (
  userId: string,
  orgId: number
): Promise<Course | Club> => {
  return apiGet<Course | Club>(`/organizations/org/${orgId}`, {
    headers: { "Clerk-User-Id": userId },
  });
};

// Admin management
export const bulkCreateAdmins = async (
  userEmails: string,
  organizationName: string,
  role: string = "admin"
): Promise<any> => {
  return apiPost("/organizations/bulk_create_admins", {
    user_emails: userEmails,
    organization_name: organizationName,
    role,
  });
};

export const updateAdmin = async (
  userId: number,
  orgId: number,
  role?: string,
  categoryId?: number
): Promise<any> => {
  return apiPatch("/organizations/update_admin", {
    user_id: userId,
    org_id: orgId,
    role,
    category_id: categoryId,
  });
};

export const deleteAdmin = async (
  userId: number,
  orgId: number
): Promise<any> => {
  return apiDelete("/organizations/delete_admin", {
    data: { user_id: userId, org_id: orgId },
  });
};

// Calendar source management
export const getCalendarSources = async (
  orgId: number
): Promise<{ calendar_sources: CalendarSourceType[] }> => {
  return apiGet<{ calendar_sources: CalendarSourceType[] }>(
    `/organizations/${orgId}/calendar_sources`
  );
};

export const toggleCalendarSource = async (
  orgId: number,
  csId: number
): Promise<{ id: number; active: boolean; updated_at: string }> => {
  return apiPatch(`/organizations/${orgId}/calendar_sources/${csId}`, {});
};

export const deleteCalendarSource = async (
  orgId: number,
  csId: number
): Promise<any> => {
  return apiDelete(`/organizations/${orgId}/calendar_sources/${csId}`);
};

// Category management
export const createCategory = async (
  orgId: number,
  name: string
): Promise<{ category_id: number }> => {
  return apiPost<{ category_id: number }, { org_id: number; name: string }>(
    "/organizations/create_category",
    { org_id: orgId, name }
  );
};

export const deleteCategory = async (
  orgId: number,
  catId: number
): Promise<void> => {
  await apiDelete(`/organizations/${orgId}/categories/${catId}`);
};

// Organization management
export const deleteOrganization = async (orgId: number): Promise<void> => {
  return apiDelete(`/organizations/${orgId}`);
};