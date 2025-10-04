"use client"
import { useState, useEffect, useCallback, useContext } from "react";
import { useAuth } from "@clerk/nextjs";
import TwoColumnLayout from "@components/TwoColumnLayout";
import { EventInput } from "@fullcalendar/core";
import ProfileSidebar from "../components/ProfileSidebar";
import { Course, Club } from "../utils/types";
import { getSchedule, removeCategoryFromSchedule } from "../utils/api/schedules";
import Calendar from "../components/Calendar";
import { useEventState } from "~/context/EventStateContext";

/**
 * Profile page with personalized calendar view
 */
export default function Profile() {
  const { getToken, isLoaded, userId } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  // const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([]);
  const { calendarEvents, setCalendarEvents } = useEventState();
  const [loading, setLoading] = useState(true);

  const [currentScheduleId, setCurrentScheduleId] = useState<string | number | null>(null);

  const fetchSchedule = useCallback(async (scheduleId?: string | number) => {
    if (!isLoaded || !userId) return;
    setLoading(true);
    try {
      const data = await getSchedule(userId, scheduleId);
      if (data) {
        setCourses(data.courses || []);
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    fetchSchedule(currentScheduleId || undefined);
  }, [fetchSchedule, currentScheduleId]);

  // Listen for schedule changes from Navbar
  useEffect(() => {
    const handleScheduleChange = (event: CustomEvent<{ scheduleId: string | number }>) => {
      setCurrentScheduleId(event.detail.scheduleId);
    };

    window.addEventListener('scheduleChange', handleScheduleChange as EventListener);
    return () => {
      window.removeEventListener('scheduleChange', handleScheduleChange as EventListener);
    };
  }, []);

  const [visibleEvents, setVisibleEvents] = useState<Set<number>>(new Set());

  const handleEventToggle = (eventId: number, isVisible: boolean) => {
    setVisibleEvents(prev => {
      const newSet = new Set(prev);
      if (isVisible) {
        newSet.add(eventId);
      } else {
        newSet.delete(eventId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const newCalendarEvents: EventInput[] = [];
    
    courses.forEach(course => {
      Object.values(course.events).flat().forEach((event) => {
        if (visibleEvents.has(event.id)) {
          newCalendarEvents.push({
            id: event.id.toString(),
            title: event.title,
            start: event.start_datetime,
            end: event.end_datetime,
            allDay: event.is_all_day,
            backgroundColor: "#f87171", // Red color for courses
            borderColor: "#f87171",
            classNames: ["temp-course-event"],
            extendedProps: { location: event.location, description: event.description, source_url: event.source_url,
                           event_id: event.event_id || event.id, // event_id for occurrences, id for non-recurring}
            }
          });
        }
      });
    });

    clubs.forEach(club => {
      Object.values(club.events).flat().forEach((event) => {
        if (visibleEvents.has(event.id)) {
          newCalendarEvents.push({
            id: event.id.toString(),
            title: event.title,
            start: event.start_datetime,
            end: event.end_datetime,
            allDay: event.is_all_day,
            backgroundColor: "#4ade80", // Green color for clubs
            borderColor: "#4ade80",
            classNames: ["temp-club-event"],
            extendedProps: { location: event.location, description: event.description, source_url: event.source_url,
                           event_id: event.event_id || event.id, // event_id for occurrences, id for non-recurring}
            }
          });
        }
      });
    });

    setCalendarEvents(newCalendarEvents);
  }, [courses, clubs, visibleEvents]);

  const handleRemoveCategory = async (categoryId: number) => {
    try {
      await removeCategoryFromSchedule(categoryId, userId);
      fetchSchedule();
    } catch (error) {
      console.error("Failed to remove category", error);
    }
  };

  if (loading || !isLoaded) {
    return <div>Loading your schedule...</div>;
  }

  return (
    <div className="flex h-[calc(99vh-80px)]">
    <TwoColumnLayout 
      leftContent={
        <ProfileSidebar 
          courses={courses} 
          clubs={clubs} 
          onRemoveCategory={handleRemoveCategory}
          onEventToggle={handleEventToggle}
          currentScheduleId={currentScheduleId ? Number(currentScheduleId) : undefined}
          onScheduleUpdate={() => fetchSchedule(currentScheduleId || undefined)}
        />
      } 
      // rightContent={<Calendar events={calendarEvents} setEvents={setCalendarEvents} setEventId={() => {}}/>} 
      rightContent={<Calendar events={calendarEvents} />} 
    />
    </div>
  );
}