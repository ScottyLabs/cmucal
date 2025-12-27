import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL } from "./api/api";
import { getUserRole } from "./api/users";

export const sendUserToBackend = async (user: { id: string; email: string; firstName: string; lastName: string }) => {
  const res = await fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", 
    body: JSON.stringify({
      clerk_id: user.id,
      email: user.email,
      fname: user.firstName,
      lname: user.lastName,
    }),
  });

  const result = await res.json();
  console.log(result);
};

export async function fetchRole(clerkId: string | undefined) {
  const response = await getUserRole(clerkId || "");
  if (response.is_manager) {
    return "manager";
  } else if (response.is_admin) {
    return "admin";
  } else {
    return "user";
  }
}

