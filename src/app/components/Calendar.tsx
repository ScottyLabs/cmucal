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

  const mergedEventsMap = new Map<string, EventInput>();

  // First add gcalEvents (lower priority)
  gcalEvents.forEach(event => {
    // mergedEventsMap.set(event.id as string, event);
    const key = event.id?.toString() || `${event.title}-${event.start}`;
    mergedEventsMap.set(key, event);
  });

  // Then add events (higher priority — will overwrite duplicates)
  events.forEach(event => {
    const key = event.id?.toString() || `${event.title}-${event.start}`;
    mergedEventsMap.set(key, event);
  });

  const mergedEvents = Array.from(mergedEventsMap.values());


  console.log("Merged Events:", mergedEvents);

  const handleEventClick = async (info: EventClickArg) => {
    console.log(info.event);
    console.log(info.event.extendedProps);
    console.log("clicked event id:", info.event.extendedProps.event_id);
    // setEventId(info.event.extendedProps.event_id)
    openDetails(Number(info.event.id));
    openDetails(info.event.extendedProps.event_id);
    console.log("modal:", modalView)
  };

  return (
    <div className="-pt-4 p-4 bg-white rounded-lg shadow-md dark:bg-gray-700 dark:text-gray-300 h-full">
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
        // height="auto"
        // height={600}
        height="100%"
        // eventClassNames="text-sm font-semibold p-1 rounded-md"
      />

    </div>
  );
}

export default Calendar;