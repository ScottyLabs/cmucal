"use client"; // Required for event handlers in the App Router

// import Link from "next/link";

import React from "react";
import axios from "axios";
import Image from "next/image";
// import google_login_icon from "@/components/icons/google_login_icons/svg/light/web_light_sq_SI.svg"; // Ensure the correct import path

import { SignInButton } from "@clerk/nextjs";

axios.defaults.withCredentials = true;

const Login: React.FC = () => {

  return (
    <SignInButton >
         <div className="cursor-pointer">
            <img
            src="/images/google_login_icons/svg/light/web_light_sq_SI.svg"
            alt="Sign in with Google"
            className="block dark:hidden w-100 h-100"
            />
            {/* Dark Mode Icon */}
            <img
            src="/images/google_login_icons/svg/dark/web_dark_sq_SI.svg"
            alt="Sign in with Google (dark)"
            className="hidden dark:block w-100 h-100"
            />
        </div>
    </SignInButton>
  );
};

const About: React.FC = () => {
  return (
    <div className="bg-gray-200 p-6 rounded-lg shadow-md w-1/2 dark:bg-gray-600 dark:text-gray-300">
      <h3 className="text-xl font-medium mb-4 font-serif font-source-serif-pro">About</h3>
      <p>
        CMUCal offers convenient search for academic resources and events on campus, with the option of adding
        events to your personal Google Calendar.
      </p>
    </div>
  );
};

const Video: React.FC = () => {
  return (
    <div className="border-gray p-6 rounded-lg shadow-md w-1/2 dark:bg-gray-600 dark:text-gray-300 dark: border-gray-200">
      <p className="text-xl font-medium mb-4 font-serif font-source-serif-pro">Video Tutorial</p>
    </div>
  );
};

export default function Welcome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="h-3/5 bg-lightgrey text-center">
        <h1 className="text-black font-serif font-source-serif-pro text-[76px] font-normal leading-normal pt-28 dark:text-gray-300">
          Welcome to CMUCal
        </h1>
        <h2 className="text-black font-serif font-source-serif-pro text-[35px] font-normal leading-normal mb-6 dark:text-gray-400">
          the all-in-one CMU resources platform
        </h2>
        <div className="flex justify-center gap-8 pb-14">
          {/* <SignInButton /> */}
            <Login />
        </div>
      </div>

      <div className="flex justify-around px-10 py-6 gap-8 pb-20">
        <About />
        <Video />
      </div>
    </main>
  );
}
