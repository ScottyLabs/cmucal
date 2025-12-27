"use client";
import { useState, useEffect } from "react";
import useRoleRedirect from "../utils/redirect";
import TwoColumnLayout from "../components/TwoColumnLayout";
import { useUser } from "@clerk/nextjs";
import { fetchRole } from "../utils/authService";


export default function AdminPage() {
    const [userRole, setUserRole] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await fetchRole(user?.id);
      setUserRole(role);
    };
    fetchUserRole();
  }, [user?.id]);

  useRoleRedirect("admin", userRole); // Redirect non-admins

  if (!userRole) return <p>Finding user role...</p>;

  return (
    <div className="flex h-[calc(99vh-80px)]">
      <TwoColumnLayout
        leftContent={<div className="p-4">Admin Sidebar Content</div>}
        rightContent={<div className="p-4">Admin Main Content Area</div>}
      />
    </div>
  );
}
