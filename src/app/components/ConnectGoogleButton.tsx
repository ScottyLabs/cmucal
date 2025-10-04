// components/ConnectGoogleButton.tsx
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { useGcalEvents } from "../../context/GCalEventsContext";
import { formatGCalEvent } from "../utils/calendarUtils";
import { CalendarFields } from "../utils/types";
import { checkGoogleAuthStatus, fetchBulkEventsFromCalendars } from "../utils/api/googleCalendar";
import { API_BASE_URL } from "../utils/api/api";


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

export function ConnectGoogleButton() {
  // https://mui.com/material-ui/react-select/
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [availableCalendars, setAvailableCalendars] = useState<any[]>([]); // full objects with id & summary
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]); // selected calendar IDs from dropdown
  const { gcalEvents, setGcalEvents } = useGcalEvents();
  const [cmuCalIds, setCMUCalIds] = useState<string[]>([]);

  useEffect(() => {
    // Only runs on mount
    const checkAuthStatus = async () => {
      try {
        // const res = await fetch("http://localhost:5001/api/google/calendar/status", {
        //   credentials: "include",
        // });
        const { authorized } = await checkGoogleAuthStatus();

        setIsConnected(authorized);

        if (authorized && availableCalendars.length === 0) {
          await fetchCalendars();
        }
        
      } catch (err) {
        console.error("Error checking Google auth status:", err);
      } finally {
        setLoading(false);
      }
    };
    // if (!userLoaded || !isSignedIn || !user) return;
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


  const handleChange = (event: SelectChangeEvent<typeof selectedCalendarIds>) => {
    const {
      target: { value },
    } = event;
    setSelectedCalendarIds(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const getGoogleConnectionStatus = () => 
    loading ? "Checking..." : isConnected ? "Display GCal Events" : "Connect Google Calendar";
  


  const authorizeGoogle = async () => {
    const redirectUrl = window.location.href;
    window.location.href = `${API_BASE_URL}/google/authorize?redirect=${redirectUrl}`;
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
  <div>
  <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
    <Select
      id="calendar-select"
      multiple
      value={selectedCalendarIds}
      onOpen={handleSelectOpen}
      onChange={handleChange}
      input={<OutlinedInput />}
      renderValue={(selected) => getGoogleConnectionStatus()}
      // was selected.join(', ')
      displayEmpty
      MenuProps={MenuProps}
      inputProps={{ 'aria-label': 'Without label' }}
      sx={{
        border: "1px solid #f1f1f1",
        '&:focus': {
          border: "1px solid #f1f1f1",
        },
        '& .MuiSelect-icon': {
          display: "none", // hide dropdown arrow
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: "1px solid #f1f1f1",
        },
        '&.Mui-focused': {
          boxShadow: "none", // remove focus ring
          border: "1px solid #f1f1f1"
        }
      }}
    >
      {availableCalendars.map((cal) => (
        <MenuItem
          key={cal.id}
          value={cal.id}
          sx={{
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Checkbox checked={selectedCalendarIds.includes(cal.id)} />
          <ListItemText
            primary={
              <div className="overflow-x-scroll whitespace-nowrap text-sm">
                {cal.summary}
              </div>
            }
          />
        </MenuItem>
      ))}

    </Select>
  </FormControl>
</div>

  );
}
