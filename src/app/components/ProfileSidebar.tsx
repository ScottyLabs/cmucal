"use client";

import { useState, useEffect } from "react";
import { FiChevronUp, FiChevronDown, FiEye, FiEdit3 } from "react-icons/fi";
import Accordion from "./Accordion";
import ToggleItem from "./ToggleItem";
import { Course, Club, ClubOrganization } from "../utils/types";
import { getClubOrganizations, addOrgToSchedule, removeOrgFromSchedule } from "../utils/api/organizations";

interface ProfileSidebarProps {
  courses: Course[];
  clubs: Club[];
  onRemoveCategory: (categoryId: number) => void;
  onEventToggle?: (eventId: number, isVisible: boolean) => void;
  currentScheduleId?: number;
  onScheduleUpdate?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  courses, 
  clubs, 
  onRemoveCategory,
  onEventToggle,
  currentScheduleId,
  onScheduleUpdate
}) => {
  const [toggledCategories, setToggledCategories] = useState<Record<number, boolean>>({});
  const [isCoursesOpen, setIsCoursesOpen] = useState(true);
  const [isClubsOpen, setIsClubsOpen] = useState(true);
  const [isClubsEditMode, setIsClubsEditMode] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<ClubOrganization[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);

  const handleToggle = (categoryId: number) => {
    setToggledCategories(prev => ({...prev, [categoryId]: !prev[categoryId]}));
  };

  // Fetch available clubs when in edit mode
  useEffect(() => {
    if (isClubsEditMode) {
      setLoadingClubs(true);
      getClubOrganizations()
        .then(setAvailableClubs)
        .catch(error => console.error('Failed to fetch clubs:', error))
        .finally(() => setLoadingClubs(false));
    }
  }, [isClubsEditMode]);

  const handleAddClub = async (clubId: number) => {
    console.log('handleAddClub called with clubId:', clubId, 'currentScheduleId:', currentScheduleId);
    if (!currentScheduleId) {
      console.error('No schedule selected. Please select a schedule first.');
      alert('Please select a schedule before adding clubs.');
      return;
    }
    
    try {
      console.log('Calling addOrgToSchedule with:', currentScheduleId, clubId);
      await addOrgToSchedule(currentScheduleId, clubId);
      console.log('Successfully added club to schedule');
      onScheduleUpdate?.(); // Refresh the schedule data
    } catch (error) {
      console.error('Failed to add club to schedule:', error);
      alert('Failed to add club to schedule. Please try again.');
    }
  };

  const handleRemoveClub = async (clubId: number) => {
    console.log('handleRemoveClub called with clubId:', clubId, 'currentScheduleId:', currentScheduleId);
    if (!currentScheduleId) {
      console.error('No schedule selected. Please select a schedule first.');
      alert('Please select a schedule before removing clubs.');
      return;
    }
    
    try {
      console.log('Calling removeOrgFromSchedule with:', currentScheduleId, clubId);
      await removeOrgFromSchedule(currentScheduleId, clubId);
      console.log('Successfully removed club from schedule');
      onScheduleUpdate?.(); // Refresh the schedule data
    } catch (error) {
      console.error('Failed to remove club from schedule:', error);
      alert('Failed to remove club from schedule. Please try again.');
    }
  };

  // Filter out clubs that are already in the schedule
  const availableClubsFiltered = availableClubs.filter(
    club => !clubs.some(existingClub => existingClub.org_id === club.id)
  );

  return (
    <div className="h-full dark:bg-gray-700 dark:text-gray-200 p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsCoursesOpen(!isCoursesOpen)}>
          <h3 className="text-gray-600 dark:text-gray-400">My Courses</h3>
          {isCoursesOpen ? <FiChevronUp className="w-5 h-5 text-gray-600" /> : <FiChevronDown className="w-5 h-5 text-gray-600" />}
        </div>

        {isCoursesOpen && courses.map(course => (
          <Accordion 
            key={course.org_id} 
            title={course.name}
            onRemove={() => course.categories.forEach(cat => onRemoveCategory(cat.id))}
            color="red"
          >
            {course.categories.map(category => (
              <div key={category.id} className="mb-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {category.name}
                </div>
                {course.events[category.name]?.map(event => (
                  <ToggleItem
                    key={event.id}
                    label={event.title}
                    checked={toggledCategories[event.id] ?? false}
                    onChange={() => {
                      handleToggle(event.id);
                      onEventToggle?.(event.id, !toggledCategories[event.id]);
                    }}
                    color="red"
                  />
                ))}
              </div>
            ))}
          </Accordion>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center cursor-pointer" onClick={() => setIsClubsOpen(!isClubsOpen)}>
            <h3 className="text-gray-600 dark:text-gray-400 mr-2">My Clubs</h3>
            {isClubsOpen ? <FiChevronUp className="w-5 h-5 text-gray-600" /> : <FiChevronDown className="w-5 h-5 text-gray-600" />}
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setIsClubsEditMode(false)}
              className={`p-1 rounded ${!isClubsEditMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="View mode"
            >
              <FiEye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsClubsEditMode(true)}
              className={`p-1 rounded ml-1 ${isClubsEditMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Edit mode"
            >
              <FiEdit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isClubsOpen && (
          isClubsEditMode ? (
            <div className="space-y-3">
              {loadingClubs ? (
                <div className="text-gray-500">Loading clubs...</div>
              ) : (
                <>
                  {/* Existing clubs with Remove buttons */}
                  {clubs.map(club => (
                    <div key={`existing-${club.org_id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-600">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{club.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Currently in your schedule</div>
                      </div>
                      <button
                        onClick={() => handleRemoveClub(club.org_id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  {/* Available clubs with Add buttons */}
                  {availableClubsFiltered.length === 0 && clubs.length === 0 ? (
                    <div className="text-gray-500 text-sm">No clubs available</div>
                  ) : availableClubsFiltered.length === 0 ? (
                    <div className="text-gray-500 text-sm">No more clubs available to add</div>
                  ) : (
                    availableClubsFiltered.map(club => (
                      <div key={`available-${club.id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{club.name}</div>
                          {club.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{club.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddClub(club.id)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          ) : (
            clubs.map(club => (
              <Accordion 
                key={club.org_id} 
                title={club.name}
                onRemove={() => club.categories.forEach(cat => onRemoveCategory(cat.id))}
                color="green"
              >
                {club.categories.map(category => (
                  <div key={category.id} className="mb-4">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {category.name}
                    </div>
                    {club.events[category.name]?.map(event => (
                      <ToggleItem
                        key={event.id}
                        label={event.title}
                        checked={toggledCategories[event.id] ?? false}
                        onChange={() => {
                          handleToggle(event.id);
                          onEventToggle?.(event.id, !toggledCategories[event.id]);
                        }}
                        color="green"
                      />
                    ))}
                  </div>
                ))}
              </Accordion>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar; 