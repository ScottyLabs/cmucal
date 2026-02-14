"use client";

import { FC } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, EventInput } from "@fullcalendar/core";
import { useGcalEvents } from "../../context/GCalEventsContext";
import { useEventState } from "../../context/EventStateContext";
import "../../styles/calendar.css";
import { useIsMobile } from "../hooks/useIsMobile";
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
  const { openDetails } = useEventState();
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


  console.log("Merged Events:", mergedEvents);

  const handleEventClick = (info: EventClickArg) => {
    const { event, el } = info;
    const eventId = event.extendedProps.event_id;

    // Construct event data from FullCalendar event to avoid API fetch
    const eventData: Partial<EventType> = {
      id: eventId,
      title: event.title,
      start_datetime: event.start?.toISOString() ?? '',
      end_datetime: event.end?.toISOString() ?? '',
      is_all_day: event.allDay,
      location: event.extendedProps.location ?? '',
      description: event.extendedProps.description ?? '',
      source_url: event.extendedProps.source_url,
      org_id: event.extendedProps.org_id,
      category_id: event.extendedProps.category_id,
      org: event.extendedProps.org,
      user_is_admin: event.extendedProps.user_is_admin,
    };

    // Get position of clicked event for popover placement
    const rect = el.getBoundingClientRect();
    const position = {
      x: rect.right + 8, // 8px gap from event
      y: rect.top,
      anchorRect: rect,
    };

    openDetails(eventId, eventData as EventType, position);
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
        // height="auto"
        // height={600}
        height="100%"
        // eventClassNames="text-sm font-semibold p-1 rounded-md"
      />

    </div>
  );
}

export default Calendar;