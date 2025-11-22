import type { Course, Club } from "./organization";

export type AuthStatus = { authorized: boolean };

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
