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

function PageSkeleton() {
  return (
    <div className="flex w-screen h-full animate-pulse">
      {/* Sidebar */}
      <div style={{ width: 320, minWidth: 320 }} className="flex-shrink-0 py-6 px-8 border-r border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex gap-1">
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        {[80, 64, 72].map((w, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded`} style={{ width: w }} />
          </div>
        ))}
        <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-6" />
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex gap-1">
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        {[88, 60].map((w, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: w }} />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

      {/* Calendar */}
      <div className="flex-1 p-8 overflow-hidden">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-9 w-44 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        {/* Day header row */}
        <div className="grid grid-cols-8 mb-1">
          <div className="h-10" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-px">
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        {/* Time slot rows */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="grid grid-cols-8 mb-px">
            <div className="h-10 flex items-start pt-1 pr-2 justify-end">
              <div className="h-2.5 w-8 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="h-10 border-t border-gray-100 dark:border-gray-800 mx-px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobilePageSkeleton() {
  return (
    <div className="w-full h-full animate-pulse p-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-8 mb-1">
        <div className="h-8" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-px">
            <div className="h-2.5 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      {/* Slots */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="grid grid-cols-8 mb-px">
          <div className="h-10 flex items-start pt-1 pr-1 justify-end">
            <div className="h-2.5 w-6 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
          {Array.from({ length: 7 }).map((_, j) => (
            <div key={j} className="h-10 border-t border-gray-100 dark:border-gray-800 mx-px" />
          ))}
        </div>
      ))}
    </div>
  );
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
                org_id: event.org_id,
                category_id: event.category_id,
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
                org_id: event.org_id,
                category_id: event.category_id,
              }
            });
          }
        });
      });
    });

    setCalendarEvents(newCalendarEvents);
  }, [courses, clubs, visibleCategories, savedEventIds, setCalendarEvents]);

  if (loading) {
    return isMobile ? <MobilePageSkeleton /> : <PageSkeleton />;
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