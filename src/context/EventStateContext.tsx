import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { EventType } from "../app/types/EventType";
import { EventInput } from "@fullcalendar/core";
import { List } from "lucide-react";
import { RecurrenceInput } from "~/app/utils/types";

export type ModalView = "details" | "update" | "pre_upload" | "upload" | "uploadLink" | null;
type Tag = { id?: string; name: string };

type EventStateContextType = {
  selectedEvent: number|null;
  setSelectedEvent: (id: number|null) => void;
  modalView: ModalView;
  setModalView: (view: ModalView) => void;
  modalData: Record<string, any>;
  setModalData: (data: Record<string, any>) => void;
  savedEventIds: Set<number>;
  // toggleAdded: (eventId: number) => void;
  toggleAdded: (event: EventType) => void;
  calendarEvents: EventInput[];
  setCalendarEvents: (events: EventInput[]) => void;
};

export const EventStateContext = createContext<EventStateContextType | null>(null);

export const EventStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [selectedEvent, setSelectedEvent] = useState<number|null>(null);
  const [modalView, setModalView] = useState<ModalView>(null);
  const [modalData, setModalData] = useState<Record<string, any>>({});
  // const [savedEventIds, setSavedEventIds] = useState<number[]>([]);
  const [savedEventIds, setSavedEventIds] = useState(new Set<number>());
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([]); 

  // console.log("😮Fetching saved events for user:", user?.id);

  // fetch saved events IDs on login
  useEffect(() => {
    if (!user?.id) return; // prevents requesting with invalid user ID
    async function fetchSaved() {
      try {
        console.log("😮Fetching saved events for user:", user?.id);
        const response = await axios.get("http://localhost:5001/api/events/user_saved_events", {
          params: {
            user_id: user?.id,
          },
          withCredentials: true,
        });
        setSavedEventIds(new Set(response.data));
        console.log("😄Saved Event IDs: ", response.data)
      } catch (err) {
        console.error("😔Error loading saved events", err);
      }
    }
    fetchSaved();
  }, [user?.id]);


  const toggleAdded = async (event_occurrence: EventType) => {
      // const updatedEvents = [...event_occurrences];
      // const index = updatedEvents.findIndex((e) => e.id === thisId);
      // const event_occurrence = updatedEvents[index];

    if (!event_occurrence) return;
    const isCurrentlySaved = savedEventIds.has(event_occurrence.id)

    console.log("👀toggling event_occurrence, ", savedEventIds.has(event_occurrence.id), event_occurrence);

    // 1. Toggle locally - update attribute
    // event_occurrence.user_saved = !event_occurrence.user_saved;
    // setEvents(updatedEvents);
    if (isCurrentlySaved) {
      // Remove the event_occurrence from the saved IDs Set
      setSavedEventIds(prevSet => {
        const newSet = new Set(prevSet);
        newSet.delete(event_occurrence.id)
        return newSet
      })
      console.log("(remove) updated saved ids: ", savedEventIds)
    } else {
      // Add the event_occurrence to saved Ids Set
      setSavedEventIds(prevSet => new Set(prevSet).add(event_occurrence.id))
      console.log("(add) updated saved ids: ", savedEventIds)
    }
    
    console.log("❓❓❓id in saved set? ", savedEventIds.has(event_occurrence.id))

    // // 2. Update the User_saved_events table in database
    // try {
    //   if (!isCurrentlySaved) {
    //     // Add the event to current user's calendar
    //     await axios.post("http://localhost:5001/api/events/user_saved_events", {
    //       user_id: user?.id,
    //       event_occurrence_id: event_occurrence.id,
    //       google_event_id: event_occurrence.id, // [Q|TODO] is google event id needed in this table
    //     }, {
    //       withCredentials: true,
    //     }); 
    //   } else {
    //     // Remove the event from current user's calendar
    //     await axios.delete(`http://localhost:5001/api/events/user_saved_events/${event_occurrence.id}`, {
    //       data: {
    //       user_id: user?.id,
    //       google_event_id: event_occurrence.id, // [Q|TODO] is google event id needed in this table
    //     },
    //       withCredentials: true,
    //     });
    //   }
    // } catch (err) {
    //   console.error("Error saving / unsaving the event to user_saved_events, ", err);
    // }

    // 3. Update calendar view
    // fetchCalendarEvents();

    // 4. Sync with Google Calendar
    try {
      if (!isCurrentlySaved) {
        console.log("adding event to gcallll")
        // Add to Google Calendar via backend
        await axios.post("http://localhost:5001/api/google/calendar/events/add", {
          user_id: user?.id,
          local_event_id: event_occurrence.id,
          title: event_occurrence.title,
          start: event_occurrence.start_datetime,
          end: event_occurrence.end_datetime,
        }, {
          withCredentials: true,
        });        
      } else {
        // Remove from Google Calendar via backend
        await axios.delete(`http://localhost:5001/api/google/calendar/events/${event_occurrence.id}`, {
          data: {
            user_id: user?.id,
          },
          withCredentials: true,
        });
        
      }
    } catch (err) {
      console.error("Error syncing with Google Calendar:", err);
    }
  };



  return (
    <EventStateContext.Provider value={{ 
        selectedEvent, setSelectedEvent, 
        modalView, setModalView, 
        modalData, setModalData, 
        savedEventIds, 
        toggleAdded,
        calendarEvents, setCalendarEvents 
      }}>
        {children}
      </EventStateContext.Provider>
  )
}


export const useEventState = () => {
  const context = useContext(EventStateContext);
  if (!context) {
    throw new Error("useEventState must be used within a EventStateContext.Provider");
  }

  const openDetails = (event_occurrence_id: number, event_id?: number, savedEventDetails?: EventType, googleFields?: EventType) => {
    context.setSelectedEvent(event_occurrence_id);
    context.setModalData({
      "savedEventDetails": savedEventDetails, 
      "event_id": event_id, 
      "googleFields": googleFields})
    context.setModalView("details");
  };
  const openUpdate = (eventInfo: EventType, selectedTags: Tag[], recurrenceRule: RecurrenceInput, oldRepeat: string) => {
    // context.setSelectedEvent(event_id);// no need since always routed from the details modal
    context.setModalData({"eventInfo": eventInfo, "selectedTags": selectedTags, 
      "recurrenceRule": recurrenceRule, "oldRepeat": oldRepeat})
    console.log("opening update.... setting modal data", eventInfo)
    context.setModalView("update");
  };
  const openPreUpload = () => {
    context.setSelectedEvent(null);
    context.setModalView("pre_upload");
  }
  const openUploadLink = (selectedCategory: any) => {
    // context.setSelectedEvent(null); // no need since always routed from pre-upload
    context.setModalData({"selectedCategory": selectedCategory})
    // need to add modalData
    context.setModalView("uploadLink");
  };
  const openUpload = (selectedCategory: any, eventType: any) => {
    // context.setSelectedEvent(null); // no need since always routed from pre-upload
    context.setModalData({"selectedCategory": selectedCategory, "eventType": eventType})
    context.setModalView("upload");
  };
  
  const closeModal = () => {
    context.setSelectedEvent(null);
    context.setModalView(null);
  };
  


  return {
    selectedEvent: context.selectedEvent,
    modalView: context.modalView,
    modalData: context.modalData,
    savedEventIds: context.savedEventIds,
    toggleAdded: context.toggleAdded,
    calendarEvents: context.calendarEvents,        
    setCalendarEvents: context.setCalendarEvents,  
    openDetails,
    openUpdate,
    openPreUpload,
    openUpload,
    openUploadLink,
    closeModal
  }
};