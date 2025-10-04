import { apiGet, apiPost, api, apiPostWithStatus } from "./api";
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