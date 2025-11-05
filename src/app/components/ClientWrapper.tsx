import ThemeProvider from "@components/ThemeProvider";
import Navbar from "@components/Navbar";
import SignedOutNav from "@components/SignedOutNav";
import Welcome from "@components/Welcome";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { GcalEventsProvider } from "../../context/GCalEventsContext";
import { EventStateProvider } from "~/context/EventStateContext";
import ModalRender from "@components/ModalRender";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { loginWithClerk } from "../utils/api/users";

export default async function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const client = await clerkClient()

  if (userId) {
    const user = await client.users.getUser(userId)
    try {
      await loginWithClerk(
        user.id,
        user.emailAddresses[0]?.emailAddress,
        user.firstName,
        user.lastName
      );
    } catch (err) {
      console.error("Error during Clerk login:", err);
    }
  }
  
  useEffect(() => {
    if (window.location.hash.includes("__clerk_db_jwt")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);
  
  return (
    <GcalEventsProvider>
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
    </GcalEventsProvider>
  );
}