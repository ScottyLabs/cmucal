import { EventInput } from "@fullcalendar/core";
import dayjs, { Dayjs } from "dayjs";


export interface Event {
  _id: {
    $oid: string;
  };
  resource_type: string;
  instructor: string | null;
  course_id: string;
  course_name: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  professor: string | null;
  resource_source: string;
}


export interface CourseOption {
  id: string;
  type: string;
  selected: boolean;
}


export interface Course {
  id: string;
  courseId: string;
  name: string;
  section: string;
  options: CourseOption[];
}


export interface ClubOption {
  id: string;
  type: string;
  selected: boolean;
}


export interface Club {
  id: string;
  name: string;
  options: ClubOption[];
}


export interface ToggleItemProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}


export interface AccordionProps {
  title: string;
  subtitle?: string;
  color?: string;
  children: React.ReactNode;
  badge?: string;
}

export interface GCalLinkPayloadType {
  gcal_link: string;
  org_id: string;
  category_id: string;
  clerk_id: string;
  course_num?: string;
  course_name?: string;
  instructors?: string[];
}


export interface EventPayloadType {
  title: string;
  description?: string;
  start_datetime?: string | null;
  end_datetime?: string | null;
  is_all_day?: boolean;
  location: string;
  source_url?: string;
  event_type: string;
  category_id: number;
  org_id: string;
  clerk_id: string;
  event_tags?: string[];
  course_num?: string;
  course_name?: string;
  instructors?: string[];
  host?: string;
  link?: string;
  registration_required?: boolean;
  recurrence?: string; // "RECURRING" or "ONETIME" or "EXCEPTION"
  recurrence_data?: RecurrenceOutput["dbRecurrence"] | null; // Only if recurrence is "RECURRING"
}

export interface RecurrenceInput {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  selectedDays: number[];     // For weekly recurrence: [0 (Sun) - 6 (Sat)]
  ends: "never" | "on" | "after";
  endDate: Dayjs | null;
  occurrences: number;
  startDatetime: Dayjs;
  eventId: number;
  nthWeek?: number | null;    // For monthly recurrence: 1-5 or -1 for last week
}

export interface RecurrenceOutput {
  dbRecurrence: {
    frequency: string;
    interval: number;
    count: number | null;
    until: string | null;
    event_id: number;
    by_day: string[] | null;
    by_month: number | null;
    by_month_day: number | null;
    start_datetime: string;
  };
  summary: string;
}

export type RRuleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type DBRecurrenceEnds = "never" | "on" | "after";

export interface EventOccurrence {
    id: number;
    title: string;
    description: string | null;
    start_datetime: string;
    end_datetime: string;
    location: string;
    is_all_day: boolean;
    source_url: string | null;
    recurrence: string;
    event_id: number;
    org_id: number;
    category_id: number;
}

export interface Category {
    id: number;
    name: string;
}

export interface CategoryOrg {
  id: number;
  name: string;
  org_id: string;
  organization_name: string;
  created_at: Date | null;
}

export interface Organization {
    org_id: number;
    name: string;
    categories: Category[];
    events: {
        [category_name: string]: EventOccurrence[];
    };
}

export interface Course extends Organization {
    type: "COURSE" | "ACADEMIC";
}

export interface Club extends Organization {
    type: "CLUB";
    description?: string | null;
}

export interface CourseOption {
  id: string;
  number: string;
  title: string;
  label: string;
};

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
};
  
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
};

export type AuthStatus = { authorized: boolean };

export interface ClubOrganization {
  id: number;
  name: string;
  description: string;
}

// Generic type for your jsonify response
export type CoursesClubsResponse = {
  courses: Course[];
  clubs: Club[];
};

export interface TagType {
  id: number;
  name: string;
}

export type ReadIcalLinkResponse = { message: string; calendar_source_id: number };



export type LoginPayload = {
  clerk_id: string;
  email?: string;
  fname?: string | null;
  lname?: string | null;
};

export type LoginResponse = {
  user: { id: number | string };
};
