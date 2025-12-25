"use client";
import { useState, useEffect } from "react";
import useRoleRedirect from "../utils/redirect";

export default function ManagerPage() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const response = await fetch("http://127.0.0.1:5001/api/auth/role");
      const data = await response.json();
      setUserRole(data.role);
    }
    fetchRole();
  }, []);

  useRoleRedirect("manager", userRole); // Redirect non-managers

  if (!userRole) return <p>Loading...</p>;

  return (
    <div>
      <h1>Manager Dashboard</h1>
      <p>Only managers can see this page.</p>
    </div>
  );
}
