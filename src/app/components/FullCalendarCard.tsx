import React from 'react'
import { EventContentArg } from '@fullcalendar/core';

function FullCalendarCard(eventContent: EventContentArg) {
    const isSaved = eventContent.event.extendedProps?.isSaved === true;

    return (
      <div className="w-full h-full relative overflow-hidden">
        {/* Indicator dot - filled for saved events, hollow for unsaved */}
        <div
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            isSaved
              ? 'bg-white'
              : ''
          }`}
        />
        <p className="custom-event-text w-full truncate pr-3">{eventContent.event.title}</p>
        <p className="custom-event-text custom-event-time w-full">{eventContent.timeText}</p>
      </div>
    )
  }

export default FullCalendarCard;