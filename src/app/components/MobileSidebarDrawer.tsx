"use client";

import { useState, useEffect } from "react";
import Drawer from "@mui/material/Drawer";
import { FiX } from "react-icons/fi";

interface MobileSidebarDrawerProps {
  children: React.ReactNode;
}

export default function MobileSidebarDrawer({ children }: MobileSidebarDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("toggleMobileSidebar", handleToggle);

    return () => {
      window.removeEventListener("toggleMobileSidebar", handleToggle);
    };
  }, []);

  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={() => setIsOpen(false)}
      sx={{
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          width: "85%",
          maxWidth: "400px",
          backgroundColor: "var(--drawer-bg)",
        },
      }}
    >
      <div className="h-full bg-white dark:bg-gray-800 relative flex flex-col">
        {/* Close button */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">My Schedule</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <FiX className="text-gray-600 dark:text-gray-300" size={24} />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </Drawer>
  );
}
