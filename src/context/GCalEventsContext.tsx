"use client";
import React, { createContext, useContext, useState } from "react";

type GcalEventsContextType = {
  gcalEvents: any[];
  setGcalEvents: React.Dispatch<React.SetStateAction<any[]>>;
  isGoogleConnected: boolean;
  setIsGoogleConnected: React.Dispatch<React.SetStateAction<boolean>>;
  cmuCalendarId: string | null;
  setCmuCalendarId: React.Dispatch<React.SetStateAction<string | null>>;
};

const GcalEventsContext = createContext<GcalEventsContextType | undefined>(undefined);

export const GcalEventsProvider = ({ children }: { children: React.ReactNode }) => {
  const [gcalEvents, setGcalEvents] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [cmuCalendarId, setCmuCalendarId] = useState<string | null>(null);
  
  return (
    <GcalEventsContext.Provider value={{ 
      gcalEvents, 
      setGcalEvents,
      isGoogleConnected,
      setIsGoogleConnected,
      cmuCalendarId,
      setCmuCalendarId
    }}>
      {children}
    </GcalEventsContext.Provider>
  );
};

export const useGcalEvents = () => {
  const context = useContext(GcalEventsContext);
  if (!context) throw new Error("useGcalEvents must be used within a GcalEventsProvider");
  return context;
};

export default GcalEventsContext;