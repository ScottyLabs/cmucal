import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ManagerPage from "../app/manager/page";
import { fetchRole } from "../app/utils/authService";
import useRoleRedirect from "../app/utils/redirect";

// IMPORTANT: mocks
vi.mock("../app/utils/authService");
vi.mock("../app/utils/redirect");
vi.mock("../app/components/TwoColumnLayout", () => ({
  default: ({ leftContent, rightContent }: any) => (
    <div>
      <div data-testid="left">{leftContent}</div>
      <div data-testid="right">{rightContent}</div>
    </div>
  ),
}));

describe("ManagerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    render(<ManagerPage />);
    expect(
      screen.getByText(/finding user role/i)
    ).toBeInTheDocument();
  });

  it("renders manager layout when role is manager", async () => {
    (fetchRole as any).mockResolvedValue("manager");

    render(<ManagerPage />);

    await waitFor(() => {
      const matches = screen.getAllByText(/manager/i);
        expect(matches.length).toBeGreaterThan(0);
    });

    // ensure redirect hook was called correctly
    expect(useRoleRedirect).toHaveBeenCalledWith("manager", "manager");
  });

  it("redirects when user is admin", async () => {
    (fetchRole as any).mockResolvedValue("admin");

    render(<ManagerPage />);

    await waitFor(() => {
      expect(useRoleRedirect).toHaveBeenCalledWith("manager", "admin");
    });
  });

  it("redirects when user is user", async () => {
    (fetchRole as any).mockResolvedValue("user");

    render(<ManagerPage />);

    await waitFor(() => {
      expect(useRoleRedirect).toHaveBeenCalledWith("manager", "user");
    });
  });
});
