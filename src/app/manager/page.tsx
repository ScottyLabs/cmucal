// src/app/manager/page.tsx
"use client";
import { useState, useEffect } from "react";

function ManagerPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-65px)] w-screen animate-pulse">
      {/* Sidebar */}
      <div style={{ width: 320, minWidth: 320 }} className="flex-shrink-0 p-4 border-r border-gray-200 dark:border-gray-700">
        <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-6 mt-2 mx-1" />
        {/* Search bar */}
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 mx-1" />
        {/* Org list items */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 mx-1" />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

      {/* Content area */}
      <div className="flex-1 p-6">
        {/* Title */}
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        {/* Org name block */}
        <div className="mb-8">
          <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        {/* Three table sections */}
        {[4, 3, 5].map((rows, i) => (
          <div key={i} className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
              {Array.from({ length: rows }).map((_, j) => (
                <div key={j} className="h-12 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-4 gap-4">
                  <div className="h-3 flex-1 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useMultipleRoleRedirect } from "../utils/redirect";
import TwoColumnLayout from "../components/TwoColumnLayout";
import { useUser } from "@clerk/nextjs";
import { getUserRole } from "../utils/api/users";
import ManagerSidebar from "../components/ManagerSidebar";
import ManagerContent from "../components/ManagerDashboard";
import type { Org } from "../utils/types";

export default function ManagerPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [managedOrgIds, setManagedOrgIds] = useState<Set<number> | null>(null);
  const { user } = useUser();

  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const fetchUserRole = async () => {
      const response = await getUserRole(user.id);
      if (response.is_manager) {
        setUserRole("manager");
      } else if (response.is_admin) {
        setUserRole("admin");
      } else {
        setUserRole("user");
      }
      // Collect all org IDs the user manages or admins
      const orgIds = new Set<number>(response.roles.map((r) => r.org_id));
      setManagedOrgIds(orgIds);
    };
    void fetchUserRole();
  }, [user?.id]);

  useMultipleRoleRedirect(["manager", "admin"], userRole); // Redirect non-managers

  if (!userRole) return <ManagerPageSkeleton />;

  return (
    <div className="flex h-[calc(100vh-65px)]">
      <TwoColumnLayout
        leftContent={
          <ManagerSidebar
            handleOrgSelect={(org) => setSelectedOrg(org)}
            selectedOrgId={selectedOrg?.id ?? null}
            allowedOrgIds={managedOrgIds}
            refreshKey={sidebarRefreshKey}
            onOrgListChange={(orgs) => {
              if (selectedOrg && !orgs.find((o) => o.id === selectedOrg.id)) {
                setSelectedOrg(null);
              }
            }}
          />
        }
        rightContent={
          <ManagerContent
            selectedOrg={selectedOrg}
            onOrgDeleted={() => { setSelectedOrg(null); setSidebarRefreshKey((k) => k + 1); }}
          />
        }
      />
    </div>
  );
}
