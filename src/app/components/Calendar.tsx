"use client";

import { useEffect, useState } from "react";
import { FC } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core"; 
import { useGcalEvents } from "../../context/GCalEventsContext";
import { useEventState } from "../../context/EventStateContext";
import "../../styles/calendar.css"; 
import { useIsMobile } from "../hooks/useIsMobile";

import { EventInput } from "@fullcalendar/core"; // Import FullCalendar's Event Type
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import FullCalendarCard from "./FullCalendarCard";

import { EventType } from "../types/EventType";

type Props = {
  events: EventInput[];
  // setEvents: React.Dispatch<React.SetStateAction<any[]>>;
  // setEventId: (eventId: string) => void;
};

const Calendar: FC<Props> = ({ events }) => {
  // Define state with EventInput type
  const { gcalEvents } = useGcalEvents();
  const { modalView, openDetails } = useEventState();
  const isMobile = useIsMobile();

  const mergedEventsMap = new Map<string, EventInput>();

  // First add gcalEvents (lower priority)
  gcalEvents.forEach(event => {
    // mergedEventsMap.set(event.id as string, event);
    const key = event.id?.toString() || `${event.title}-${event.start}`;
    mergedEventsMap.set(key, event);
  });

  // Then add events (higher priority — will overwrite duplicates)
  events.forEach(event => {
    // if (event.title === "15210 A") {
    //   console.log(event.title, event.start);
    // }
    const key = event.id?.toString() || `${event.title}-${event.start}`;
    mergedEventsMap.set(key, event);
  });

  const mergedEvents = Array.from(mergedEventsMap.values());

  // Show event detail in the modal by querying event.id from event_occurences
  const handleEventClick = async (info: EventClickArg) => {
    openDetails(Number(info.event.id));  
    console.log("modal:", modalView)
  };

  return (
    <div className={isMobile ? "dark:text-gray-300 h-full" : "p-8 dark:text-gray-300 h-full"}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "today prev,next",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        // events={events}
        events={mergedEvents}
        editable={true}
        selectable={true}
        eventClick={handleEventClick}
        eventContent={FullCalendarCard} 
        height="100%"
      />

    </div>
  );
}

export default Calendar;