"use client"; // Required for hooks in Next.js App Router

import { usePathname } from "next/navigation"; // Detects the current path
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSearch, FiMoon, FiSun, FiLogOut, FiTrash2, FiMenu } from "react-icons/fi"; // Search, dark mode, logout
import { FaRegUser } from "react-icons/fa"; // User icon
import { BsCalendar3 } from "react-icons/bs"; // Calendar icon
import { GrUserManager } from "react-icons/gr"; // Manager icon
import { FiUpload } from "react-icons/fi";
import { useIsMobile } from "../hooks/useIsMobile";
import { useRouter } from "next/navigation";

import { useEventState } from "../../context/EventStateContext";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "~/context/UserContext";

import { ConnectGoogleButton } from "./ConnectGoogleButton";

import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import axios from 'axios';
import { getUserID } from "../utils/api/users";
import { API_BASE_URL } from "../utils/api/api";
import { fetchRole } from "../utils/authService";


// type NavBarProps = {
//   UserButton: ReactNode;
// };

export default function Navbar() {

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // const [showUploadModalOne, setShowUploadModalOne] = useState(false);
  // const [showUploadModalTwo, setShowUploadModalTwo] = useState(false);  
  const { openPreUpload } = useEventState();
  const { currentScheduleId, setCurrentScheduleId } = useUser();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userId, setUserId] = useState<string | number>("n/a");
  const pathname = usePathname();

  const [schedules, setSchedules] = useState<Array<{id: number, name: string}>>([]);
  const [showNewScheduleInput, setShowNewScheduleInput] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const isMobile = useIsMobile();

  const { user } = useClerkUser();  // clerk user object
  const router = useRouter();


  const getUserIdFromClerkId = async (clerkId: string) => {
    try {
      // First try to get user ID
      const data = await getUserID(clerkId);
      return data.user_id;
    } catch (err: any) {
      // If user not found, create new user
      throw new Error("User not found");
    }
  };

  const handleScheduleChange = (event: SelectChangeEvent) => {
    // Don't change schedule if "new" is selected - just open the modal
    if (event.target.value === 'new') {
      setShowNewScheduleInput(true);
      return;
    }
    
    const scheduleId = Number(event.target.value);
    const schedule = schedules.find(s => s.id === scheduleId) ?? null;
    // Update context directly (this will trigger refetch)
    setCurrentScheduleId(schedule?.id ?? null);
  };

  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim() || !user?.id) {
      console.error("Missing schedule name or user not logged in");
      return;
    }

    setIsCreatingSchedule(true);
    try {
      const id = await getUserIdFromClerkId(user.id);
      if (!id) {
        console.error("No user ID available");
        setIsCreatingSchedule(false);
        return;
      }

      // Create schedule
      const response = await axios.post(`${API_BASE_URL}/users/create_schedule`, {
        user_id: id,
        name: newScheduleName.trim()
      }, {
        withCredentials: true,
      });

      if (response.data.schedule_id) {
        const newScheduleId: number = response.data.schedule_id;
        const newScheduleName_trimmed = newScheduleName.trim();
        
        // Update local state
        const newSchedule = { id: newScheduleId, name: newScheduleName_trimmed };
        setSchedules(prev => [...prev, newSchedule]);
        setShowNewScheduleInput(false);
        setNewScheduleName('');

        // Update context directly (triggers refetch)
        setCurrentScheduleId(newScheduleId);
      }
    } catch (error: any) {
      console.error("Failed to create schedule:", error.response?.data?.error || error.message);
      alert("Failed to create schedule. Please try again.");
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number, scheduleName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the select from opening/closing
    
    if (!user?.id) {
      console.error("User not logged in");
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${scheduleName}"?`)) {
      return;
    }

    // Store previous state for rollback
    const previousSchedules = schedules;
    const previousScheduleId = currentScheduleId;

    // Optimistically update UI immediately
    const remainingSchedules = schedules.filter(s => s.id !== scheduleId);
    setSchedules(remainingSchedules);

    // If we deleted the current schedule, switch to the first available one
    if (currentScheduleId === scheduleId) {
      if (remainingSchedules.length > 0 && remainingSchedules[0]) {
        setCurrentScheduleId(remainingSchedules[0].id);
      } else {
        setCurrentScheduleId(-1);
      }
    }

    // Delete in background
    try {
      const id = await getUserIdFromClerkId(user.id);
      if (!id) {
        throw new Error("No user ID available");
      }

      await axios.delete(`${API_BASE_URL}/users/delete_schedule`, {
        data: { schedule_id: scheduleId },
        withCredentials: true,
      });
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      alert("Failed to delete schedule. Reverting changes.");
      
      // Revert on error
      setSchedules(previousSchedules);
      setCurrentScheduleId(previousScheduleId);
    }
  };


  // Handle dark mode mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle user data fetching (parallelized)
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        const id = await getUserIdFromClerkId(user.id);
        if (id) {
          setUserId(id);
          
          // Parallel API calls for faster loading
          const [schedulesResponse, role] = await Promise.all([
            axios.get<Array<{ id: number; name: string }>>(`${API_BASE_URL}/users/schedules`, {
              params: { user_id: id },
              withCredentials: true,
            }),
            fetchRole(user?.id)
          ]);
          
          setSchedules(schedulesResponse.data);
          setUserRole(role);
        } else {
          console.error("Failed to retrieve user ID from Clerk ID");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    void fetchUserData();
  }, [user?.id]);

  // Render navbar immediately, show skeleton for schedule selector
  // Only show loading if we haven't fetched userId yet, or if we have schedules but no currentScheduleId
  const isLoading = !userId || (schedules.length > 0 && currentScheduleId === null);

  const handleAdminDashboardRedirect = () => {
    if (userRole === "manager") {
      router.push("/manager");
    } else if (userRole === "admin") {
      router.push("/admin");
    } else {
      router.push("/"); // fallback
    }
  };

  return (
    <>
      <nav className="flex items-center justify-between px-4 py-3 border-b border-b-gray-300 dark:border-b-gray-600 bg-white dark:bg-gray-800 shadow-md dark:shadow-lg">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <button
              onClick={() => {
                // This will be handled by the drawer in the page component
                window.dispatchEvent(new CustomEvent('toggleMobileSidebar'));
              }}
              className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiMenu className="text-gray-600 dark:text-gray-300" size={24} />
            </button>
          )}
          
          {/* CMUCal Title */}
          <Link href="/" className="flex items-center gap-1 mr-2">
            <img src="/newLogo.png" alt="CMUCal Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">CMUCal</h1>
          </Link>
          
          {/* Segmented Selector for Home/Explore - Desktop only */}
          {!isMobile && (
            <div className="h-10 flex items-center border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 overflow-hidden">
            <Link href="/" className="flex-1">
              <div
                className={`flex items-center justify-center h-10 px-3 cursor-pointer transition-colors
                  ${pathname === "/" 
                    ? "bg-gray-100 dark:bg-gray-600" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-600"}
                `}
              >
              <FaRegUser className="w-5 h-5 text-gray-700 dark:text-gray-300" size={18} />
              </div>
            </Link>

            {/* Dividing line */}
            <div className="w-px h-full bg-gray-300 dark:bg-gray-600"></div>

            <Link href="/explore" className="flex-1">
              <div className={`flex items-center justify-center h-10 px-3 cursor-pointer transition-colors
                ${pathname === "/explore" 
                  ? "bg-gray-100 dark:bg-gray-600" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
                <FiSearch className="w-5 h-5 text-gray-700 dark:text-gray-300" size={20} />
              </div>
            </Link>
            </div>
          )}

          {/* Schedule Selector - Button or Dropdown - Desktop only */}
          {!isMobile && (
            <div className="relative">
            {isLoading ? (
              // Show skeleton while loading
              <div className="h-10 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 animate-pulse flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ) : schedules.length === 0 ? (
              // Show button when no schedules exist
              <button
                onClick={() => setShowNewScheduleInput(true)}
                className="h-10 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <BsCalendar3 className="text-gray-600 dark:text-gray-300" size={16} />
                <span>Create Schedule</span>
              </button>
            ) : (
              // Show dropdown when schedules exist
              <FormControl sx={{ minWidth: 120 }} size="small">
                <Select
                  value={currentScheduleId ? String(currentScheduleId) : ''}
                  onChange={handleScheduleChange}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Schedule selector' }}
                  renderValue={(value) => {
                    const schedule = schedules.find(s => s.id === Number(value));
                    return (
                      <div className="flex items-center gap-2">
                        <BsCalendar3 className="text-gray-600 dark:text-white" size={16} />
                        <span className="text-sm text-gray-800 dark:text-white">{schedule?.name ?? 'Select Schedule'}</span>
                      </div>
                    );
                  }}
                  sx={{
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: "none",
                    },
                    '&:hover': {
                      backgroundColor: "#f9fafb",
                    },
                    '&.Mui-focused': {
                      boxShadow: "none",
                      border: "1px solid #e5e7eb"
                    },
                    height: "40px",
                    backgroundColor: "white",
                    '.dark &': {
                      backgroundColor: "#374151",
                      border: "1px solid #4D5461",
                    }
                  }}
                >
                  {schedules.map((schedule) => (
                    <MenuItem 
                      key={schedule.id} 
                      value={String(schedule.id)}
                      sx={{
                        '& .delete-icon': {
                          opacity: 0,
                        },
                        '&:hover .delete-icon': {
                          opacity: 1,
                        }
                      }}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2">
                          <BsCalendar3 className="text-gray-600 dark:text-white" size={16} />
                          <span className="text-sm text-gray-800 dark:text-white">{schedule.name}</span>
                        </div>
                        <button
                          className="delete-icon transition-opacity"
                          onClick={(e) => handleDeleteSchedule(schedule.id, schedule.name, e)}
                        >
                          <FiTrash2 className="text-gray-400 hover:text-red-500" size={16} />
                        </button>
                      </div>
                    </MenuItem>
                  ))}
                  <MenuItem value="new">
                    <div className="flex items-center gap-2 text-blue-500">
                      <span className="text-sm">+ Create New Schedule</span>
                    </div>
                  </MenuItem>
                </Select>
              </FormControl>
            )}
            
            {showNewScheduleInput && (
              <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50 min-w-[250px]">
                <input
                  type="text"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreatingSchedule) {
                      void handleCreateSchedule();
                    } else if (e.key === 'Escape') {
                      setShowNewScheduleInput(false);
                      setNewScheduleName('');
                    }
                  }}
                  placeholder="Schedule name"
                  className="w-full p-2 border rounded-md mb-2 dark:bg-gray-700 dark:text-white"
                  autoFocus
                  disabled={isCreatingSchedule}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => void handleCreateSchedule()}
                    disabled={isCreatingSchedule}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"

                  >
                    {isCreatingSchedule ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewScheduleInput(false);
                      setNewScheduleName('');
                    }}
                    disabled={isCreatingSchedule}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Center Section: Search Bar */}
        {/* TODO: THIS DOESNT ACTUALLY DO ANYTHING */}
        <div className="flex-1 max-w-2xl mx-4">
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Mobile: Schedule Selector */}
          {isMobile && (
            <div className="relative mr-2">
              {isLoading ? (
                <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : schedules.length === 0 ? (
                <button
                  onClick={() => setShowNewScheduleInput(true)}
                  className="h-8 px-2 text-xs font-medium border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                >
                  <BsCalendar3 className="text-gray-600 dark:text-gray-300" size={14} />
                </button>
              ) : (
                <FormControl size="small">
                  <Select
                    value={currentScheduleId ? String(currentScheduleId) : ''}
                    onChange={handleScheduleChange}
                    displayEmpty
                    renderValue={() => (
                      <div className="flex items-center">
                        <BsCalendar3 className="text-gray-600 dark:text-white" size={14} />
                      </div>
                    )}
                    sx={{
                      border: "1px solid #D1D5DB",
                      borderRadius: "8px",
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: "none",
                      },
                      height: "32px",
                      minWidth: "40px",
                      backgroundColor: "white",
                      '.dark &': {
                        backgroundColor: "#374151",
                        border: "1px solid #4D5461",
                      }
                    }}
                  >
                    {schedules.map((schedule) => (
                      <MenuItem 
                        key={schedule.id} 
                        value={String(schedule.id)}
                        sx={{
                          '& .delete-icon': {
                            opacity: 0,
                          },
                          '&:hover .delete-icon': {
                            opacity: 1,
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2">
                            <BsCalendar3 className="text-gray-600 dark:text-white" size={16} />
                            <span className="text-sm text-gray-800 dark:text-white">{schedule.name}</span>
                          </div>
                          <button
                            className="delete-icon transition-opacity"
                            onClick={(e) => handleDeleteSchedule(schedule.id, schedule.name, e)}
                          >
                            <FiTrash2 className="text-gray-400 hover:text-red-500" size={16} />
                          </button>
                        </div>
                      </MenuItem>
                    ))}
                    <MenuItem value="new">
                      <div className="flex items-center gap-2 text-blue-500">
                        <span className="text-sm">+ Create New Schedule</span>
                      </div>
                    </MenuItem>
                  </Select>
                </FormControl>
              )}
            </div>
          )}
          
          {/* Desktop: Connect Google, Upload, Dark Mode */}
          {!isMobile && (
            <>
              <div className="mx-2">
                {user?.id && <ConnectGoogleButton clerkId={user.id} />}
              </div>
              {/* Dark Mode Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {theme === "dark" ? (
                    <FiSun className="text-yellow-400" size={20} />
                  ) : (
                    <FiMoon className="text-gray-600 dark:text-white" size={20} />
                  )}
                </button>
              )}
            </>
          )}
          
          {/* Upload Button - Both mobile and desktop */}
          <button
            onClick={() => openPreUpload()}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiUpload className="text-gray-600 dark:text-gray-300" size={20} />
          </button>
          
          {/* User Button */}
          <div className="mx-2 flex flex-col justify-end"> 
            <UserButton>
              {(userRole === "manager" || userRole === "admin") && (
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Open Admin Dashboard"
                    labelIcon={<GrUserManager />}
                    onClick={() => handleAdminDashboardRedirect()}
                  />
                </UserButton.MenuItems>
              )}
            </UserButton>
          </div>
        </div>
      </nav>
    </>
  );
}
