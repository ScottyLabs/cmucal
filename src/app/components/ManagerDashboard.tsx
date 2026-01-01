"use client";

import { useUser } from "@clerk/nextjs";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import { AdminInOrg } from "../utils/types";
import { useEffect, useState } from "react";
import { getAdminsInOrg } from "../utils/api/organizations";

interface Props {
  selectedOrgId: number | null;
}

export default function ManagerContent({ selectedOrgId }: Props) {
  const { user } = useUser(); // clerkId
  const [admins, setAdmins] = useState<AdminInOrg[]>([]);

  console.log("Selected Org ID in ManagerContent:", selectedOrgId);

  useEffect(() => {
    // Fetch admins when selectedOrgId changes
    const fetchAdmins = async () => {
      if (!user?.id || selectedOrgId === null) return;
      try {
        const response = await getAdminsInOrg(user.id, selectedOrgId);
        console.log("Fetched admins:", response);
        setAdmins(response);
      } catch (error) {
        console.error("Failed to fetch admins:", error);
      }
    }
    fetchAdmins();
  }, [user?.id, selectedOrgId]);

  return (
    <div className="h-[82vh] overflow-y-auto p-6 max-w-5xl">
      {/* Page title */}
      <h1 className="text-xl font-semibold mb-6">Manager Dashboard</h1>

      {/* Organization name */}
      <section className="mb-8">
        <p className="text-sm text-gray-500 mb-1">Organization Name</p>
        <p className="text-base font-medium">ScottyLabs</p>
      </section>

      {/* Admins */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Admin</h2>
          <button className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white">
            <FiPlus /> Add Admin
          </button>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Andrew ID</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins && admins.map((admin, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">{admin.andrew_id}</td>
                  <td className="px-4 py-3">{admin.role}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <IconButton><FiEdit2 /></IconButton>
                    <IconButton><FiTrash2 /></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* iCal Links */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-medium">iCal Links</h2>
          <button className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white">
            <FiPlus /> Add iCal Link
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Manage external calendar integrations. Active links are automatically synced to import new events.
        </p>

        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Calendar Name</th>
                <th className="px-4 py-3 text-left">Link</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "ScottyLabs General", active: true },
                { name: "ScottyLabs Leadership", active: false },
              ].map((cal, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">{cal.name}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                    https://calendar.google.com/calendar/embed...
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle active={cal.active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <IconButton><FiTrash2 /></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Events */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Events</h2>
          <button className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white">
            <FiPlus /> Add Event
          </button>
        </div>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search events"
            className="w-full rounded-full border bg-gray-50 py-2 pl-10 pr-4 text-sm focus:outline-none"
          />
        </div>

        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Event Title</th>
                <th className="px-4 py-3 text-left">Date/Time</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  title: "TartanHacks Hackathon",
                  time: "Feb 2, 2025 10:00 AM - Feb 3, 5:00 PM",
                  location: "Rangos Auditorium",
                },
                {
                  title: "Club Fair",
                  time: "Sep 3, 2025, 4:30 PM - 6:00 PM",
                  location: "The Cut",
                },
              ].map((event, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">{event.title}</td>
                  <td className="px-4 py-3">{event.time}</td>
                  <td className="px-4 py-3">{event.location}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <IconButton><FiEdit2 /></IconButton>
                    <IconButton><FiTrash2 /></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Danger zone */}
      <button className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-600 hover:bg-red-50">
        Delete organization
      </button>
    </div>
  );
}

/* ---------- Small reusable components ---------- */

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center justify-center rounded-lg border p-2 text-gray-600 hover:bg-gray-100">
      {children}
    </button>
  );
}

function Toggle({ active }: { active: boolean }) {
  return (
    <div
      className={`h-6 w-10 rounded-full p-1 transition ${
        active ? "bg-black" : "bg-gray-300"
      }`}
    >
      <div
        className={`h-4 w-4 rounded-full bg-white transition ${
          active ? "translate-x-4" : ""
        }`}
      />
    </div>
  );
}
