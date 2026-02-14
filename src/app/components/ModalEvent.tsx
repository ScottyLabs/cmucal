"use client";

import Modal from './Modal';
import { formatDate } from "~/app/utils/dateService";
import { EventType } from '../types/EventType';
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from 'react';
// import ModalEventUpdate from './ModalEventUpdate';
import { useEventState } from "../../context/EventStateContext";
import { fetchTagsForEvent } from "../utils/api/events";
import { API_BASE_URL } from '../utils/api/api';
import { useGcalEvents } from '../../context/GCalEventsContext';

type ModalEventProps = {
    show: boolean;
    onClose: () => void;
    // toggleAdded?: (eventId:number) => void;
    // eventId?: number|null;
    savedEventDetails?: EventType;
}
type Tag = { id?: string; name: string };

function SkeletonEventDetails() { 
    return (
        <div className="animate-pulse p-4 rounded-lg mb-2 bg-white space-y-3">
            <p className="h-5 bg-gray-200 rounded w-2/5"></p> 
            <p className="h-3 bg-gray-200 rounded w-3/5"></p>
            <p className="h-3 bg-gray-200 rounded w-1/3"></p>
            <p className="h-3 bg-gray-200 rounded w-4/5"></p>
            <p className="h-2 my-3"></p>
            <p className="h-3 bg-gray-200 rounded w-full"></p>
            <p className="h-3 bg-gray-200 rounded w-full"></p>
            <p className="h-2 my-3"></p>
            <div className="flex">
            <p className="h-8 bg-gray-200 rounded w-1/2 mr-2"></p>
            <p className="h-8 bg-gray-200 rounded w-1/2"></p></div> 
        </div>
    )
}


export default function ModalEvent({ show, onClose, savedEventDetails }: ModalEventProps) {    
    const { user } = useUser();
    const { selectedEvent, openUpdate, toggleAdded, savedEventIds } = useEventState();
    const { isGoogleConnected } = useGcalEvents();
    const [eventDetails, setEventDetails] = useState<EventType | null>(savedEventDetails || null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    console.log("🤔🤔🤔savedEventDetails", savedEventDetails, eventDetails)
    const [loadingEvent, setLoadingEvent] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);

    const eventId = selectedEvent;
    
    const isAdmin = eventDetails?.user_is_admin;

    useEffect(() => {
        // get specific event with ID
        if (!eventId) return;
        if (eventDetails) return; // Already have event details, don't refetch

        setLoadingEvent(true);
        const fetchEventDetails = async() => {
            try {
                const eventRes = await axios.get(`${API_BASE_URL}/events/${eventId}`, {
                    params: {
                        user_id: user?.id,
                    },
                    withCredentials: true,
                });
                setEventDetails(eventRes.data)

            } catch (err) {
                console.error("Failed to fetch event details for event: ", eventId, err);
            } finally {
                setLoadingEvent(false);
            }
        }
        fetchEventDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId, user?.id])

    useEffect(() => {
        if (!eventId) return;

        setLoadingTags(true);
        const fetchTag = async() => {
            try {
                const tags = await fetchTagsForEvent(eventId); // e.g. [{ id: "1", name: "computer science" }, ...]
                setSelectedTags(
                    tags.map((tag: any) => ({
                        id: tag.id,
                        name: tag.name.toLowerCase(),
                    }))
                );
            } catch (err) {
                console.error("Failed to fetch event tags for event: ", eventId, err);
            } finally {
                setLoadingTags(false);
            }
        }
        fetchTag();
    }, [eventId])

    console.log("show edit modal!!", show, eventDetails)

    return (
        <Modal show={show} onClose={onClose}>
            <div>
                {/* loadingEvent: {loadingEvent ? "true" : "false" } */}
                {/* loadingTags: {loadingTags ? "true" : "false" } */}
                { (loadingEvent || loadingTags)
                    ? <SkeletonEventDetails/>
                    : <>
                {eventDetails && (
                    <>
                <p className="text-lg">{eventDetails.title}</p>
                <p className="text-base text-gray-500">{formatDate(eventDetails.start_datetime)} - {formatDate(eventDetails.end_datetime)}</p>
                <p className="text-base text-gray-500">{eventDetails.location}</p>
                {eventDetails.org && (<p className="text-base text-gray-500">Hosted by {eventDetails.org}</p>)}
                <p className="text-base text-gray-500 py-4">{eventDetails.description || "No additional details available."}</p>
                
                {/* Tags */}
                {!loadingTags && selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Google Calendar Warning */}
                {!isGoogleConnected && (
                  <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Connect Google Calendar to sync events to your calendar
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                <button 
                className={`px-4 py-2 rounded-md ${ isAdmin ? "flex-1" : "w-full"} ${
                    savedEventIds.has(eventDetails.id) ? "bg-blue-300" : "bg-blue-500"
                } text-white`}
                    onClick={() => {toggleAdded(eventDetails); onClose()}}>
                   { savedEventIds.has(eventDetails.id) ? "Remove" : "Add" }
                </button> 

                <button className={`px-4 py-2 rounded-md ${ isAdmin ? "flex-1" : "hidden"}  bg-gray-200`}
                    onClick={() => { openUpdate(eventDetails, selectedTags) }}>
                    Edit Event
                </button></div>
                </>)}</>}
            </div>
        </Modal>
    )
}
