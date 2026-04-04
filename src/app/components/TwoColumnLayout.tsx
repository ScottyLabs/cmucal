"use client";

import { ReactNode, useRef, useState, useEffect, useCallback } from "react";

const MIN_WIDTH = 240;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

interface TwoColumnLayoutProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
}

export default function TwoColumnLayout({ leftContent, rightContent }: TwoColumnLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = sidebarWidth;
      e.preventDefault();
    },
    [sidebarWidth],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className="flex w-screen h-full">
      {/* Left Section */}
      <aside
        style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        className="overflow-y-auto flex-shrink-0"
      >
        {leftContent}
      </aside>

      {/* Draggable Divider */}
      <div
        className="relative w-2 flex-shrink-0 cursor-col-resize group"
        onMouseDown={onMouseDown}
      >
        <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* Right Section */}
      <main className="flex-1 min-w-0">
        {rightContent}
      </main>
    </div>
  );
}
