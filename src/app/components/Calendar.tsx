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
  const { user } = useUser();
  // Define state with EventInput type
  const { gcalEvents } = useGcalEvents();
  const { modalView, openDetails, getOccurrenceFromGCalEvent, optimisticOverrides } = useEventState();

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

  
  // 3. optimistic overrides (highest priority)
  optimisticOverrides.forEach((event, id) => {
    mergedEventsMap.set(id, event);
  });

  const mergedEvents = Array.from(mergedEventsMap.values());
  const calendarKey = mergedEvents.map(e => e.id).sort().join(",");

  console.log("Merged Events:", mergedEvents);

  const handleEventClick = async (info: EventClickArg) => {
    
    let eventInfo: EventType;
    
    console.log("🍵", info.event);
    const source = info.event.extendedProps.cal_source;
    console.log(info.event._def.title, info.event._instance?.range.start, info.event._instance?.range.end, "😮", source);
    console.log("clicked event id:", info.event.extendedProps.event_id);


    if (source == "cmucal") {
      const occurrenceId = await getOccurrenceFromGCalEvent({
        googleEventId: info.event.extendedProps.gcalEventId,
        startTime: info.event.start?.toISOString() || "",
        userId: user?.id ?? "-1",
      });
      if (!occurrenceId) return;
      openDetails(Number(occurrenceId));
    } else { // source == "gcal"
      eventInfo = {
        title: info.event._def.title,
        start_datetime: info.event._instance?.range.start.toISOString() ||"", 
        end_datetime: info.event._instance?.range.end.toISOString() ||"",
        id: -1, 
        is_all_day: false, // TODO: these are currently just placeholders, need to edit the google api to fetch more info later
        location: "random location",
        org_id: "6004", // cmucal org lol - do we need a dummy org and category
        category_id: "22", // cmucal dev
      };
      openDetails(info.event.extendedProps.event_id, undefined, undefined, eventInfo);
    }
        
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
        key={calendarKey}
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