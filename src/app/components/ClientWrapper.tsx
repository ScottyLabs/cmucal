"use client";

import ThemeProvider from "@components/ThemeProvider";
import Navbar from "@components/Navbar";
import SignedOutNav from "@components/SignedOutNav";
import Welcome from "@components/Welcome";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { GcalEventsContext } from "../../context/GCalEventsContext";
import { EventStateProvider } from "~/context/EventStateContext";
import ModalRender from "@components/ModalRender";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { sendUserToBackend } from "~/app/utils/authService";


export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [gcalEvents, setGcalEvents] = useState<any[]>([]);
  const { user, isSignedIn, isLoaded } = useUser();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !hasSynced) {
      sendUserToBackend({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
      setHasSynced(true);
    }
  }, [isLoaded, isSignedIn, user, hasSynced]);

  return (
    <GcalEventsContext.Provider value={{ gcalEvents, setGcalEvents }}>
      <EventStateProvider>
        <ThemeProvider>
          <SignedIn>
            <Navbar UserButton={<UserButton />} />
          </SignedIn>
          <SignedOut>
            <SignedOutNav />
          </SignedOut>

          <main>
            <SignedIn>
              <ModalRender/>
              {children}
            </SignedIn>
            <SignedOut>
              <div className="flex justify-center items-center h-[90vh] dark:bg-gray-700">
                <Welcome />
              </div>
            </SignedOut>
          </main>
        </ThemeProvider>
      </EventStateProvider>
    </GcalEventsContext.Provider>
  );
}
