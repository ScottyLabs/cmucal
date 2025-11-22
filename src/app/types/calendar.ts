export interface CalendarFields {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  timeZone: string;
  primary?: boolean;
  kind?: string;
  etag?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  accessRole?: string;
  defaultReminders?: { method: string; minutes: number }[];
  conferenceProperties?: any;
}

export interface GCalEvent {
    id?: string;
    title?: string;
    start: string;
    end: string;
    location?: string;
    description?: string;
    source_url?: string;
    allDay?: boolean;
    calendarId: string;
}
  
export interface FullCalendarEvent {
    id: string;
    title: string;
    start: string | Date;
    end: string | Date;
    allDay?: boolean;
    classNames?: string[];
    extendedProps: {
      calendarId: string,
      location?: string,
      description?: string,
      source_url?: string,
      event_id?: string
    }
}
