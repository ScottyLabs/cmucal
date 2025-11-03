import { apiGet, apiPost, api, apiPostWithStatus } from "./api";
import { TagType, EventPayloadType, GCalLinkPayloadType, ReadIcalLinkResponse, RecurrenceInput } from "../types";
import type { AxiosResponse } from "axios";

export const fetchTagsForEvent = (eventId:number) =>
  apiGet<TagType[]>(`/events/${eventId}/tags`);

export const fetchAllTags = () => apiGet<TagType[]>(`/events/tags`);

export const createEvent = async (payload: EventPayloadType): Promise<any> => {
  try {
    const res = await api.post<void>("/events/create_event", payload);
    return res;
  } catch (error) {
    console.error("Failed to remove organization from schedule:", error);
    throw error;
  }
};

export const getEventOccurrence = async (event_occurrence_id: number, user_id: string): Promise<AxiosResponse<any>> =>  {
  try {
    const res = await api.get(`/events/occurrence/${event_occurrence_id}`, {
      params: { user_id },
      withCredentials: true,
    });
    return res;
  } catch (error) {
    console.error("Failed to fetch event details:", error);
    throw error;
  }
};

export const getTags = async (eventId: number, userId: string): Promise<TagType[]> => {
    return apiGet<TagType[]>(`/events/${eventId}/tags`, {
        headers: { "Clerk-User-Id": userId },
    });
};

export const recurrenceRuleRes = async (eventId: number, userId: string): Promise<RecurrenceInput[]> => {
    return apiGet<RecurrenceInput[]>(`/events/${eventId}/recurrence`, {
        headers: { "Clerk-User-Id": userId },
    });
};


export const readIcalLink = (payload: GCalLinkPayloadType) =>
  apiPostWithStatus<ReadIcalLinkResponse, GCalLinkPayloadType>(
    "/events/read_gcal_link",
    payload
);