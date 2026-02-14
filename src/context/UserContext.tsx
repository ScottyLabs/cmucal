'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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
  const [visibilityBySchedule, setVisibilityBySchedule] = useState<Map<string | number, Set<number>>>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('categoryVisibility');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Record<string, number[]>;
          const map = new Map<string | number, Set<number>>();
          Object.entries(parsed).forEach(([key, value]) => {
            map.set(key, new Set(value));
          });
          return map;
        } catch (e) {
          console.error('Failed to parse saved category visibility:', e);
        }
      }
    }
    return new Map();
  });
  // Current active visibility set (updated after schedule loads)
  const [visibleCategories, setVisibleCategoriesState] = useState<Set<number>>(new Set());
  
  // Track the previous schedule ID to detect actual changes
  const previousScheduleId = useRef<string | number | null>(null);

  const fetchSchedule = useCallback(async (scheduleId?: string | number, silent = false) => {
    if (!isLoaded || !userId) return;
    if (!silent) setLoading(true);

    // if scheduleId is -1, clear the schedule
    if (scheduleId === -1) {
      setCourses([]);
      setClubs([]);
      setVisibleCategoriesState(new Set());
      if (!silent) setLoading(false);
      return;
    }

    try {
      const data = await getSchedule(userId, scheduleId);
      if (data) {
        setCourses(data.courses || []);
        setClubs(data.clubs || []);
        
        // Set the schedule ID if it was returned and not already set
        if (data.schedule_id && !currentScheduleId) {
          setCurrentScheduleId(data.schedule_id);
        }
        
        // After schedule loads, update visible categories
        const scheduleKey = data.schedule_id ?? currentScheduleId ?? 'default';
        
        // Load fresh from localStorage to avoid stale state
        let savedVisibilities: Set<number> | undefined;
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('categoryVisibility');
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as Record<string, number[]>;
              const categoryIds = parsed[String(scheduleKey)];
              if (categoryIds) {
                savedVisibilities = new Set(categoryIds);
              }
            } catch (e) {
              console.error('Failed to parse saved category visibility:', e);
            }
          }
        }
        
        if (savedVisibilities) {
          // Use saved visibilities if they exist
          setVisibleCategoriesState(savedVisibilities);
          // Update the map state as well
          setVisibilityBySchedule(prev => {
            const newMap = new Map(prev);
            newMap.set(scheduleKey, savedVisibilities);
            return newMap;
          });
        } else {
          // Default: all categories visible
          const allCategoryIds = new Set<number>();
          [...(data.courses || []), ...(data.clubs || [])].forEach(org => {
            org.categories.forEach(cat => allCategoryIds.add(cat.id));
          });
          setVisibleCategoriesState(allCategoryIds);
          // Save default to map and localStorage
          setVisibilityBySchedule(prev => {
            const newMap = new Map(prev);
            newMap.set(scheduleKey, allCategoryIds);
            
            // Persist to localStorage
            if (typeof window !== 'undefined') {
              const serializable: Record<string, number[]> = {};
              newMap.forEach((value, key) => {
                serializable[String(key)] = Array.from(value);
              });
              localStorage.setItem('categoryVisibility', JSON.stringify(serializable));
            }
            
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isLoaded, userId, currentScheduleId]);

  // Fetch schedule on mount and when currentScheduleId changes
  useEffect(() => {
    if (!isLoaded || !userId) return;
    
    // Only fetch if the schedule ID actually changed (not just from null to a value on first load)
    if (previousScheduleId.current === null && currentScheduleId === null) {
      // Initial load: fetch first/default schedule
      void fetchSchedule(undefined);
      previousScheduleId.current = currentScheduleId;
    } else if (previousScheduleId.current !== currentScheduleId && previousScheduleId.current !== null) {
      // Schedule changed after initial load: fetch specific schedule silently
      void fetchSchedule(currentScheduleId ?? undefined, true);
      previousScheduleId.current = currentScheduleId;
    } else {
      // Just update the ref without fetching (this handles null -> actual ID transition)
      previousScheduleId.current = currentScheduleId;
    }
  }, [isLoaded, userId, currentScheduleId, fetchSchedule]);

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


  const setVisibleCategories = useCallback((updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    const scheduleKey = currentScheduleId ?? 'default';
    
    // Update current visibility state
    setVisibleCategoriesState(prev => {
      const newSet = typeof updater === 'function' ? updater(prev) : updater;
      
      // Save to schedule map
      setVisibilityBySchedule(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(scheduleKey, newSet);
        
        // Persist to localStorage
        if (typeof window !== 'undefined') {
          const serializable: Record<string, number[]> = {};
          newMap.forEach((value, key) => {
            serializable[String(key)] = Array.from(value);
          });
          localStorage.setItem('categoryVisibility', JSON.stringify(serializable));
        }
        
        return newMap;
      });
      
      return newSet;
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