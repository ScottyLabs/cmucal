// src/__tests__/page.test.tsx
import { describe, it, expect, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import Home from "../app/page";
import { Providers } from "./test-utils";

vi.mock("../app/components/Calendar", () => ({
  default: () => <div data-testid="calendar-mock" />,
}));

vi.mock("../app/utils/api/schedules", () => ({
  getSchedule: vi.fn().mockResolvedValue({
    courses: [],
    clubs: [],
  }),
  removeCategoryFromSchedule: vi.fn(),
}));

describe("Home page", () => {
  it("renders loading state initially", () => {
    render(
      <Providers>
        <Home />
      </Providers>,
    );
    expect(screen.getByText(/loading your schedule/i)).toBeInTheDocument();
  });
});
