import { apiGet, apiPost } from "./api";
import { AdminInOrg, ClubOrganization, CourseOption, Org } from "../types";


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
}