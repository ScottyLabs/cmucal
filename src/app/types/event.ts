import type { RecurrenceOutput } from "../types/recurrence";

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

