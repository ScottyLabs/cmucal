"use client";


import { Event } from "../types";
import { formatDateRange } from "../utils/formatters";
import { FiEdit } from "react-icons/fi";
import { MdOutlinePlace, MdOutlineAccessTime, MdOutlineSchool, MdOutlinePeople } from "react-icons/md";


interface EventCardProps {
  event: Event;
}


/**
 * EventCard - Displays details about an event
 */
const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-white border rounded-lg shadow-sm mb-4 overflow-hidden dark:bg-gray-600 dark:text-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{event.resource_type}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {event.course_id}
          </span>
        </div>


        <h4 className="font-medium text-base mb-3">{event.course_name}</h4>


        <div className="space-y-2 mb-3">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <MdOutlineAccessTime className="mr-2" size={16} />
            <span className="text-sm">
              {formatDateRange(event.start_datetime, event.end_datetime)}
            </span>
          </div>


          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <MdOutlinePlace className="mr-2" size={16} />
            <span className="text-sm">{event.location}</span>
          </div>


          {event.instructor && (
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <MdOutlinePeople className="mr-2" size={16} />
              <span className="text-sm">{event.instructor}</span>
            </div>
          )}


          {event.professor && (
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <MdOutlineSchool className="mr-2" size={16} />
              <span className="text-sm">{event.professor}</span>
            </div>
          )}
        </div>


        <div className="text-xs text-gray-500 mt-3 flex justify-between items-center">
          <span>Source: {event.resource_source}</span>
          <button className="text-blue-600 flex items-center dark:text-blue-300">
            <FiEdit size={14} className="mr-1" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
};


export default EventCard; 