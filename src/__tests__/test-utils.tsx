// src/__tests__/test-utils.tsx
import { EventStateProvider } from "../context/EventStateContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <EventStateProvider>{children}</EventStateProvider>;
}
