"use client";
import React, { createContext, useContext, useState } from "react";

type GcalEventsContextType = {
  gcalEvents: any[];
  setGcalEvents: React.Dispatch<React.SetStateAction<any[]>>;
};

const GcalEventsContext = createContext<GcalEventsContextType | undefined>(undefined);

export const GcalEventsProvider = ({ children }: { children: React.ReactNode }) => {
  const [gcalEvents, setGcalEvents] = useState<any[]>([]);
  return (
    <GcalEventsContext.Provider value={{ gcalEvents, setGcalEvents }}>
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