export type EventType = {
  id: number;//string;
  title: string;
  start_datetime: string; // start_datetime
  end_datetime: string; // end_datetime
  is_all_day: boolean;
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
};