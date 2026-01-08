'use client';
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Course, Club } from "~/app/utils/types";
import { getSchedule, removeCategoryFromSchedule } from "~/app/utils/api/schedules";
import { getOrganizationData } from "~/app/utils/api/organizations";
import { EventType } from "~/app/types/EventType";
import { api } from "~/app/utils/api/api";

type UserContextType = {
  courses: Course[];
  clubs: Club[];
  currentScheduleId: string | number | null;
  loading: boolean;
  allEvents: EventType[];
  eventsLoading: boolean;
  setCourses: (courses: Course[]) => void;
  setClubs: (clubs: Club[]) => void;
  setCurrentScheduleId: (id: string | number | null) => void;
  fetchSchedule: (scheduleId?: string | number, silent?: boolean) => Promise<void>;
  handleRemoveCategory: (categoryId: number) => Promise<void>;
  visibleCategories: Set<number>;
  setVisibleCategories: (categories: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  toggleCategoryVisibility: (categoryId: number) => void;
  addOrganization: (orgId: number) => Promise<Course | Club | undefined>;
  removeOrganization: (orgId: number) => void;
  refetchEvents: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, userId } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<EventType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  // Store visibility per schedule: { scheduleId: Set<categoryId> }
  const [visibilityBySchedule, setVisibilityBySchedule] = useState<Map<string | number, Set<number>>>(new Map());
  
  // Get visible categories for current schedule
  const visibleCategories = visibilityBySchedule.get(currentScheduleId ?? 'default') ?? new Set<number>();

  const fetchSchedule = useCallback(async (scheduleId?: string | number, silent = false) => {
    if (!isLoaded || !userId) return;
    if (!silent) setLoading(true);
    try {
      const data = await getSchedule(userId, scheduleId);
      if (data) {
        setCourses(data.courses || []);
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    fetchSchedule(currentScheduleId || undefined);
  }, [fetchSchedule, currentScheduleId]);

  // Fetch all events on mount
  const fetchEvents = useCallback(async () => {
    if (!isLoaded || !userId) return;
    setEventsLoading(true);
    try {
      const res = await api.get(`/events/`, {
        headers: { "Clerk-User-Id": userId },
        params: {
          term: '',
          tags: '',
          date: '',
        },
        withCredentials: true,
      });
      setAllEvents(res.data);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setEventsLoading(false);
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    if (isLoaded && userId) {
      void fetchEvents();
    }
  }, [isLoaded, userId, fetchEvents]);

  const handleRemoveCategory = async (categoryId: number) => {
    try {
      await removeCategoryFromSchedule(categoryId, userId);
      fetchSchedule(currentScheduleId || undefined);
    } catch (error) {
      console.error("Failed to remove category", error);
    }
  };

  const setVisibleCategories = useCallback((updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    const scheduleKey = currentScheduleId ?? 'default';
    setVisibilityBySchedule(prev => {
      const newMap = new Map(prev);
      const currentSet = newMap.get(scheduleKey) ?? new Set<number>();
      const newSet = typeof updater === 'function' ? updater(currentSet) : updater;
      newMap.set(scheduleKey, newSet);
      return newMap;
    });
  }, [currentScheduleId]);

  const toggleCategoryVisibility = useCallback((categoryId: number) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, [setVisibleCategories]);

  // Optimistically add an organization to the schedule
  const addOrganization = useCallback(async (orgId: number) => {
    if (!userId) return undefined;
    
    try {
      // Fetch only the new organization's data
      const orgData = await getOrganizationData(userId, orgId);
      
      // Add to appropriate list based on type
      if (orgData.type === "CLUB") {
        setClubs(prev => [...prev, orgData]);
      } else {
        setCourses(prev => [...prev, orgData]);
      }
      
      return orgData;
    } catch (error) {
      console.error("Failed to fetch organization data:", error);
      throw error;
    }
  }, [userId]);

  // Optimistically remove an organization from the schedule
  const removeOrganization = useCallback((orgId: number) => {
    setCourses(prev => prev.filter(c => c.org_id !== orgId));
    setClubs(prev => prev.filter(c => c.org_id !== orgId));
  }, []);

  return (
    <UserContext.Provider value={{
      courses,
      clubs,
      currentScheduleId,
      loading,
      allEvents,
      eventsLoading,
      setCourses,
      setClubs,
      setCurrentScheduleId,
      fetchSchedule,
      handleRemoveCategory,
      visibleCategories,
      setVisibleCategories,
      toggleCategoryVisibility,
      addOrganization,
      removeOrganization,
      refetchEvents: fetchEvents,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
