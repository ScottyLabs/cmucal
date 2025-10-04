import { GCalEvent, FullCalendarEvent } from "./types" ;

// need to add more fields to this, such as location, description, source, etc.
export function formatGCalEvent(event: GCalEvent, cmuCalIds: string[]): FullCalendarEvent {
    let formattedEvent: FullCalendarEvent = {
        id: `${event.title}-${event.start}`,
        title: event.title || "Untitled Event",
        start: event.allDay ? event.start : new Date(event.start),
        end: event.allDay ? event.end : new Date(event.end),
        allDay: event.allDay,
        extendedProps: {
            calendarId: event.calendarId,
            location: event.location || "",
            description: event.description || "",
            source_url: event.source_url || ""
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