// src/app/manager/page.tsx
"use client";
import { useState, useEffect } from "react";
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

  if (!userRole) return <p>Finding user role...</p>;

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
