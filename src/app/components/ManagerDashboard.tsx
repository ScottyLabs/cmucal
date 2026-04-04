"use client";

import { useUser } from "@clerk/nextjs";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import type { AdminInOrg, Org, CalendarSourceType, EventOccurrence, Category } from "../utils/types";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  getAdminsInOrg,
  bulkCreateAdmins,
  updateAdmin,
  deleteAdmin,
  getCalendarSources,
  toggleCalendarSource,
  deleteCalendarSource,
  deleteOrganization,
  getOrganizationData,
  createCategory,
  deleteCategory,
} from "../utils/api/organizations";
import { readIcalLink, deleteEvent } from "../utils/api/events";
import { formatDateRange } from "../utils/formatters";
import Modal from "./Modal";

interface Props {
  selectedOrg: Org | null;
  onOrgDeleted: () => void;
}

export default function ManagerContent({ selectedOrg, onOrgDeleted }: Props) {
  const { user } = useUser();
  const selectedOrgId = selectedOrg?.id ?? null;

  // Data state
  const [admins, setAdmins] = useState<AdminInOrg[]>([]);
  const [calendarSources, setCalendarSources] = useState<CalendarSourceType[]>([]);
  const [events, setEvents] = useState<EventOccurrence[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventSearch, setEventSearch] = useState("");

  // Modal state
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showEditAdmin, setShowEditAdmin] = useState(false);
  const [showAddIcal, setShowAddIcal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminInOrg | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id?: number; name?: string } | null>(null);

  // Unified loading state — true while initial org data loads
  const [isOrgLoading, setIsOrgLoading] = useState(false);

  // Fetch admins (used after mutations)
  const fetchAdmins = useCallback(async () => {
    if (!user?.id || selectedOrgId === null) return;
    try {
      const response = await getAdminsInOrg(user.id, selectedOrgId);
      setAdmins(response);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    }
  }, [user?.id, selectedOrgId]);

  // Fetch calendar sources (used after mutations)
  const fetchCalendarSources = useCallback(async () => {
    if (selectedOrgId === null) return;
    try {
      const response = await getCalendarSources(selectedOrgId);
      setCalendarSources(response.calendar_sources);
    } catch (error) {
      console.error("Failed to fetch calendar sources:", error);
    }
  }, [selectedOrgId]);

  // Fetch events (used after mutations)
  const fetchEvents = useCallback(async () => {
    if (!user?.id || selectedOrgId === null) return;
    try {
      const orgData = await getOrganizationData(user.id, selectedOrgId);
      setCategories(orgData.categories);
      const allEvents: EventOccurrence[] = [];
      for (const categoryName of Object.keys(orgData.events)) {
        const categoryEvents = orgData.events[categoryName];
        if (categoryEvents) allEvents.push(...categoryEvents);
      }
      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }, [user?.id, selectedOrgId]);

  // Load all org data together when org selection changes
  useEffect(() => {
    setAdmins([]);
    setCalendarSources([]);
    setEvents([]);
    setCategories([]);
    if (selectedOrgId === null) return;
    setIsOrgLoading(true);
    void Promise.all([
      fetchAdmins(),
      fetchCalendarSources(),
      fetchEvents(),
    ]).finally(() => setIsOrgLoading(false));
  }, [selectedOrgId, fetchAdmins, fetchCalendarSources, fetchEvents]);

  // Poll while any calendar source is syncing; fetch events when they finish
  const wasSyncingRef = useRef(false);
  useEffect(() => {
    const isSyncing = calendarSources.some(
      (cs) => cs.last_sync_status === "pending" || cs.last_sync_status === "syncing"
    );
    if (wasSyncingRef.current && !isSyncing && calendarSources.length > 0) {
      void fetchEvents();
    }
    wasSyncingRef.current = isSyncing;
    if (!isSyncing) return;
    const id = setInterval(() => { void fetchCalendarSources(); }, 5000);
    return () => clearInterval(id);
  }, [calendarSources, fetchCalendarSources, fetchEvents]);

  // Derive current user's admin record and permissions
  const myAdmin = useMemo(
    () => admins.find((a) => a.clerk_id === user?.id),
    [admins, user]
  );
  const isAdmin = myAdmin?.role === "admin";
  const myDbUserId = myAdmin?.user_id ?? null;
  // null = access to all categories; number = scoped to that category only
  const allowedCategoryId: number | null = myAdmin?.category_id ?? null;

  // Filtered events (search only — all categories visible)
  const filteredEvents = useMemo(() => {
    if (!eventSearch.trim()) return events;
    const term = eventSearch.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term)
    );
  }, [events, eventSearch]);

  // Categories the current user is allowed to add iCal links to
  const allowedCategories = useMemo(() => {
    if (allowedCategoryId === null) return categories;
    return categories.filter((c) => c.id === allowedCategoryId);
  }, [categories, allowedCategoryId]);

  if (!selectedOrg) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <p>Select an organization to manage</p>
      </div>
    );
  }

  if (isOrgLoading) {
    return <OrgSkeleton />;
  }

  return (
    <div className="h-[82vh] overflow-y-auto p-6 max-w-5xl">
      <h1 className="text-xl font-semibold mb-6">Manager Dashboard</h1>

      {/* Organization name */}
      <section className="mb-8">
        <p className="text-sm text-gray-500 mb-1">Organization Name</p>
        <p className="text-base font-medium">{selectedOrg.name}</p>
        {selectedOrg.type && (
          <span className="inline-block mt-1 rounded-full bg-gray-100 px-3 py-0.5 text-xs text-gray-600">
            {selectedOrg.type}
          </span>
        )}
      </section>

      {/* Admins */}
      <AdminsSection
        admins={admins}
        isAdmin={isAdmin}
        myDbUserId={myDbUserId}
        onAdd={() => setShowAddAdmin(true)}
        onEdit={(admin) => { setEditingAdmin(admin); setShowEditAdmin(true); }}
        onDelete={(admin) => { setDeleteTarget({ type: "admin", id: admin.user_id, name: admin.andrew_id }); setShowDeleteConfirm(true); }}
      />

      {/* Categories */}
      <CategoriesSection
        categories={categories}
        isAdmin={isAdmin}
        allowedCategoryId={allowedCategoryId}
        onAdd={() => setShowAddCategory(true)}
        onDelete={(cat) => { setDeleteTarget({ type: "category", id: cat.id, name: cat.name }); setShowDeleteConfirm(true); }}
      />

      {/* iCal Links */}
      <ICalSection
        calendarSources={calendarSources}
        categories={categories}
        allowedCategoryId={allowedCategoryId}
        onAdd={() => setShowAddIcal(true)}
        onToggle={async (cs) => {
          try {
            const result = await toggleCalendarSource(selectedOrgId!, cs.id);
            setCalendarSources((prev) =>
              prev.map((s) => (s.id === cs.id ? { ...s, active: result.active } : s))
            );
          } catch (error) {
            console.error("Failed to toggle calendar source:", error);
          }
        }}
        onDelete={(cs) => { setDeleteTarget({ type: "ical", id: cs.id, name: cs.url }); setShowDeleteConfirm(true); }}
      />

      {/* Events */}
      <EventsSection
        events={filteredEvents}
        categories={categories}
        allowedCategoryId={allowedCategoryId}
        search={eventSearch}
        onSearchChange={setEventSearch}
        onDelete={(event) => { setDeleteTarget({ type: "event", id: event.event_id, name: event.title }); setShowDeleteConfirm(true); }}
      />

      {/* Danger zone — admin only */}
      {isAdmin && (
        <button
          onClick={() => { setDeleteTarget({ type: "org", name: selectedOrg.name }); setShowDeleteConfirm(true); }}
          className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Delete organization
        </button>
      )}

      {/* Add Admin Modal */}
      <AddAdminModal
        show={showAddAdmin}
        onClose={() => setShowAddAdmin(false)}
        orgName={selectedOrg.name}
        onSuccess={fetchAdmins}
      />

      {/* Edit Admin Modal */}
      <EditAdminModal
        show={showEditAdmin}
        onClose={() => { setShowEditAdmin(false); setEditingAdmin(null); }}
        admin={editingAdmin}
        categories={categories}
        onSuccess={fetchAdmins}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        show={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        orgId={selectedOrgId!}
        onSuccess={() => void fetchEvents()}
      />

      {/* Add iCal Modal */}
      <AddICalModal
        show={showAddIcal}
        onClose={() => setShowAddIcal(false)}
        orgId={selectedOrgId!}
        categories={allowedCategories}
        clerkId={user?.id ?? ""}
        onSuccess={async () => { await fetchCalendarSources(); }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        target={deleteTarget}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            if (deleteTarget.type === "admin" && deleteTarget.id) {
              await deleteAdmin(deleteTarget.id, selectedOrgId!);
              void fetchAdmins();
            } else if (deleteTarget.type === "category" && deleteTarget.id) {
              await deleteCategory(selectedOrgId!, deleteTarget.id);
              void fetchEvents();
            } else if (deleteTarget.type === "ical" && deleteTarget.id) {
              await deleteCalendarSource(selectedOrgId!, deleteTarget.id);
              void fetchCalendarSources();
              void fetchEvents();
            } else if (deleteTarget.type === "event" && deleteTarget.id) {
              await deleteEvent(deleteTarget.id);
              void fetchEvents();
            } else if (deleteTarget.type === "org") {
              await deleteOrganization(selectedOrgId!);
              onOrgDeleted();
            }
          } catch (error) {
            console.error(`Failed to delete ${deleteTarget.type}:`, error);
          }
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

/* ---------- Loading Skeleton ---------- */

function OrgSkeleton() {
  return (
    <div className="h-[82vh] overflow-y-auto p-6 max-w-5xl animate-pulse">
      {/* Title */}
      <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
      {/* Org name section */}
      <div className="mb-8">
        <div className="h-3 w-28 bg-gray-200 rounded mb-2" />
        <div className="h-5 w-40 bg-gray-200 rounded" />
      </div>
      {/* Three table sections */}
      {[4, 3, 5].map((rows, i) => (
        <div key={i} className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-28 bg-gray-200 rounded-full" />
          </div>
          <div className="rounded-xl border overflow-hidden">
            <div className="h-10 bg-gray-50 border-b" />
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="h-12 border-t bg-white flex items-center px-4 gap-4">
                <div className="h-3 flex-1 bg-gray-100 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Section Components ---------- */

function AdminsSection({
  admins,
  isAdmin,
  myDbUserId,
  onAdd,
  onEdit,
  onDelete,
}: {
  admins: AdminInOrg[];
  isAdmin: boolean;
  myDbUserId: number | null;
  onAdd: () => void;
  onEdit: (admin: AdminInOrg) => void;
  onDelete: (admin: AdminInOrg) => void;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">Admins</h2>
        {isAdmin && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            <FiPlus /> Add Admin
          </button>
        )}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Andrew ID</th>
              <th className="px-4 py-3 text-left">Role</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 3 : 2} className="px-4 py-6 text-center text-gray-400">
                  No admins found
                </td>
              </tr>
            ) : (
              admins.map((admin, i) => {
                const isSelf = admin.user_id === myDbUserId;
                return (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3">
                      {admin.andrew_id}
                      {isSelf && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{admin.role}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <IconButton onClick={() => onEdit(admin)} disabled={isSelf}><FiEdit2 /></IconButton>
                        <IconButton onClick={() => onDelete(admin)} disabled={isSelf}><FiTrash2 /></IconButton>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CategoriesSection({
  categories,
  isAdmin,
  allowedCategoryId,
  onAdd,
  onDelete,
}: {
  categories: Category[];
  isAdmin: boolean;
  allowedCategoryId: number | null;
  onAdd: () => void;
  onDelete: (cat: Category) => void;
}) {
  // Can add/delete categories only when access is unrestricted (all-category scope)
  const canManage = isAdmin && allowedCategoryId === null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">Categories</h2>
        {canManage && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            <FiPlus /> Add Category
          </button>
        )}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 2 : 1} className="px-4 py-6 text-center text-gray-400">
                  No categories yet
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-t">
                  <td className="px-4 py-3">{cat.name}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <IconButton onClick={() => onDelete(cat)}><FiTrash2 /></IconButton>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ICalSection({
  calendarSources,
  categories,
  allowedCategoryId,
  onAdd,
  onToggle,
  onDelete,
}: {
  calendarSources: CalendarSourceType[];
  categories: Category[];
  allowedCategoryId: number | null;
  onAdd: () => void;
  onToggle: (cs: CalendarSourceType) => void;
  onDelete: (cs: CalendarSourceType) => void;
}) {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-medium">iCal Links</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
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
              <th className="px-4 py-3 text-left">Calendar URL</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {calendarSources.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No iCal links configured
                </td>
              </tr>
            ) : (
              calendarSources.map((cs) => (
                <tr key={cs.id} className="border-t">
                  <td className="px-4 py-3 text-gray-500 max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate" title={cs.url}>{cs.url}</span>
                      {(cs.last_sync_status === "pending" || cs.last_sync_status === "syncing") && (
                        <span className="shrink-0 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          Syncing...
                        </span>
                      )}
                      {cs.last_sync_status === "error" && (
                        <span className="shrink-0 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          Sync failed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {cs.category_id ? (categoryMap.get(cs.category_id) ?? "—") : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      active={cs.active}
                      onClick={() => onToggle(cs)}
                      disabled={allowedCategoryId !== null && cs.category_id !== allowedCategoryId}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <IconButton
                      onClick={() => onDelete(cs)}
                      disabled={allowedCategoryId !== null && cs.category_id !== allowedCategoryId}
                    ><FiTrash2 /></IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EventsSection({
  events,
  categories,
  allowedCategoryId,
  search,
  onSearchChange,
  onDelete,
}: {
  events: EventOccurrence[];
  categories: Category[];
  allowedCategoryId: number | null;
  search: string;
  onSearchChange: (val: string) => void;
  onDelete: (event: EventOccurrence) => void;
}) {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">Events</h2>
      </div>

      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search events"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-full border bg-gray-50 py-2 pl-10 pr-4 text-sm focus:outline-none"
        />
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Event Title</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Date/Time</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-3">{event.title}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {event.category_id ? (categoryMap.get(event.category_id) ?? "Uncategorized") : "Uncategorized"}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateRange(event.start_datetime, event.end_datetime)}
                  </td>
                  <td className="px-4 py-3">{event.location || "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <IconButton
                      onClick={() => onDelete(event)}
                      disabled={allowedCategoryId !== null && event.category_id !== allowedCategoryId}
                    ><FiTrash2 /></IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Modal Components ---------- */

function AddAdminModal({
  show,
  onClose,
  orgName,
  onSuccess,
}: {
  show: boolean;
  onClose: () => void;
  orgName: string;
  onSuccess: () => void;
}) {
  const [andrewId, setAndrewId] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!andrewId.trim()) {
      setError("Andrew ID is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await bulkCreateAdmins(`${andrewId.trim()}@andrew.cmu.edu`, orgName, role);
      setAndrewId("");
      setRole("admin");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add admin");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAndrewId("");
    setRole("admin");
    setError("");
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose}>
      <h2 className="text-lg font-semibold mb-4">Add Admin</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Andrew ID</label>
          <input
            type="text"
            value={andrewId}
            onChange={(e) => setAndrewId(e.target.value)}
            placeholder="e.g. jdoe"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Admin"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function EditAdminModal({
  show,
  onClose,
  admin,
  categories,
  onSuccess,
}: {
  show: boolean;
  onClose: () => void;
  admin: AdminInOrg | null;
  categories: Category[];
  onSuccess: () => void;
}) {
  const [role, setRole] = useState("admin");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (admin) {
      setRole(admin.role);
      setCategoryId(admin.category_id ?? undefined);
    }
  }, [admin]);

  const handleSubmit = async () => {
    if (!admin) return;
    setLoading(true);
    setError("");
    try {
      await updateAdmin(admin.user_id, admin.org_id, role, categoryId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Edit Admin</h2>
      {admin && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Andrew ID</label>
            <p className="text-sm text-gray-600">{admin.andrew_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AddICalModal({
  show,
  onClose,
  orgId,
  categories,
  clerkId,
  onSuccess,
}: {
  show: boolean;
  onClose: () => void;
  orgId: number;
  categories: Category[];
  clerkId: string;
  onSuccess: () => Promise<void>;
}) {
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset category selection when the org changes (categories list changes)
  useEffect(() => {
    setCategoryId(categories.length > 0 && categories[0] ? String(categories[0].id) : "");
  }, [categories]);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await readIcalLink({
        gcal_link: url.trim(),
        org_id: String(orgId),
        category_id: categoryId,
        clerk_id: clerkId,
      });
      setUrl("");
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import iCal link");
    } finally {
      setLoading(false);
    }
  };

  const noCategories = categories.length === 0;

  return (
    <Modal show={show} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Add iCal Link</h2>
      {noCategories ? (
        <p className="text-sm text-amber-600 mb-4">
          You need to create at least one category before adding an iCal link.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calendar URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        {!noCategories && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Import Calendar"}
          </button>
        )}
      </div>
    </Modal>
  );
}

function AddCategoryModal({
  show,
  onClose,
  orgId,
  onSuccess,
}: {
  show: boolean;
  onClose: () => void;
  orgId: number;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createCategory(orgId, name.trim());
      setName("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={() => { setName(""); setError(""); onClose(); }}>
      <h2 className="text-lg font-semibold mb-4">Add Category</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Office Hours"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => { setName(""); setError(""); onClose(); }}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Category"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteConfirmModal({
  show,
  onClose,
  target,
  onConfirm,
}: {
  show: boolean;
  onClose: () => void;
  target: { type: string; id?: number; name?: string } | null;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const getMessage = () => {
    if (!target) return "";
    switch (target.type) {
      case "admin":
        return `Remove admin "${target.name}" from this organization?`;
      case "category":
        return `Delete category "${target.name}"? Events in this category will become uncategorized.`;
      case "ical":
        return `Delete all events from this calendar source and remove it? This cannot be undone.`;
      case "event":
        return `Delete event "${target.name}"? This will remove the event and all its occurrences.`;
      case "org":
        return `Delete organization "${target.name}"? This will permanently remove the organization and all its data. This cannot be undone.`;
      default:
        return "Are you sure?";
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">
        {target?.type === "org" ? "Delete Organization" : "Confirm Delete"}
      </h2>
      <p className="text-sm text-gray-600 mb-6">{getMessage()}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Small reusable components ---------- */

function IconButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-lg border p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function Toggle({ active, onClick, disabled }: { active: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-6 w-10 rounded-full p-1 transition inline-flex disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? "bg-black" : "bg-gray-300"
      }`}
    >
      <div
        className={`h-4 w-4 rounded-full bg-white transition ${
          active ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
