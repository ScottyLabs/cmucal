import { ReactNode } from "react";

interface TwoColumnLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
}

export default function TwoColumnLayout({ leftContent, rightContent }: TwoColumnLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_2fr] w-screen">
      {/* Left Section */}
      <aside className="overflow-y-auto">
        {leftContent}
      </aside>

      {/* Vertical Separator (md and up) */}
      <div className="hidden md:block w-px h-full bg-gray-300 dark:bg-gray-600" />

      {/* Right Section */}
      <main className="">
        {rightContent}
      </main>
    </div>
  );
}
