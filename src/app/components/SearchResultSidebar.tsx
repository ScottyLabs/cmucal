"use client";
import { formatDate } from "~/app/utils/dateService";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { useUser } from "~/context/UserContext";
import { FiSearch } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from "next-themes";

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

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
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
  const { user } = useClerkUser();
  const { allEvents: globalEvents, eventsLoading: globalEventsLoading, refetchEvents } = useUser();
  const { theme } = useTheme();
  const [allTags, setAllTags] = useState<{id: number; name: string}[]>([]);
  const [selectedTags, setSelectedTags] = useState<OptionType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredByTags, setFilteredByTags] = useState<EventType[]>(globalEvents);
  const { openDetails, toggleAdded, savedEventIds } = useEventState();
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 20;

  // Update filtered events when global events change
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredByTags(globalEvents);
    }
  }, [globalEvents, selectedTags.length]);

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsData = await fetchAllTags();
        setAllTags(tagsData);
      } catch (err) {
        console.error("Failed to fetch tags", err);
      }
    };
    if (user?.id) {
      void fetchTags();
    }
  }, [user?.id]);

  // Refetch events when tags change
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredByTags(globalEvents);
      return;
    }
    
    const selectedTagIds = selectedTags.map((tag) => tag.value).join(",");
    const fetchEvents = async () => {
      try {
        const res = await api.get(`/events/`, {
          headers: { "Clerk-User-Id": user?.id },
          params: {
            term: '',
            tags: selectedTagIds,
            date: '',
          },
          withCredentials: true,
        });
        setFilteredByTags(res.data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };
    if (user?.id) {
      void fetchEvents();
    }
  }, [selectedTags, user?.id, globalEvents]);
  const tagOptions = allTags.map(tag => ({
    value: tag.id,
    label: tag.name,
  }));

  // Client-side filtering for search term and date (optimized)
  const filteredEvents = useMemo(() => {
    let filtered = filteredByTags;
    
    // Filter by date first (fastest check)
    if (selectedDate) {
      const filterDate = selectedDate.toDateString();
      filtered = filtered.filter(event => 
        new Date(event.start_datetime).toDateString() === filterDate
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(event => {
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description?.toLowerCase().includes(searchLower) ?? false;
        const matchesLocation = event.location?.toLowerCase().includes(searchLower);
        return matchesTitle || matchesDescription || matchesLocation;
      });
    }
    
    return filtered;
  }, [filteredByTags, searchTerm, selectedDate]);

  // Paginate filtered events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage, EVENTS_PER_PAGE]);

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, selectedTags]);
  
  return (
    <div className="px-8 py-3">
      {/* Search Bar */}
      <div className="relative flex items-center w-full max-w-md my-3">
        <FiSearch className="absolute left-3 text-gray-500 dark:text-gray-300" size={16} />
        <input
          type="text"
          placeholder="Search for a schedule or event..."
          className="w-full h-10 px-4 pl-10 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* filter bar */}
      <div className="flex items-center gap-2 mb-4 w-full max-w-md">
        <div className="flex-1">
          <Select
            isMulti 
            options={tagOptions} 
            placeholder="Tags"
            value={selectedTags}
            onChange={(selectedOptions) => setSelectedTags(selectedOptions as OptionType[])}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '40px',
                height: '40px',
                borderRadius: '8px',
                border: theme === 'dark' ? '1px solid #4D5461' : '1px solid #D1D5DB',
                backgroundColor: theme === 'dark' ? '#374151' : 'white',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#4b5563' : '#f9fafb',
                },
              }),
              valueContainer: (base) => ({
                ...base,
                height: '40px',
                padding: '0 8px',
              }),
              input: (base) => ({
                ...base,
                margin: '0px',
                color: theme === 'dark' ? '#ffffff' : '#1f2937',
              }),
              indicatorsContainer: (base) => ({
                ...base,
                height: '40px',
              }),
              placeholder: (base) => ({
                ...base,
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              }),
              singleValue: (base) => ({
                ...base,
                color: theme === 'dark' ? '#ffffff' : '#1f2937',
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: theme === 'dark' ? '#ffffff' : '#1f2937',
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? '#6b7280' : '#d1d5db',
                  color: theme === 'dark' ? '#ffffff' : '#1f2937',
                },
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: theme === 'dark' ? '#374151' : 'white',
                border: theme === 'dark' ? '1px solid #4D5461' : '1px solid #D1D5DB',
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused 
                  ? (theme === 'dark' ? '#4b5563' : '#f5f5f5')
                  : (theme === 'dark' ? '#374151' : 'white'),
                color: theme === 'dark' ? '#ffffff' : '#1f2937',
                '&:active': {
                  backgroundColor: theme === 'dark' ? '#6b7280' : '#e5e7eb',
                },
              }),
            }}
          />
        </div>
        <div className="flex-1">
        <div className="[&_.react-datepicker-wrapper]:block [&_.react-datepicker-wrapper]:w-full [&_.react-datepicker__input-container]:block [&_.react-datepicker__input-container]:w-full w-full">
            
          <DatePicker
            className="w-full h-10 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400"
            selected={selectedDate} 
            onChange={(date) => setSelectedDate(date)} 
            placeholderText="Date"
            isClearable
          />
          </div>
        </div>
      </div>

      {/* event cards */}
      <div>
        {globalEventsLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonEventCard key={i} />)
          : 
        
      
      <ul className="space-y-3">
        {filteredEvents.length === 0 && (
          <li className="p-3 rounded text-gray-500 italic">
            No matching events found.
          </li>
        )}
        {paginatedEvents.map((event) => (
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
              className="mt-2 mx-2 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
              Learn more
            </button>
          </li>
        ))}
      </ul>}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({filteredEvents.length} events)
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
