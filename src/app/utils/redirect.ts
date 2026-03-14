// src/app/utils/redirect.ts
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

export function useMultipleRoleRedirect(allowedRoles: string[], userRole: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (userRole && !allowedRoles.includes(userRole)) {
      router.push("/unauthorized"); // Redirect unauthorized users
    }
  }, [userRole, allowedRoles, router]);
}