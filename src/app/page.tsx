"use client"

import { useEffect } from "react";
import TwoColumnLayout from "@components/TwoColumnLayout";
import type { EventInput } from "@fullcalendar/core";
import ProfileSidebar from "./components/ProfileSidebar";
import Calendar from "./components/Calendar";
import MobileSidebarDrawer from "./components/MobileSidebarDrawer";
import { useEventState } from "~/context/EventStateContext";
import { useUser } from "~/context/UserContext";
import { useIsMobile } from "./hooks/useIsMobile";

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
    visibleCategories,
    toggleCategoryVisibility
  } = useUser();
  const isMobile = useIsMobile();

  const handleEventToggle = (categoryId: number, _isVisible: boolean) => {
    toggleCategoryVisibility(categoryId);
  };

  useEffect(() => {
    const newCalendarEvents: EventInput[] = [];

    courses.forEach(course => {
      course.categories.forEach(category => {
        if (visibleCategories.has(category.id)) {
          const categoryEvents = course.events[category.name] ?? [];
          categoryEvents.forEach((event) => {
            // if (event.title === "15210 A") {
            //   console.log("Adding event to calendar:", event.title, event.start_datetime);
            // }
            newCalendarEvents.push({
              id: event.id.toString(),
              title: event.title,
              start: event.start_datetime,
              end: event.end_datetime,
              allDay: event.is_all_day,
              backgroundColor: "#f87171", // Red color for courses
              borderColor: "#f87171",
              classNames: ["temp-course-event"],
              extendedProps: {
                location: event.location,
                description: event.description,
                org: event.org,          
                start_datetime: event.start_datetime, 
                end_datetime: event.end_datetime,     
                source_url: event.source_url,
                event_id: event.id
              }
            });
        });
    }
      });
});

clubs.forEach(club => {
  club.categories.forEach(category => {
    if (visibleCategories.has(category.id)) {
      const categoryEvents = club.events[category.name] ?? [];
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
          extendedProps: {
            location: event.location, description: event.description, source_url: event.source_url,
            event_id: event.event_id ?? event.id, // event_id for occurrences, id for non-recurring}
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

const sidebarContent = (
  <ProfileSidebar
    courses={courses}
    clubs={clubs}
    onCategoryToggle={handleEventToggle}
    currentScheduleId={currentScheduleId ? Number(currentScheduleId) : undefined}
    visibleCategories={visibleCategories}
  />
);

return (
  <>
    {isMobile && (
      <MobileSidebarDrawer>
        {sidebarContent}
      </MobileSidebarDrawer>
    )}

    <div className="flex h-full">
      {isMobile ? (
        // Mobile: Only show calendar, sidebar is in drawer
        <div className="w-full">
          <Calendar events={calendarEvents} />
        </div>
      ) : (
        // Desktop: Show two-column layout
        <TwoColumnLayout
          leftContent={sidebarContent}
          rightContent={<Calendar events={calendarEvents} />}
        />
      )}
    </div>
  </>
);
}