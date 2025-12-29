"use client"; // Required for hooks in Next.js App Router

import { usePathname } from "next/navigation"; // Detects the current path
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiSearch, FiMoon, FiSun, FiLogOut } from "react-icons/fi"; // Search, dark mode, logout
import { FaRegUser } from "react-icons/fa"; // User icon
import { BsCalendar3 } from "react-icons/bs"; // Calendar icon
import { GrUserManager } from "react-icons/gr"; // Manager icon
import { useRouter } from "next/navigation";

import { useEventState } from "../../context/EventStateContext";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userId, setUserId] = useState<string | number>("n/a");
  const pathname = usePathname();

  const [schedules, setSchedules] = useState<Array<{id: number, name: string}>>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [showNewScheduleInput, setShowNewScheduleInput] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  const { user } = useUser();  // clerk user object
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
    const schedule = schedules.find(s => s.name === event.target.value) || null;
    setSelectedSchedule(event.target.value);
    // Emit schedule change event
    const changeEvent = new CustomEvent('scheduleChange', { detail: { scheduleId: schedule?.id ?? null } });
    window.dispatchEvent(changeEvent);
  };

  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim() || !user?.id) {
      console.error("Missing schedule name or user not logged in");
      return;
    }

    try {
      const id = await getUserIdFromClerkId(user.id);
      if (!id) {
        console.error("No user ID available");
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
        // Update local state
        const newSchedule = { id: response.data.schedule_id, name: newScheduleName.trim() };
        setSchedules(prev => [...prev, newSchedule]);
        setSelectedSchedule(newScheduleName.trim());
        setShowNewScheduleInput(false);
        setNewScheduleName('');

        // Refetch schedules to ensure consistency
        const refreshResponse = await axios.get(`${API_BASE_URL}/users/schedules`, {
          params: { user_id: id },
          withCredentials: true,
        });
        setSchedules(refreshResponse.data);
      }
    } catch (error: any) {
      console.error("Failed to create schedule:", error.response?.data?.error || error.message);
    }
  };


  // Handle dark mode mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle user data fetching
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        const id = await getUserIdFromClerkId(user.id);
        if (id) {
          setUserId(id);
          // Fetch user's schedules
          const response = await axios.get(`${API_BASE_URL}/users/schedules`, {
            params: { user_id: id },
            withCredentials: true,
          });
          setSchedules(response.data);
          if (response.data.length > 0) {
            setSelectedSchedule(response.data[0].name);
            // Emit initial schedule change event
            const changeEvent = new CustomEvent('scheduleChange', { 
              detail: { scheduleId: response.data[0].id } 
            });
            window.dispatchEvent(changeEvent);
          }
          const role = await fetchRole(user?.id);
          setUserRole(role);
        } else {
          console.error("Failed to retrieve user ID from Clerk ID");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.id]);

  if (!userId) {
    return <div>Loading...</div>;
  }

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
      <nav className="flex sticky top-0 z-50 items-center justify-between px-4 py-3 border-b border-b-gray-300 dark:border-b-gray-600 bg-white dark:bg-gray-800 shadow-md">
        {/* Left Section: Title + Segmented Selector + Schedule Dropdown */}
        <div className="flex items-center gap-3">
          {/* CMUCal Title */}
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">CMUCal</h1>
          
          {/* Segmented Selector for Home/Explore */}
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

          {/* Schedule Selector - Button or Dropdown */}
          {schedules.length === 0 ? (
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
                value={selectedSchedule}
                onChange={handleScheduleChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Schedule selector' }}
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
                  <MenuItem key={schedule.id} value={schedule.name}>
                    <div className="flex items-center gap-2">
                      <BsCalendar3 className="text-gray-600 dark:text-white" size={16} />
                      <span className="text-sm text-gray-800 dark:text-white">{schedule.name}</span>
                    </div>
                  </MenuItem>
                ))}
                <MenuItem value="new" onClick={() => setShowNewScheduleInput(true)}>
                  <div className="flex items-center gap-2 text-blue-500">
                    <span className="text-sm">+ Create New Schedule</span>
                  </div>
                </MenuItem>
              </Select>
            </FormControl>
          )}
          
          {showNewScheduleInput && (
            <div className="absolute top-16 left-4 mt-2 p-3 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50">
              <input
                type="text"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                placeholder="Schedule name"
                className="w-full p-2 border rounded-md mb-2 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewScheduleInput(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchedule}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center Section: Search Bar */}
        {/* TODO: THIS DOESNT ACTUALLY DO ANYTHING */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search for a schedule or event..."
              className="h-10 w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-transparent dark:text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-md transition-shadow"
            />
          </div>
        </div>

        {/* Right Section: Upload, Connect Google, Dark Mode, User Button */}
        <div className="flex items-center gap-3">
          {/* Upload Button */}
          <button
            onClick={() => openPreUpload()}
            className="h-10 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Upload
          </button>

          <ConnectGoogleButton />
          
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
          
          {/* User Button */}
          <div> 
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
