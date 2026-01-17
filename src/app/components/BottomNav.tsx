"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaRegUser } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16">
        {/* Home Button */}
        <Link href="/" className="flex-1">
          <div className="flex flex-col items-center justify-center h-full">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                pathname === "/"
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FaRegUser
                className={`${
                  pathname === "/"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300"
                }`}
                size={22}
              />
            </div>
          </div>
        </Link>

        {/* Explore Button */}
        <Link href="/explore" className="flex-1">
          <div className="flex flex-col items-center justify-center h-full">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${
                pathname === "/explore"
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FiSearch
                className={`${
                  pathname === "/explore"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300"
                }`}
                size={22}
              />
            </div>
          </div>
        </Link>
      </div>
    </nav>
  );
}
