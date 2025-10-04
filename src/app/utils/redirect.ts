"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useRoleRedirect(requiredRole: string, userRole: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (userRole && userRole !== requiredRole) {
      router.push("/unauthorized"); // Redirect unauthorized users
    }
  }, [userRole, requiredRole, router]);
}
