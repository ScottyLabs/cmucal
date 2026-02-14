"use client";

import { useEffect, useState, useRef } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { formatDate } from "~/app/utils/dateService";
import { EventType } from "../types/EventType";
import { useEventState, PopoverPosition } from "../../context/EventStateContext";
import { fetchTagsForEvent } from "../utils/api/events";
import { FiX } from "react-icons/fi";

type EventPopoverProps = {
  show: boolean;
  onClose: () => void;
  position: PopoverPosition;
  savedEventDetails?: EventType;
};

type Tag = { id?: string; name: string };

export default function EventPopover({ show, onClose, position, savedEventDetails }: EventPopoverProps) {
  const { selectedEvent, toggleAdded, savedEventIds, openUpdate } = useEventState();
  const [eventDetails, setEventDetails] = useState<EventType | null>(savedEventDetails || null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const eventId = selectedEvent;
  const isAdmin = eventDetails?.user_is_admin;

  // Update event details when prop changes
  useEffect(() => {
    if (savedEventDetails) {
      setEventDetails(savedEventDetails);
    }
  }, [savedEventDetails]);

  // Position the invisible button at the anchor point
  useEffect(() => {
    if (position && buttonRef.current) {
      const { anchorRect } = position;
      buttonRef.current.style.position = 'fixed';
      buttonRef.current.style.top = `${anchorRect.top}px`;
      buttonRef.current.style.left = `${anchorRect.right}px`;
    }
  }, [position]);

  // Fetch tags
  useEffect(() => {
    if (!eventId) return;

    setLoadingTags(true);
    const fetchTag = async () => {
      try {
        const tags = await fetchTagsForEvent(eventId);
        setSelectedTags(
          tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name.toLowerCase(),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch event tags for event: ", eventId, err);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchTag();
  }, [eventId]);

  if (!position) return null;

  return (
    <>
      {/* Backdrop */}
      {show && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}

      <Popover>
        {/* Invisible button positioned at the anchor point */}
        <PopoverButton
          ref={buttonRef}
          className="opacity-0 pointer-events-none absolute w-0 h-0"
          aria-hidden="true"
        />

        {/* Popover panel */}
        {show && (
          <PopoverPanel
            static
            anchor={{ to: 'right start', gap: '8px', padding: 8 }}
            className="z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80 max-h-96 overflow-auto transition ease-out duration-150 data-[closed]:opacity-0 data-[closed]:scale-95"
          >
          <div className="p-4 relative">
            {/* Close button */}
            <button
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              onClick={onClose}
            >
              <FiX size={18} />
            </button>

            {eventDetails ? (
              <>
                <h3 className="text-lg font-medium pr-6 dark:text-white">{eventDetails.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(eventDetails.start_datetime)} - {formatDate(eventDetails.end_datetime)}
                </p>
                {eventDetails.location && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{eventDetails.location}</p>
                )}
                {eventDetails.org && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hosted by {eventDetails.org}</p>
                )}
                {eventDetails.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">
                    {eventDetails.description}
                  </p>
                )}

                {/* Tags */}
                {!loadingTags && selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-white ${
                      savedEventIds.has(eventDetails.id) ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    onClick={() => {
                      toggleAdded(eventDetails);
                      onClose();
                    }}
                  >
                    {savedEventIds.has(eventDetails.id) ? "Remove" : "Add"}
                  </button>
                  {isAdmin && (
                    <button
                      className="flex-1 px-3 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => openUpdate(eventDetails, selectedTags)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            )}
          </div>
          </PopoverPanel>
        )}
      </Popover>
    </>
  );
}
