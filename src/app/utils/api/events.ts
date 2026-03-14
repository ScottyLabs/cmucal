import { apiGet, apiPost, api, apiPostWithStatus, apiPatch, apiDelete } from "./api";
import { TagType, EventPayloadType, GCalLinkPayloadType, ReadIcalLinkResponse } from "../types";
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

export const readIcalLink = (payload: GCalLinkPayloadType) =>
  apiPostWithStatus<ReadIcalLinkResponse, GCalLinkPayloadType>(
    "/events/read_gcal_link",
    payload
);

export const updateEvent = async (
  eventId: number,
  payload: { updated_event: Record<string, any>; updated_tags?: { name: string }[]; updated_recurrence?: any }
): Promise<any> => {
  return apiPatch(`/events/${eventId}`, payload);
};

export const deleteEventsByParams = async (
  params: { semester?: string; org_id?: number; category_id?: number; event_type?: string; source_url?: string }
): Promise<any> => {
  return apiDelete("/events/batch_delete_events_by_params", {
    data: params,
  });
};

export const deleteEvent = async (eventId: number): Promise<any> => {
  return apiDelete(`/events/${eventId}`);
};