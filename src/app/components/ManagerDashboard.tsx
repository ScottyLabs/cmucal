"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function ManagerContent() {
  const { user } = useUser();

  return (
  <div>
    <div className="p-4">Manager Dashboard Content</div>
  </div>
  );
}