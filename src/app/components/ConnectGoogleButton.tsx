// components/ConnectGoogleButton.tsx
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import * as React from 'react';
import { useGcalEvents } from "../../context/GCalEventsContext";
import { formatGCalEvent } from "../utils/calendarUtils";
import { CalendarFields } from "../utils/types";
import { checkGoogleAuthStatus, ensureCalendarExists, fetchBulkEventsFromCalendars, unauthorizeGoogle } from "../utils/api/googleCalendar";
import { API_BASE_URL } from "../utils/api/api";
import Modal from "./Modal";


const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

type ConnectGoogleButtonProps = {
  clerkId: string;
};

export function ConnectGoogleButton({clerkId}: ConnectGoogleButtonProps) {
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
          await fetchCalendars(clerkId);
        }
      } catch (err) {
        console.error("Error checking Google auth status:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);


  function handleSelectOpen() {
    if (!loading && !isConnected) {

      authorizeGoogle();
    }
  }

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

  const fetchCalendars = async (clerkId: string) => {
    // need to change this to using the api client later
    const res = await fetch(`${API_BASE_URL}/google/calendars`, {
      method: "GET", // optional but recommended for clarity
      credentials: "include",
    });

  
    if (res.status === 401) {
      // should add a screen to give them more information and ask if 
      // the user wants to connect their Google account
      window.location.href = `${API_BASE_URL}/google/authorize`;
      return;
    }

    // Ensure CMUCal exists in user's Google Calendars. If not, create it.
    // console.log("Ensuring CMUCal exists...", clerkId);
    await ensureCalendarExists(clerkId || "");
  
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
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-4">
            <img src="/newLogo.png" alt="CMUCal Logo" className="w-16 h-16 object-contain" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Welcome to CMUCal!</h2>
          
          {/* Description */}
          <p className="text-base text-gray-600 dark:text-gray-300 mb-6 max-w-md">
            Connect your Google Calendar to sync your existing schedules and events.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <button
              className="w-full py-3 bg-blue-500 text-white text-base font-semibold rounded-full hover:bg-blue-600 transition-colors"
              onClick={() => {
                setShowWelcomeModal(false);
                authorizeGoogle();
              }}
            >
              Connect Google Calendar
            </button>
            <button
              className="w-full py-3 bg-transparent text-gray-700 dark:text-gray-300 text-base font-semibold rounded-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setShowWelcomeModal(false)}
            >
              Skip for now
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Summary Modal for just connected users */}
      <Modal show={showImportSummary} onClose={() => setShowImportSummary(false)}>
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Calendars synced successfully!</h2>
          
          {/* Description */}
          <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
            Your Google Calendar has been connected.
          </p>

          {/* Imported Calendars Section */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Imported calendars</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">{availableCalendars.length} total</span>
            </div>
            
            {/* Calendar List */}
            <div className="space-y-2">
              {availableCalendars.map((cal) => (
                <div
                  key={cal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base font-medium text-gray-900 dark:text-white">{cal.summary}</span>
                  </div>
                  <div className="flex gap-2">
                    {cal.primary && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        Primary
                      </span>
                    )}
                    {cal.accessRole === "owner" && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <button
            className="w-full py-3 bg-blue-500 text-white text-base font-semibold rounded-full hover:bg-blue-600 transition-colors"
            onClick={() => setShowImportSummary(false)}
          >
            Continue to Dashboard
          </button>
        </div>
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
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
