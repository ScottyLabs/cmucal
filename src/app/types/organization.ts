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

export interface ClubOrganization {
  id: number;
  name: string;
  description: string;
}

export interface CourseOption {
    id: string;
    number: string;
    title: string;
    label: string;
  }
  