import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { DBRecurrenceEnds, RRuleFrequency } from "../utils/types";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

interface CustomRecurrenceModalProps {
  open: boolean;
  onClose: () => void;

  interval: number;
  setInterval: (val: number) => void;

  setFrequency: React.Dispatch<React.SetStateAction<RRuleFrequency>>;
  frequency: RRuleFrequency;

  selectedDays: number[];
  toggleDay: (index: number) => void;

  ends: DBRecurrenceEnds;
  setEnds: React.Dispatch<React.SetStateAction<DBRecurrenceEnds>>;

  endDate: Dayjs | null;
  setEndDate: (val: Dayjs | null) => void;

  occurrences: number;
  setOccurrences: (val: number) => void;
}

export default function CustomRecurrenceModal({ open, onClose, interval, setInterval, frequency, setFrequency, selectedDays, toggleDay, ends, setEnds,
                                                endDate, setEndDate, occurrences, setOccurrences }: CustomRecurrenceModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Custom recurrence</h2>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography>Repeat every</Typography>
          <TextField
            type="number"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            inputProps={{ min: 1 }}
            size="small"
            sx={{ width: "60px" }}
          />
          <Select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            size="small"
          >
            <MenuItem value="DAILY">day</MenuItem>
            <MenuItem value="WEEKLY">week</MenuItem>
            <MenuItem value="MONTHLY">month</MenuItem>
            <MenuItem value="YEARLY">year</MenuItem>
          </Select>
        </Box>

        {frequency === RRuleFrequency.WEEKLY && (
          <Box
            display="flex"
            justifyContent="center"
              sx={{
                  gap: {
                    xs: 0.25, // very small gap on mobile
                    sm: 0.5,  // small tablets
                    md: 1,    // standard desktop
                    lg: 1.5,  // large desktop
                    xl: 2     // ultra wide screens
                  },
                  mb: 2,
                }}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <Button
                key={i}
                onClick={() => toggleDay(i)}
                variant={selectedDays.includes(i) ? "contained" : "outlined"}
                size="small"
                sx={{
                  minWidth: "28px",
                  height: "28px",
                  padding: 0,
                  fontSize: "0.75rem",
                  borderRadius: "50%",
                  lineHeight: 1,
                }}
              >
                {day}
              </Button>
            ))}
          </Box>
        )}

        <FormLabel component="legend">Ends</FormLabel>
        <RadioGroup
          value={ends}
          onChange={(e) => setEnds(e.target.value as DBRecurrenceEnds)}
        >
          <FormControlLabel value="never" control={<Radio />} label="Never" />
          <FormControlLabel value="on" control={<Radio />} label="On (inclusive end date)" />
          {ends === "on" && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End date"
                value={endDate}
                onChange={setEndDate}
              />
            </LocalizationProvider>
          )}
          <FormControlLabel value="after" control={<Radio />} label="After" />
          {ends === "after" && (
            <TextField
              type="number"
              label="Occurrences"
              value={occurrences}
              onChange={(e) => setOccurrences(Number(e.target.value))}
              inputProps={{ min: 1 }}
              size="small"
            />
          )}
        </RadioGroup>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button onClick={onClose} variant="contained">Done</Button>
        </Box>
      </div>
    </div>
  );
}
