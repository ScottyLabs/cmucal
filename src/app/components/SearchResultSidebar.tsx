"use client";
import { formatDate } from "~/app/utils/dateService";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { FiSearch } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


import { EventClickArg } from "@fullcalendar/core"; 
import { EventType } from "../types/EventType";
import { useEventState } from "../../context/EventStateContext";

import React from 'react'
import Select from 'react-select'
import { fetchAllTags } from "../utils/api/events";
import { API_BASE_URL, api } from "../utils/api/api";


type Props = {
  events: EventType[];
  setEvents: (events: EventType[]) => void;
  toggleAdded: (event: EventType) => void;
};

type OptionType = {
  value: number;
  label: string;
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);

    // Cancel the timeout if value changes or component unmounts
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}


function SkeletonEventCard() { 
  return (
    <div className="animate-pulse p-4 border rounded-lg mb-2 bg-white space-y-3">
      <p className="text-sm text-gray-400">EVENT</p>
      {/* <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div> */}      
      <p className="h-5 bg-gray-200 rounded w-1/2"></p> 
      <p className="h-4 bg-gray-200 rounded w-3/4"></p>
      <p className="h-4 bg-gray-200 rounded w-2/5"></p>
      <div className="flex">
      <p className="h-6 bg-gray-200 rounded w-1/5 mr-2"></p>
      <p className="h-6 bg-gray-200 rounded w-1/5"></p></div>      
    </div>
  );
}

export default function SearchResultsSidebar({ events, setEvents }: Props) {
  const { user } = useUser();
  const [allTags, setAllTags] = useState<{id: number; name: string}[]>([]);
  const [selectedTags, setSelectedTags] = useState<OptionType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400); // 400ms debounce
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const { openDetails, toggleAdded, savedEventIds } = useEventState();
  const [loading, setLoading] = useState(false);

  // fetch tags and convert to Select options
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await fetchAllTags();
        setAllTags(data)
        console.log("Fetched tags:", data);
      } catch (err) {
        console.error("Failed to fetch tags", err)
      }
    };
    fetchTags();
  }, []);
  const tagOptions = allTags.map(tag => ({
    value: tag.id,
    label: tag.name,
  }));

  // fetch sidebar events conditioned on filters (search term, tags, start date)
  useEffect(() => {
    const selectedTagIds = selectedTags.map((tag) => tag.value).join(",");
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/events/`, {
          headers: { "Clerk-User-Id": user?.id },
          params: {
            term: debouncedSearchTerm,
            tags: selectedTagIds,
            date: selectedDate,
          },
          withCredentials: true,      
        })
        setFilteredEvents(res.data);
      } catch (err) {
        console.error("Failed to filter events by condition", err)
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [debouncedSearchTerm, selectedTags, selectedDate])
  
  return (
    <div>
      {/* Search Bar */}
      <div className="relative flex items-center w-full max-w-md my-3">
        <FiSearch className="absolute left-3 text-gray-500 dark:text-gray-300" size={16} />
        <input
          type="text"
          placeholder="Search for a schedule or event..."
          className="w-full p-2 pl-10 border rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-center mb-4 text-gray-300">
      <Select className="rounded mb-3 min-w-[200px]"
        isMulti 
        options={tagOptions} 
        placeholder="Tags"
        value={selectedTags}
        onChange={(selectedOptions) => setSelectedTags(selectedOptions as OptionType[])}/>
        
      <DatePicker className="rounded mb-3 p-2 border text-gray-300"
        selected={selectedDate} 
        onChange={(date) => setSelectedDate(date)} 
        placeholderText="Date"
        isClearable />
        </div>

      {/* event cards */}
      <div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonEventCard key={i} />)
          : 
        
      
      <ul className="space-y-3">
        {filteredEvents.length === 0 && (
          <li className="p-3 rounded text-gray-500 italic">
            No matching events found.
          </li>
        )}
        {filteredEvents.map((event) => (
          <li key={event.id} className="p-3 rounded border">
            <p className="text-sm text-gray-400">EVENT</p>
            <p className="text-lg">{event.title}</p>
            <p className="text-base text-gray-500">{formatDate(event.start_datetime)} - {formatDate(event.end_datetime)}</p>
            <p className="text-base text-gray-500">{event.location}</p>
            <button
              // onClick={() => toggleAdded(event.id)}
              onClick={() => toggleAdded(event)}
              className={`mt-2 px-3 py-1.5 rounded-lg ${
                savedEventIds.has(event.id) ? "bg-blue-300" : "bg-blue-500"//event.user_saved
              } text-white`}
            >
              {savedEventIds.has(event.id) ? "Remove" : "Add"}
            </button>
            <button
              onClick={() => openDetails(event.id)}
              className="mt-2 mx-2 px-3 py-1.5 rounded-lg bg-gray-200">
              Learn more
            </button>
          </li>
        ))}
      </ul>}
      </div>

      
    </div>
  );
}
