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
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, userId } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCategories, setVisibleCategories] = useState<Set<number>>(new Set());

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
