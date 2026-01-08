"use client"

import { useEffect } from "react";
import TwoColumnLayout from "@components/TwoColumnLayout";
import { EventInput } from "@fullcalendar/core";
import ProfileSidebar from "./components/ProfileSidebar";
import Calendar from "./components/Calendar";
import { useEventState } from "~/context/EventStateContext";
import { useUser } from "~/context/UserContext";

/**
 * Profile page with personalized calendar view
 */
export default function Home() {
  const { calendarEvents, setCalendarEvents } = useEventState();
  const { 
    courses, 
    clubs, 
    loading, 
    currentScheduleId, 
    handleRemoveCategory, 
    fetchSchedule,
    visibleCategories,
    setVisibleCategories 
  } = useUser();

  const handleEventToggle = (categoryId: number, isVisible: boolean) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (isVisible) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const newCalendarEvents: EventInput[] = [];
    
    courses.forEach(course => {
      course.categories.forEach(category => {
        if (visibleCategories.has(category.id)) {
          const categoryEvents = course.events[category.name] || [];
          categoryEvents.forEach((event) => {
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
          });
        }
      });
    });

    clubs.forEach(club => {
      club.categories.forEach(category => {
        if (visibleCategories.has(category.id)) {
          const categoryEvents = club.events[category.name] || [];
          categoryEvents.forEach((event) => {
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
          });
        }
      });
    });

    setCalendarEvents(newCalendarEvents);
  }, [courses, clubs, visibleCategories, setCalendarEvents]);

  if (loading) {
    return <div className="p-4">Loading your schedule...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-65px)]">
    <TwoColumnLayout 
      leftContent={
        <ProfileSidebar 
          courses={courses} 
          clubs={clubs} 
          onRemoveCategory={handleRemoveCategory}
          onCategoryToggle={handleEventToggle}
          currentScheduleId={currentScheduleId ? Number(currentScheduleId) : undefined}
          onScheduleUpdate={() => fetchSchedule(currentScheduleId || undefined, true)}
        />
      } 
      // rightContent={<Calendar events={calendarEvents} setEvents={setCalendarEvents} setEventId={() => {}}/>} 
      rightContent={<Calendar events={calendarEvents} />} 
    />
    </div>
  );
}