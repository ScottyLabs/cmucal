import { apiGet, apiPost, apiDelete } from "./api";
import { CategoryOrg, LoginPayload, LoginResponse } from "../types";

export const getAdminCategories = (userId: string) => {
    return apiGet<CategoryOrg[]>("/users/get_admin_categories", {
        headers: { "Clerk-User-Id": userId },
    });
};

export const getUserID = (userId: string) => {
    return apiGet<{ user_id: string }>("/users/get_user_id", {
        headers: { "Clerk-User-Id": userId },
    });
};

export const loginWithClerk = async (
  clerkId: string,
  emailAddress: string | undefined,
  firstName?: string | null,
  lastName?: string | null
): Promise<string | number | null> => {
  try {
    const data = await apiPost<LoginResponse, LoginPayload>("/users/login", {
      clerk_id: clerkId,
      email: emailAddress,
      fname: firstName ?? null,
      lname: lastName ?? null,
    });
    return data.user.id;
  } catch (loginErr) {
    console.error("Failed to create user:", loginErr);
    throw new Error("Login failed");
  }
};