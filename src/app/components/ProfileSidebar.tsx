"use client";

import { useState, useEffect } from "react";
import { FiChevronUp, FiChevronDown, FiEye, FiEdit3, FiSearch } from "react-icons/fi";
import Accordion from "./Accordion";
import ToggleItem from "./ToggleItem";
import { Course, Club, ClubOrganization, CourseOption } from "../utils/types";
import { getClubOrganizations, addOrgToSchedule, removeOrgFromSchedule, getCourseOrgs } from "../utils/api/organizations";
import { useUser } from "~/context/UserContext";

interface ProfileSidebarProps {
  courses: Course[];
  clubs: Club[];
  onRemoveCategory: (categoryId: number) => void;
  onCategoryToggle?: (categoryId: number, isVisible: boolean) => void;
  currentScheduleId?: number;
  onScheduleUpdate?: () => void;
  visibleCategories?: Set<number>;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  courses, 
  clubs, 
  onRemoveCategory,
  onCategoryToggle,
  currentScheduleId,
  onScheduleUpdate,
  visibleCategories
}) => {
  const { addOrganization, removeOrganization } = useUser();
  const [isCoursesOpen, setIsCoursesOpen] = useState(true);
  const [isCoursesEditMode, setIsCoursesEditMode] = useState(false);
  const [isClubsOpen, setIsClubsOpen] = useState(true);
  const [isClubsEditMode, setIsClubsEditMode] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<ClubOrganization[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [clubSearchTerm, setClubSearchTerm] = useState("");
  const [addingOrgId, setAddingOrgId] = useState<number | null>(null);

  // Fetch available clubs
  const fetchClubs = async () => {
    setLoadingClubs(true);
    try {
      const clubs = await getClubOrganizations();
      setAvailableClubs(clubs);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoadingClubs(false);
    }
  };

  // Fetch available courses
  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const courses = await getCourseOrgs();
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Lazy load available orgs on mount
  useEffect(() => {
    void fetchClubs();
    void fetchCourses();
  }, []);

  const handleAddClub = async (clubId: number) => {
    if (!currentScheduleId) {
      alert('Please select a schedule before adding clubs.');
      return;
    }
    
    setAddingOrgId(clubId);
    try {
      const [, orgData] = await Promise.all([
        addOrgToSchedule(currentScheduleId, clubId),
        addOrganization(clubId)
      ]);
      
      // Enable all categories for the newly added org
      if (orgData?.categories) {
        orgData.categories.forEach(category => {
          onCategoryToggle?.(category.id, true);
        });
      }
      
      setIsClubsEditMode(false);
    } catch (error) {
      console.error('Failed to add club to schedule:', error);
      alert('Failed to add club to schedule. Please try again.');
    } finally {
      setAddingOrgId(null);
    }
  };

  const handleRemoveClub = async (clubId: number) => {
    if (!currentScheduleId) {
      alert('Please select a schedule before removing clubs.');
      return;
    }
    
    try {
      removeOrganization(clubId);
      await removeOrgFromSchedule(currentScheduleId, clubId);
      setIsClubsEditMode(false);
    } catch (error) {
      console.error('Failed to remove club from schedule:', error);
      alert('Failed to remove club from schedule. Please try again.');
    }
  };

  const handleAddCourse = async (courseId: string) => {
    if (!currentScheduleId) {
      alert('Please select a schedule before adding courses.');
      return;
    }
    
    const orgId = parseInt(courseId);
    setAddingOrgId(orgId);
    try {
      const [, orgData] = await Promise.all([
        addOrgToSchedule(currentScheduleId, orgId),
        addOrganization(orgId)
      ]);
      
      // Enable all categories for the newly added org
      if (orgData?.categories) {
        orgData.categories.forEach(category => {
          onCategoryToggle?.(category.id, true);
        });
      }
      
      setIsCoursesEditMode(false);
    } catch (error) {
      console.error('Failed to add course to schedule:', error);
      alert('Failed to add course to schedule. Please try again.');
    } finally {
      setAddingOrgId(null);
    }
  };

  const handleRemoveCourse = async (courseId: number) => {
    if (!currentScheduleId) {
      alert('Please select a schedule before removing courses.');
      return;
    }
    
    try {
      removeOrganization(courseId);
      await removeOrgFromSchedule(currentScheduleId, courseId);
      setIsCoursesEditMode(false);
    } catch (error) {
      console.error('Failed to remove course from schedule:', error);
      alert('Failed to remove course from schedule. Please try again.');
    }
  };

  // Filter out clubs that are already in the schedule and apply search
  const availableClubsFiltered = availableClubs.filter(
    club => !clubs.some(existingClub => existingClub.org_id === club.id) &&
    (clubSearchTerm === "" || 
     club.name.toLowerCase().includes(clubSearchTerm.toLowerCase()) ||
     club.description?.toLowerCase().includes(clubSearchTerm.toLowerCase()))
  );

  // Filter existing clubs by search term
  const existingClubsFiltered = clubs.filter(
    club => clubSearchTerm === "" || 
    club.name.toLowerCase().includes(clubSearchTerm.toLowerCase())
  );

  // Filter out courses that are already in the schedule and apply search
  const availableCoursesFiltered = availableCourses.filter(
    course => !courses.some(existingCourse => existingCourse.org_id === parseInt(course.id)) &&
    (courseSearchTerm === "" || 
     course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
     course.number.toLowerCase().includes(courseSearchTerm.toLowerCase()))
  );

  // Filter existing courses by search term
  const existingCoursesFiltered = courses.filter(
    course => courseSearchTerm === "" || 
    course.name.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  return (
    <div className="h-full dark:text-gray-200 overflow-y-auto">
      <div className="my-6 px-8 ">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center cursor-pointer" onClick={() => setIsCoursesOpen(!isCoursesOpen)}>
            <h3 className="text-gray-600 dark:text-gray-400 mr-2">My Courses</h3>
            {isCoursesOpen ? <FiChevronUp className="w-5 h-5 text-gray-600" /> : <FiChevronDown className="w-5 h-5 text-gray-600" />}
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setIsCoursesEditMode(false)}
              className={`p-1 rounded ${!isCoursesEditMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="View mode"
            >
              <FiEye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCoursesEditMode(true)}
              className={`p-1 rounded ml-1 ${isCoursesEditMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Edit mode"
            >
              <FiEdit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isCoursesOpen && (
          <>
            {isCoursesEditMode && (
              <div className="mb-2">
                {/* Search bar for courses */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-white dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="max-h-80 overflow-y-auto pr-1">
              {isCoursesEditMode ? (
                <div className="space-y-3">
                  {loadingCourses ? (
                    <div className="text-gray-500 text-sm">Loading courses...</div>
                  ) : (
                    <>
                      {/* Existing courses with Remove buttons */}
                      {existingCoursesFiltered.map(course => (
                        <div key={`existing-${course.org_id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-600">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{course.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Currently in your schedule</div>
                          </div>
                          <button
                            onClick={() => handleRemoveCourse(course.org_id)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    
                      {/* Available courses with Add buttons */}
                      {availableCoursesFiltered.length === 0 && existingCoursesFiltered.length === 0 ? (
                        <div className="text-gray-500 text-sm">No courses found</div>
                      ) : availableCoursesFiltered.length === 0 && existingCoursesFiltered.length > 0 ? (
                        <div className="text-gray-500 text-sm">No more courses available to add</div>
                      ) : (
                        availableCoursesFiltered.map(course => (
                          <div key={`available-${course.id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{course.title}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{course.number}</div>
                            </div>
                            <button
                              onClick={() => handleAddCourse(course.id)}
                              disabled={addingOrgId === parseInt(course.id)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addingOrgId === parseInt(course.id) ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              ) : (
                courses.length === 0 ? (
                  <div className="text-gray-500 text-sm">No courses in your schedule</div>
                ) : (
                  courses.map(course => (
                    <Accordion 
                      key={course.org_id} 
                      title={course.name}
                      onRemove={() => handleRemoveCourse(course.org_id)}
                      color="red"
                    >
                      {course.categories.map(category => (
                        <div key={category.id} className="mb-2">
                          <ToggleItem
                            key={category.id}
                            label={category.name}
                            checked={visibleCategories?.has(category.id) ?? false}
                            onChange={() => {
                              onCategoryToggle?.(category.id, !visibleCategories?.has(category.id));
                            }}
                            color="red"
                          />
                        </div>
                      ))}
                    </Accordion>
                  ))
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* horizontal seperator */}
      <div className="w-full h-px bg-gray-300 dark:bg-gray-600"></div>

      <div className="my-6 px-8 ">
        <div className="flex justify-between items-center mb-2">
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
          <>
            {isClubsEditMode && (
              <div className="mb-2">
                {/* Search bar for clubs */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search clubs..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-white dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={clubSearchTerm}
                    onChange={(e) => setClubSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="max-h-80 overflow-y-auto pr-1">
              {isClubsEditMode ? (
                <div className="space-y-3">
                  {loadingClubs ? (
                    <div className="text-gray-500 text-sm">Loading clubs...</div>
                  ) : (
                    <>
                      {/* Existing clubs with Remove buttons */}
                      {existingClubsFiltered.map(club => (
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
                      {availableClubsFiltered.length === 0 && existingClubsFiltered.length === 0 ? (
                        <div className="text-gray-500 text-sm">No clubs found</div>
                      ) : availableClubsFiltered.length === 0 && existingClubsFiltered.length > 0 ? (
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
                              disabled={addingOrgId === club.id}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addingOrgId === club.id ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              ) : (
                clubs.length === 0 ? (
                  <div className="text-gray-500 text-sm">No clubs in your schedule</div>
                ) : (
                clubs.map(club => (
                <Accordion 
                  key={club.org_id} 
                  title={club.name}
                  onRemove={() => handleRemoveClub(club.org_id)}
                  color="green"
                >
                  {club.categories.map(category => (
                    <div key={category.id} className="mb-2">
                      <ToggleItem
                        key={category.id}
                        label={category.name}
                        checked={visibleCategories?.has(category.id) ?? false}
                        onChange={() => {
                          onCategoryToggle?.(category.id, !visibleCategories?.has(category.id));
                        }}
                        color="green"
                      />
                    </div>
                  ))}
                </Accordion>
                ))
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar; 