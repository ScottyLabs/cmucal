export type EventType = {
  id: number;//string;
  title: string;
  start_datetime: string; // start_datetime
  end_datetime: string; // end_datetime
  is_all_day: boolean;
  event_timezone?: string;
  location: string;
  user_edited?: string; // i forgot what this is 
  org_id: string;
  org?: string;
  category_id: string;
  source_url?: string;
  description?: string; 
  event_type?: string;
  user_saved?: boolean;
  user_is_admin?: boolean;
  // repeat?: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  event_id?: number; // slightly messy rn cuz of transition from events to event occurrences on some functions
};