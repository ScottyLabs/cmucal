"use client";
import { useState, useEffect } from "react";
import useRoleRedirect from "../utils/redirect";

export default function AdminPage() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const response = await fetch("http://127.0.0.1:5001/api/auth/role");
      const data = await response.json();
      setUserRole(data.role);
    }
    fetchRole();
  }, []);

  useRoleRedirect("admin", userRole); // Redirect non-admins

  if (!userRole) return <p>Loading...</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Only admins can see this page.</p>
    </div>
  );
}
