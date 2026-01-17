"use client";
import { useState } from "react";

import TwoColumnLayout from "@components/TwoColumnLayout";
import Calendar from "@components/Calendar";
import SearchResultsSidebar from "@components/SearchResultSidebar";
import ProfileSidebar from "@components/ProfileSidebar";
import MobileSidebarDrawer from "@components/MobileSidebarDrawer";
import type { EventType } from "../types/EventType";
import { useEventState } from "~/context/EventStateContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { useUser } from "~/context/UserContext";
// import ModalEvent from "../components/ModalEvent";
// import ModalEventForm from "../components/ModalEventForm"

export default function ExplorePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const { calendarEvents } = useEventState();
  const { toggleAdded } = useEventState();
  const isMobile = useIsMobile();
  const { courses, clubs, currentScheduleId, visibleCategories, toggleCategoryVisibility } = useUser();

  const handleEventToggle = (categoryId: number, _isVisible: boolean) => {
    toggleCategoryVisibility(categoryId);
  };

  const searchSidebar = <SearchResultsSidebar events={events} setEvents={setEvents} toggleAdded={toggleAdded}/>;
  const calendarView = <Calendar events={calendarEvents}/>;
  const courseSidebar = (
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
          {courseSidebar}
        </MobileSidebarDrawer>
      )}
      
      <div className="flex h-full">
        {isMobile ? (
          // Mobile: Show search results as main view, calendar is on home page
          <div className="w-full">
            {searchSidebar}
          </div>
        ) : (
          // Desktop: Show two-column layout
          <TwoColumnLayout
            leftContent={searchSidebar}
            rightContent={calendarView}
          />
        )}
      </div>
    </>
  );
}
