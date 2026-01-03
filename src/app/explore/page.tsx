"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

import TwoColumnLayout from "@components/TwoColumnLayout";
import Calendar from "@components/Calendar";
import SearchResultsSidebar from "@components/SearchResultSidebar";
import { EventType } from "../types/EventType";
import { useEventState } from "~/context/EventStateContext";
// import ModalEvent from "../components/ModalEvent";
// import ModalEventForm from "../components/ModalEventForm"

export default function ExplorePage() {
  // const { user } = useUser();
  const [events, setEvents] = useState<EventType[]>([]);
  // const [calendarEvents, setCalendarEvents] = useState([]);
  const { calendarEvents, setCalendarEvents } = useEventState();
  const { toggleAdded } = useEventState();
  return (
    <div className="flex h-[calc(100vh-65px)]">
    <TwoColumnLayout
      leftContent={<SearchResultsSidebar events={events} setEvents={setEvents} toggleAdded={toggleAdded}/>}
      rightContent={<Calendar events={calendarEvents}/>}
    />

    </div>
    
  );
}
