"use client";

import { useEffect, useState, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import { getAllOrganizations } from "../utils/api/organizations";

interface Props {
  handleOrgSelect: (orgId: number) => void;
  selectedOrgId: number | null;
}

export default function ManagerSidebar({
  handleOrgSelect,
  selectedOrgId,
}: Props) {
  const [search, setSearch] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [organizations, search]);

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const orgs = await getAllOrganizations();
      console.log("Fetched organizations:", orgs);
      setOrganizations(orgs);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div className="h-[82vh]">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between px-4 pt-4">
        <h2 className="text-sm font-semibold text-gray-700">
          All Organizations
        </h2>
        <button className="text-sm font-medium text-blue-600 hover:underline">
          Add
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-3 px-4">
        <FiSearch
          className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-500"
          size={16}
        />

        <input
          type="text"
          placeholder="Search organizations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Organization list */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-3 px-4 pb-4">
        {filteredOrgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => handleOrgSelect(org.id)}
              className={`text-left cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium w-full  ${
                selectedOrgId === org.id
                  ? "border-gray-500 bg-gray-100 text-gray-700"
                  : "border-gray-200 text-gray-800 hover:bg-gray-50"
              }`}
            >
              {org.name}
            </button>
          ))}
      </div>
    </div>
  );
}
