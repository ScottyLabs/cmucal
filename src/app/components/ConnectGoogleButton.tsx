// components/ConnectGoogleButton.tsx
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import * as React from 'react';
import { useGcalEvents } from "../../context/GCalEventsContext";
import { formatGCalEvent } from "../utils/calendarUtils";
import { CalendarFields } from "../utils/types";
import { checkGoogleAuthStatus, fetchBulkEventsFromCalendars, unauthorizeGoogle } from "../utils/api/googleCalendar";
import { API_BASE_URL } from "../utils/api/api";
import Modal from "./Modal";



export function ConnectGoogleButton() {
  // https://mui.com/material-ui/react-select/
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [availableCalendars, setAvailableCalendars] = useState<any[]>([]); // full objects with id & summary
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]); // selected calendar IDs from dropdown
  const { gcalEvents, setGcalEvents } = useGcalEvents();
  const [cmuCalIds, setCMUCalIds] = useState<string[]>([]);
  const [showImportSummary, setShowImportSummary] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);

  useEffect(() => {
    // Only runs on mount

    // url params
    const url = new URL(window.location.href);
    const justConnected = url.searchParams.get('justConnected');
    const welcome = url.searchParams.get('welcome');

    const checkAuthStatus = async () => {
      try {
        const { authorized } = await checkGoogleAuthStatus();
        setIsConnected(authorized);

        // Show import summary modal if just connected
        if (justConnected) {
          if (authorized) {
            setShowImportSummary(true);
          }
          url.searchParams.delete('justConnected');
          window.history.replaceState({}, '', url.toString());
        }

        // Show welcome modal if welcome param is present and not connected
        if (welcome) {
          if (!authorized) {
            setShowWelcomeModal(true);
          }
          url.searchParams.delete('welcome');
          window.history.replaceState({}, '', url.toString());
        }

        if (authorized && availableCalendars.length === 0) {
          await fetchCalendars();
        }
      } catch (err) {
        console.error("Error checking Google auth status:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);



  useEffect(() => {
    console.log("Selected calendar IDs:", selectedCalendarIds);
    if (selectedCalendarIds.length > 0) {
      fetchEventsFromCalendars(selectedCalendarIds);
    } else {
      setGcalEvents([]);
    }
  }, [selectedCalendarIds]);

  const fetchEventsFromCalendars = async (calendarIds: string[]) => {
    // const res = await fetch("http://localhost:5001/api/google/calendar/events/bulk", {
    //   method: "POST",
    //   credentials: "include",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ calendarIds }),
    // });
    const data = await fetchBulkEventsFromCalendars(calendarIds);

    const formattedGCalEvents = data.map((event: any) => (formatGCalEvent(event, cmuCalIds)));

    setGcalEvents(formattedGCalEvents);
    // console.log("Fetched events:", data);
  };


  


  const authorizeGoogle = () => {
    // Add ?justConnected=true to the redirect URL so backend can append it after OAuth
    const redirectUrl = window.location.origin + window.location.pathname + '?justConnected=true';
    window.location.href = `${API_BASE_URL}/google/authorize?redirect=${encodeURIComponent(redirectUrl)}`;
  }

  const handleUnauthorizeGoogle = async () => {
    try {
      await unauthorizeGoogle();
      // Reset all state after unauthorizing
      setShowCalendarSelector(false)
      setIsConnected(false);
      setAvailableCalendars([]);
      setSelectedCalendarIds([]);
      setGcalEvents([]);
      setCMUCalIds([]);
    } catch (error) {
      console.error("Error unauthorizing Google Calendar:", error);
      // You might want to show a toast or error message to the user
    }
  }

  const fetchCalendars = async () => {
    // need to change this to using the api client later
    const res = await fetch(`${API_BASE_URL}/google/calendars`, {
      credentials: "include",
    });
  
    if (res.status === 401) {
      // should add a screen to give them more information and ask if 
      // the user wants to connect their Google account
      window.location.href = `${API_BASE_URL}/google/authorize`;
      return;
    }
  
    const data : CalendarFields[] = await res.json();
  
    // Sort order:
    // 1. CMUCal (events added from our website)
    // 2. primary calendar
    // 3. owned calendars (not primary)
    // 4. shared calendars
    const sorted = data.sort((a: CalendarFields, b: CalendarFields) => {
      const priority = (cal: CalendarFields) => {
        if (cal.summary === "CMUCal") return 0;
        if (cal.primary) return 1;
        if (cal.accessRole === "owner") return 2;
        return 3;
      };
      return priority(a) - priority(b);
    });

    // Save the sorted calendars (or just summary list if you prefer)
    // setAvailableCalendars(sorted.map((cal: any) => cal.summary));
    setAvailableCalendars(sorted);
    const defaultSelectedIds = data
          .filter(cal => cal.summary === "CMUCal")
          .map(cal => cal.id);
    setSelectedCalendarIds(defaultSelectedIds);
    setCMUCalIds(defaultSelectedIds);
  };
  

  return (
    <>
      {/* Welcome Modal for brand new users */}
      <Modal show={showWelcomeModal} onClose={() => setShowWelcomeModal(false)}>
        <h2 className="text-lg font-semibold mb-2">Welcome to CMUCal!</h2>
        <p className="mb-4">Connect your Google Calendar to get started.</p>
        <div className="flex gap-4 mt-6">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              setShowWelcomeModal(false);
              authorizeGoogle();
            }}
          >
            Connect Google Calendar
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => setShowWelcomeModal(false)}
          >
            Do it later
          </button>
        </div>
      </Modal>

      {/* Import Summary Modal for just connected users */}
      <Modal show={showImportSummary} onClose={() => setShowImportSummary(false)}>
        <h2 className="text-lg font-semibold mb-2">Here's what you're importing</h2>
        <div className="mb-4">
          <h3 className="font-medium">Imported Calendars:</h3>
          <ul className="list-disc ml-6">
            {availableCalendars.map((cal) => (
              <li key={cal.id} className="mb-1">
                <span className="font-semibold">{cal.summary}</span>
                {cal.primary && <span className="ml-2 text-xs text-blue-600">(Primary)</span>}
                {cal.accessRole === "owner" && <span className="ml-2 text-xs text-green-600">(Owner)</span>}
              </li>
            ))}
          </ul>
        </div>
        <button
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowImportSummary(false)}
        >
          Continue
        </button>
      </Modal>

      {/* Calendar Selector Modal */}
      <Modal show={showCalendarSelector} onClose={() => setShowCalendarSelector(false)}>
        <h2 className="text-lg font-semibold mb-4">Select Calendars to Display</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableCalendars.map((cal) => (
            <label
              key={cal.id}
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCalendarIds.includes(cal.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCalendarIds([...selectedCalendarIds, cal.id]);
                  } else {
                    setSelectedCalendarIds(selectedCalendarIds.filter(id => id !== cal.id));
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium">{cal.summary}</span>
                {cal.primary && <span className="ml-2 text-xs text-blue-600">(Primary)</span>}
                {cal.accessRole === "owner" && !cal.primary && <span className="ml-2 text-xs text-green-600">(Owner)</span>}
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={handleUnauthorizeGoogle}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
          >
            Disconnect Google
          </button>
          <button
            onClick={() => setShowCalendarSelector(false)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Main Connect/Manage Button */}
      <button
        onClick={() => {
          if (!loading && !isConnected) {
            authorizeGoogle();
          } else if (isConnected) {
            setShowCalendarSelector(true);
          }
        }}
        disabled={loading}
        className='h-10 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {loading ? "Checking..." : isConnected ? "Manage Calendars" : "Connect Google Calendar"}
      </button>
    </>
  );
}
