// src/app/manager/page.tsx
"use client";
import { useState, useEffect } from "react";
import useRoleRedirect from "../utils/redirect";
import TwoColumnLayout from "../components/TwoColumnLayout";
import { getUserRole } from "../utils/api/users";
import { useUser } from "@clerk/nextjs";
import { fetchRole } from "../utils/authService";
import ManagerSidebar from "../components/ManagerSidebar";
import ManagerContent from "../components/ManagerDashboard";

export default function ManagerPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await fetchRole(user?.id);
      setUserRole(role);
    };
    fetchUserRole();
  }, [user?.id]);

  useRoleRedirect("manager", userRole); // Redirect non-managers

  if (!userRole) return <p>Finding user role...</p>;

  return (
    <div className="flex h-[calc(99vh-80px)]">
      <TwoColumnLayout
        leftContent={<ManagerSidebar />}
        rightContent={<ManagerContent />}
      />
    </div>
  );
}
