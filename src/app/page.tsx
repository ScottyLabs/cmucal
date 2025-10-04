import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  // redirect to profile if signed in, handled by middleware
  const { userId } = await auth();
  if (userId) {
    redirect("/profile"); 
  }

  return (
    <div className="flex justify-center items-center h-[80vh]">
      {/* Optional: a signed-out landing page or leave empty */}
      <p>Welcome! If you have not signed in, please sign in to continue. Otherwise, click on the profile icon (top left) to continue.</p>
    </div>
  );
}