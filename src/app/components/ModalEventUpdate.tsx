import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import ModalEventForm from './ModalEventForm'
import { useEventState } from "../../context/EventStateContext";
import { EventType } from '../types/EventType';
import { useUser } from '@clerk/nextjs';
import { formatRecurrence, toDBRecurrenceEnds, toRRuleFrequency, getNthDayOfWeekInMonth, isLastWeekdayInMonth } from "../utils/dateService";


import { TextField, Autocomplete, Chip, FormControl, InputLabel, Select, MenuItem, Box, Typography, FormControlLabel, Checkbox } from '@mui/material';
import dayjs, { Dayjs } from "dayjs";
import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import axios from 'axios';
import { fetchAllTags } from '../utils/api/events';
import { API_BASE_URL } from '../utils/api/api';

type Tag = { id?: string; name: string };

type ModalEventProps = {
    show: boolean;
    onClose: () => void;
    oldEventInfo: EventType;
    savedEventTags: Tag[];
}


export default function ModalEventUpdate({ show, onClose, oldEventInfo, savedEventTags }: ModalEventProps) {
    const { user } = useUser();
    const { selectedEvent, openDetails, closeModal } = useEventState();
    // const [currentCategory, setCurrentCategory] = useState(null);
    // const [oldEventInfo, setCurrentInfo] = useState();
    console.log("show update modal!!", show, oldEventInfo)

    // const eventId = selectedEvent;
    const [title, setTitle] = useState(oldEventInfo?.title || "");
    const [titleError, setTitleError] = useState(false);
    const [location, setLocation] = useState(oldEventInfo?.location || "");
    const [locationError, setLocationError] = useState(false);
    const [selectedTags, setSelectedTags] = useState<Tag[]>(savedEventTags || []);
    const [predefinedTags, setPredefinedTags] = useState<Tag[]>([]);
    const [sourceURL, setSourceURL] = useState(oldEventInfo?.source_url || "");
    const [sourceURLError, setSourceURLError] = useState(false);
    const [description, setDescription] = useState(oldEventInfo?.description || "");

    const [date, setDate] = useState<Dayjs | null>(null);
    const [startTime, setStartTime] = useState<Dayjs | null>(null);
    const [endTime, setEndTime] = useState<Dayjs | null>(null);
    const [allDay, setAllDay] = useState(false);
    const [repeat, setRepeat] = useState("none");

    // recurrence settings
    const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
    const [customRecurrenceSummary, setCustomRecurrenceSummary] = useState<string | null>(null);

    // by default timezone is set to the user's current local time zone as detected by the browser.
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const timezones = Intl.supportedValuesOf?.('timeZone') || [
        "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
        "UTC", "Europe/London", "Asia/Tokyo", "Asia/Qatar"
    ];

    const [interval, setInterval] = useState(1);
    const [frequency, setFrequency] = useState("WEEKLY"); // default to weekly
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // M-F
    const [nthWeek, setNthWeek] = useState<number | null>(null);
    const [ends, setEnds] = useState("never");
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [occurrences, setOccurrences] = useState<number>(13);

    const recurrenceOptions = useMemo(() => {
        if (!date) return [];
    
        const nth = getNthDayOfWeekInMonth(date);
        const nthSuffix = ['th', 'st', 'nd', 'rd'][((nth % 10 > 3) || (nth >= 11 && nth <= 13)) ? 0 : nth % 10];
    
        return [
          { value: "none", label: "Does not repeat" },
          { value: "daily", label: "Daily" },
          { value: "weekly", label: `Weekly on ${date.format('dddd')}` },
          {
            value: "monthly_nth",
            label: `Monthly on the ${nth}${nthSuffix} ${date.format('dddd')}`,
          },
          {
            value: "monthly_last",
            label: `Monthly on the last ${date.format('dddd')}`,
            hidden: !isLastWeekdayInMonth(date),
          },
          {
            value: "yearly",
            label: `Annually on ${date.format('MMMM D')}`,
          },
          { value: "weekdays", label: "Every weekday (Monday to Friday)" },
          {
            value: "custom",
            label: customRecurrenceSummary ? `Custom: ${customRecurrenceSummary}` : "Custom...",
          }
        ];
      }, [date, customRecurrenceSummary]);


    const [dateError, setDateError] = useState(false);
    const [startError, setStartError] = useState(false);
    const [endError, setEndError] = useState(false);
    
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const tags = await fetchAllTags(); // e.g. [{ id: "1", name: "computer science" }, ...]
                setPredefinedTags(
                    tags.map((tag: any) => ({
                        id: tag.id,
                        name: tag.name.toLowerCase(),
                    }))
                );
                console.log("fetched predefined tags for update form", tags)
            } catch (err) {
                console.error("Failed to fetch predefined tags", err);
            }
        };
        fetchTags();

        if (oldEventInfo?.start_datetime) {
            const start_datetime = dayjs(oldEventInfo.start_datetime);
            setDate(start_datetime); // DatePicker will only care about the calendar date
            setStartTime(start_datetime); // TimePicker will only care about hours/minutes
        }
        if (oldEventInfo?.end_datetime) {
            const end_datetime = dayjs(oldEventInfo.end_datetime);
            setEndTime(end_datetime);
        }
    }, [oldEventInfo])



    // if (!eventInfo || !currentCategory) return null;


    const reset = () => {
        setTitle(oldEventInfo.title || "");
        setLocation(oldEventInfo.location || "");
        setSelectedTags(savedEventTags || []);
        setSourceURL(oldEventInfo?.source_url || "");
        setDescription(oldEventInfo.description || "");

        const start_datetime = dayjs(oldEventInfo.start_datetime);
        setDate(start_datetime);
        setStartTime(start_datetime);
        const end_datetime = dayjs(oldEventInfo.end_datetime);
        setEndTime(end_datetime);
    }

    const validate = () => {
        // TODO
        return true;
    }

    const handleSubmit = async () => {
        console.log("👀submitting update form......")
        const isValid = validate();
        if (!isValid) {
            alert("Please fill in all required fields.");
            return;
        }
        
        if (!date || !startTime || !endTime) {
            console.error("Date or time is not selected");
            return;
        }
        const combinedStartDT = date
            .set('hour', startTime.hour())
            .set('minute', startTime.minute())
            .set('second', startTime.second())
        const combinedEndDT = date
            .set('hour', endTime.hour())
            .set('minute', endTime.minute())
            .set('second', endTime.second())


        const updatedEventData = {
          updated_event: {
            id: oldEventInfo.id,
            title: title,
            start_datetime: combinedStartDT.toISOString(),
            end_datetime: combinedEndDT.toISOString(),
            is_all_day: oldEventInfo.is_all_day, // TODO: needa edit
            location: location,
            org_id: oldEventInfo.org_id, // TODO: needa edit
            category_id: oldEventInfo.category_id, // TODO: needa edit
            source_url: sourceURL,
            description: description,
            user_is_admin: oldEventInfo.user_is_admin,
          },
          updated_tags: selectedTags,
          updated_recurrence: {

          },
          updated_child: {

          },
          update_scope: "all" // TODO: later will add an option to edit specific instances


        }
        try {
            // will need to update later to include in events.ts
            const res = await axios.patch(`${API_BASE_URL}/events/${oldEventInfo.id}`, 
                updatedEventData
            );
        } catch (err) {
            console.error("Error updating event: ", oldEventInfo.id, err);
        }
        openDetails(oldEventInfo.id, updatedEventData.updated_event)
        return;
    }




    return (
        // <ModalEventForm
        // show={show}
        // onClose={onClose}></ModalEventForm>
        <>
        <Modal show={show} onClose={onClose}>
            {!oldEventInfo ? (
            // {!eventInfo || !currentCategory ? (
            <div className="animate-pulse p-4 text-center text-gray-700">Loading...</div>
        ) : (
            <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-4">
                Updating event{/*  in {currentCategory.org} — {currentCategory.name} */}
            </h2>
            

            {/* Title */}
            <TextField
                label="Event Title"
                variant="standard"
                required
                fullWidth
                size="medium"
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError(false); // clear error on change
                }}
                error={titleError}
                helperText={titleError ? "Title is required" : ""}
            />


            {/* time zone */}
          <FormControl variant="standard" fullWidth >
            <InputLabel
              shrink={false}
              sx={{
                color: "blue",
                fontWeight: 500,
                fontSize: "0.875rem", // Small text (14px)
                '&.Mui-focused': { color: "grey" },
              }}
            >
              {timezone}
            </InputLabel>

            <Select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disableUnderline
              displayEmpty
              sx={{
                color: "blue",
                fontWeight: 500,
                fontSize: "0.875rem", // Small text (14px)
                "& .MuiSelect-icon": {
                  color: "grey",
                },
                "& fieldset": {
                  border: "none",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
              }}
              renderValue={(selected) => selected || "Timezone"}
            >
              {timezones.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </Select>
          </FormControl>


          {/* Date & Time */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box display="flex" alignItems="center" gap={2} mt={2}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newDate: Dayjs | null) => {
                  setDate(newDate);
                  setDateError(false);
                }}
                slotProps={{
                  textField: {
                    required: true,
                    error: dateError,
                    helperText: dateError ? "Date is required" : "",
                  },
                }}
              />

              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={(newTime: Dayjs | null) => {
                  setStartTime(newTime);
                  setStartError(false);
                }}
                disabled={allDay}
                slotProps={{
                  textField: {
                    required: !allDay,
                    error: startError,
                    helperText: startError ? "Start time is required" : "",
                  },
                }}
              />

              <Typography>-</Typography>

              <TimePicker
                label="End Time"
                value={endTime}
                onChange={(newTime: Dayjs | null) => {
                  setEndTime(newTime);
                  setEndError(false);
                }}
                disabled={allDay}
                slotProps={{
                  textField: {
                    required: !allDay,
                    error: endError,
                    helperText: endError ? "End time is required" : "",
                  },
                }}
              />
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                  />
                }
                label="All day"
              />

              {/* {selectedEventType == "Career" && 
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={requireRegistration}
                      onChange={(e) => setRequireRegistration(e.target.checked)}
                    />
                  }
                  label="Require registration"
                />
              } */}
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Repeats</InputLabel>
              <Select
                value={repeat}
                label="Repeats"
                
                onChange={(e) => {
                  const value = e.target.value;
                  setRepeat(value);
                  if (value === "custom") {
                    setShowCustomRecurrence(true); // <-- show modal when "Custom..." selected
                  }
                }}
                size="small"
              >
                {recurrenceOptions
                  .filter(option => !option.hidden)
                  .map(option => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      onClick={() => {
                        if (option.value === "custom" && repeat === "custom") {
                          setShowCustomRecurrence(true);
                        }
                      }}
                    >
                      {option.label}
                    </MenuItem>
                ))}

              </Select>

            </FormControl>
          </LocalizationProvider>


            {/* Location */}
            <TextField
                label="Location"
                variant="outlined"
                required
                fullWidth
                value={location}
                onChange={(e) => {
                    setLocation(e.target.value);
                    if (locationError) setLocationError(false); // clear error on change
                }}
                error={locationError}
                helperText={locationError ? "Location is required" : ""}
                size="small"
            />



            {/* Tags */}
            <Autocomplete
                multiple
                freeSolo
                options={predefinedTags}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                filterSelectedOptions
                isOptionEqualToValue={(option, value) => {
                    // Normalize to strings for comparison if no id
                    const optionName = typeof option === 'string' ? option : option.name;
                    const valueName = typeof value === 'string' ? value : value.name;
                    if (option.id && value.id) {
                        return option.id === value.id;
                    }
                    return optionName.toLowerCase() === valueName.toLowerCase();
                }}
                size="small"
                value={selectedTags}
                onChange={(event, newValue) => {
                const normalized = newValue.map((tag) =>
                    typeof tag === "string" ? { name: tag.toLowerCase() } : { ...tag, name: tag.name.toLowerCase() }
                );
                setSelectedTags(normalized);
                }}
                renderTags={(value, getTagProps) =>
                value.map((option: Tag, index: number) => {
                    const tagProps = getTagProps({ index });
                    const { key, ...rest } = tagProps;

                    return (
                    <Chip
                        key={key} // explicitly pass the key
                        label={option.name}
                        variant="outlined"
                        {...rest} // spread the remaining props
                    />
                    );
                })
                }
                renderInput={(params) => (
                <TextField
                    {...params}
                    variant="outlined"
                    label="Tags"
                    placeholder="Add or select a tag"
                />
                )}
                sx={{ mb: 2 }}
            />

            
            {/* Source URL */}
            <TextField
                label="Edit Source/Registration URL"
                variant="outlined"
                sx={{ mb: 2, mt: 2 }}
                // required={requireRegistration} // Only required for Career
                fullWidth
                size="small"
                value={sourceURL}
                onChange={(e) => {
                setSourceURL(e.target.value);
                if (sourceURLError) setSourceURLError(false);
                }}
                // error={requireRegistration && sourceURLError}
                helperText={
                // requireRegistration && 
                sourceURLError
                    ? "Source URL is required if registration is required"
                    : ""
                }
            />



            {/* Description */}
            <TextField
                label="Description"
                variant="outlined"
                fullWidth
                size="small"
                value={description}
                // sx={{ mb: 2 }}
                multiline
                maxRows={3}
                onChange={(e) => {
                    setDescription(e.target.value);
                }}
            />


            {/* Buttons */}
            <div className="flex justify-end gap-4">
                <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={() => openDetails(oldEventInfo.id, oldEventInfo)}
                >
                Return to details
                </button>

                <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={reset}
                >
                Reset to original
                </button>

                <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                type="button"
                onClick={() => {
                    console.log("clicked update submit button!");
                    handleSubmit();
                }}
                >
                Save Changes
                </button>
            </div>


        </div>
        )}
        </Modal></>
    )
    
}