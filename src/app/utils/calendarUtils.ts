import { GCalEvent, FullCalendarEvent } from "./types" ;

// need to add more fields to this, such as location, description, source, etc.
export function formatGCalEvent(event: GCalEvent, cmuCalIds: string[]): FullCalendarEvent {
    console.log("🐕 event: ", event);
    let formattedEvent: FullCalendarEvent = {
        id: `${event.title}-${event.start}`,
        title: event.title || "Untitled Event",
        start: event.allDay ? event.start : new Date(event.start),
        end: event.allDay ? event.end : new Date(event.end),
        allDay: event.allDay,
        extendedProps: {
            calendarId: event.calendarId,
            gcalEventId: event.gcalEventId,
            location: event.location || "",
            description: event.description || "",
            source_url: event.source_url || "",
            cal_source: cmuCalIds.includes(event.calendarId) ? "cmucal" : "gcal",
        }
    }
    if (cmuCalIds.includes(event.calendarId)) {
        return {
            ...formattedEvent,
            classNames: ["cmucal-event"],
        };
    } else {
        return {
            ...formattedEvent,
            classNames: ["gcal-event"],
        };
    }
}