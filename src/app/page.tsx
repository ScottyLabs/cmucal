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

// Color map matching sidebar accordion colors
const accordionColorHexValues = ['#f26d6d', '#58c05c', '#c36df2', '#6da4f2', '#f2b06d'] as const;

function getColorForIndex(index: number): string {
  return accordionColorHexValues[index % accordionColorHexValues.length] ?? '#f26d6d';
}

/**
 * Profile page with personalized calendar view
 */
export default function Home() {
  const { calendarEvents, setCalendarEvents, savedEventIds } = useEventState();
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

    courses.forEach((course, courseIndex) => {
      const eventColor = getColorForIndex(courseIndex);

      course.categories.forEach(category => {
        const categoryEvents = course.events[category.name] ?? [];
        const isCategoryVisible = visibleCategories.has(category.id);

        categoryEvents.forEach((event) => {
          const eventId = event.event_id ?? event.id;
          const isSaved = savedEventIds.has(eventId);

          // Show if: category is visible OR event is saved to personal calendar
          if (isCategoryVisible || isSaved) {
            newCalendarEvents.push({
              id: event.id.toString(),
              title: event.title,
              start: event.start_datetime,
              end: event.end_datetime,
              allDay: event.is_all_day,
              backgroundColor: eventColor,
              borderColor: eventColor,
              classNames: ["temp-course-event"],
              extendedProps: {
                location: event.location,
                description: event.description,
                source_url: event.source_url,
                event_id: eventId,
                isSaved: isSaved,
                categoryHidden: !isCategoryVisible,
              }
            });
          }
        });
      });
    });

    clubs.forEach((club, clubIndex) => {
      const eventColor = getColorForIndex(clubIndex);

      club.categories.forEach(category => {
        const categoryEvents = club.events[category.name] ?? [];
        const isCategoryVisible = visibleCategories.has(category.id);

        categoryEvents.forEach((event) => {
          const eventId = event.event_id ?? event.id;
          const isSaved = savedEventIds.has(eventId);

          // Show if: category is visible OR event is saved to personal calendar
          if (isCategoryVisible || isSaved) {
            newCalendarEvents.push({
              id: event.id.toString(),
              title: event.title,
              start: event.start_datetime,
              end: event.end_datetime,
              allDay: event.is_all_day,
              backgroundColor: eventColor,
              borderColor: eventColor,
              classNames: ["temp-club-event"],
              extendedProps: {
                location: event.location,
                description: event.description,
                source_url: event.source_url,
                event_id: eventId,
                isSaved: isSaved,
                categoryHidden: !isCategoryVisible,
              }
            });
          }
        });
      });
    });

    setCalendarEvents(newCalendarEvents);
  }, [courses, clubs, visibleCategories, savedEventIds, setCalendarEvents]);

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