"use client";

import Modal from './Modal';
import { formatDate, dbRecurrenceToForm } from "~/app/utils/dateService";
import { EventType } from '../types/EventType';
import axios from "axios";
import { User } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from 'react';
import { userAgent } from 'next/server';
// import ModalEventUpdate from './ModalEventUpdate';
import { useEventState } from "../../context/EventStateContext";
import { RecurrenceInput } from '../utils/types';
import dayjs from 'dayjs';

type ModalEventProps = {
    show: boolean;
    onClose: () => void;
    // toggleAdded?: (eventId:number) => void;
    // eventId?: number|null;
    savedEventDetails?: EventType;
    event_id?: number;
    googleFields?: EventType;
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


export default function ModalEvent({ show, onClose, event_id, googleFields }: ModalEventProps) {    
    const { user } = useUser();
    const { selectedEvent, openUpdate, toggleAdded, savedEventIds, modalData} = useEventState();
    const [eventDetails, setEventDetails] = useState<EventType | null>(null);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceInput | null>(null);
    const [repeat, setRepeat] = useState<string>("none");
    console.log("🤔🤔🤔savedEventDetails", eventDetails)
    const [loadingEvent, setLoadingEvent] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);
    
    const event_occurrence_id = selectedEvent;
    const eventId = event_id
    console.log("🍊🍊🍊", event_occurrence_id, eventId);
    
    const isAdmin = eventDetails?.user_is_admin;

    useEffect(() => {
        if (googleFields) setEventDetails(googleFields);
    }, [googleFields]);

    useEffect(() => {
        // get specific event with ID
        if (!eventDetails && !googleFields) { 
            console.log("🏃‍🏃‍🏃‍🏃‍🏃‍", googleFields, " || ", eventDetails);
            // TODO: i'd wanna have this so that it doesn't reload every time but we can think about this later
            // cuz currently the tags are not being passed through the modals and if i wanna keep them up to date i'll have to fetch
            // but i don't want it to load
            setLoadingEvent(true);
            const fetchEventDetails = async() => {
                try {
                    // const eventRes = await axios.get(`http://localhost:5001//api/events/${eventId}`, {
                    const eventRes = await axios.get(`http://localhost:5001//api/events/occurrence/${event_occurrence_id}`, {
                        params: {
                            user_id: user?.id,
                        },
                        withCredentials: true,
                    });
                    setEventDetails(eventRes.data)
                
                } catch (err) {
                    console.error("Failed to fetch event details for event: ", event_occurrence_id, err);
                } finally {
                    setLoadingEvent(false);
                }
            }
            fetchEventDetails();
            console.log("[edit] fetched event details", show, eventDetails)
        }
    }, [event_occurrence_id, eventDetails])

    useEffect(() => {
        if (!eventDetails && !googleFields) { 
        setLoadingTags(true);
        const fetchTagAndRecurrence = async() => {
            try {
                // Fetching tags              
                // const eventId = eventDetails.event_id;
                const tagRes = await axios.get(`http://localhost:5001/api/events/${eventId}/tags`, {
                    withCredentials: true,
                });
                const tags = tagRes.data; // e.g. [{ id: "1", name: "computer science" }, ...]
                setSelectedTags(
                    tags.map((tag: any) => ({
                        id: tag.id,
                        name: tag.name.toLowerCase(),
                    }))
                );
                
                // Fetching recurrence rule
                const emptyRecurrenceInput = {
                    frequency: "WEEKLY",
                    interval: 1,
                    selectedDays: [1, 2, 3, 4, 5],
                    ends: "never",
                    endDate: null,
                    occurrences: 13,
                    startDatetime: eventDetails?.start_datetime ?? dayjs(),
                    eventId: selectedEvent,
                    nthWeek: null, 
                }
                const recurrenceRuleRes = await axios.get(`http://localhost:5001/api/events/${eventId}/recurrence`, {
                    withCredentials: true,
                });
                const recRuleData = recurrenceRuleRes.data
                setRecurrenceRule(dbRecurrenceToForm(recRuleData) || emptyRecurrenceInput);
                // Derive repeat from recurrence info
                const repeat = !recRuleData
                    ? "none"
                    : recRuleData.count || recRuleData.until
                        ? "custom"
                        : recRuleData.frequency.toLowerCase();
                // Merge into event object
                // setEventDetails({
                //     ...eventDetails,
                //     repeat,
                // });
                // setEventDetails(prev => prev ? 
                //     { ...prev, repeat } : prev);
                setRepeat(repeat);

            } catch (err) {
                console.error("Failed to fetch event tags for event: ", eventId, err);
            } finally { 
                setLoadingTags(false);
            }
        }
        // fetchTag(); 
        // fetchRecurrence(); 
        fetchTagAndRecurrence();
        console.log("[edit] fetched tags and recurrence", show, selectedTags, recurrenceRule)  }    
    }, [eventDetails])





    
    // console.log("show edit modal!!", show, eventDetails)

    return (
        <Modal show={show} onClose={onClose}>
            <div>
                {/* loadingEvent: {loadingEvent ? "true" : "false" }
                loadingTags: {loadingTags ? "true" : "false" } */}
                { (loadingEvent || loadingTags )
                // { loadingEvent
                    ? <SkeletonEventDetails/>
                    : <>
                {eventDetails ?
                (
                    <>
                <p className="text-lg">{eventDetails.title}</p>
                <p className="text-base text-gray-500">{formatDate(eventDetails.start_datetime)} - {formatDate(eventDetails.end_datetime)}</p>
                <p className="text-base text-gray-500">{eventDetails.location}</p>
                {eventDetails.org && (<p className="text-base text-gray-500">Hosted by {eventDetails.org}</p>)}
                <p className="text-base text-gray-500 py-4">{eventDetails.description || "No additional details available."}</p>
                <div className="flex gap-4">
                <button 
                className={`px-4 py-2 rounded-md ${ isAdmin ? "flex-1" : "w-full"} ${
                    // eventDetails.user_saved ? "bg-blue-300" : "bg-blue-500"
                    savedEventIds.has(eventDetails.id) ? "bg-blue-300" : "bg-blue-500"
                } text-white`}
                    // onClick={() => {toggleAdded(eventDetails.id); onClose()}}>
                    onClick={() => {toggleAdded(eventDetails); onClose()}}>
                   { savedEventIds.has(eventDetails.id) ? "Remove" : "Add" }
                </button> 
                <button className={`px-4 py-2 rounded-md ${ isAdmin ? "flex-1" : "hidden"}  bg-gray-200`}
                    onClick={() => { openUpdate(eventDetails, selectedTags, recurrenceRule, repeat ) }}>
                    Edit Event
                </button></div>
                </>) :
                <>Invalid event.</>}</>}
            </div>
        </Modal>
    )
}
