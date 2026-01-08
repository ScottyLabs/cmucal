'use client';
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Course, Club } from "~/app/utils/types";
import { getSchedule, removeCategoryFromSchedule } from "~/app/utils/api/schedules";

type UserContextType = {
  courses: Course[];
  clubs: Club[];
  currentScheduleId: string | number | null;
  loading: boolean;
  setCourses: (courses: Course[]) => void;
  setClubs: (clubs: Club[]) => void;
  setCurrentScheduleId: (id: string | number | null) => void;
  fetchSchedule: (scheduleId?: string | number, silent?: boolean) => Promise<void>;
  handleRemoveCategory: (categoryId: number) => Promise<void>;
  visibleCategories: Set<number>;
  setVisibleCategories: (categories: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  toggleCategoryVisibility: (categoryId: number) => void;
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, userId } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <UserContext.Provider value={{
      courses,
      clubs,
      currentScheduleId,
      loading,
      setCourses,
      setClubs,
      setCurrentScheduleId,
      fetchSchedule,
      handleRemoveCategory,
      visibleCategories,
      setVisibleCategories,
      toggleCategoryVisibility,
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
