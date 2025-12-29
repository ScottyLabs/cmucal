// vitest.setup.tsx
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("@clerk/nextjs", () => {
  return {
    useAuth: () => ({
      isLoaded: true,
      userId: "test-user-id",
      getToken: vi.fn().mockResolvedValue("fake-token"),
    }),

    useUser: () => ({
      user: {
        id: "test-user-id",
        firstName: "Test",
        lastName: "User",
        imageUrl: "",
        publicMetadata: { role: "admin" },
      },
      isLoaded: true,
    }),

    SignedIn: ({ children }: any) => children,
    SignedOut: () => null,
    UserButton: () => <div data-testid="user-button" />,

    auth: () => ({ userId: "test-user-id" }),
    clerkClient: () => ({
      users: {
        getUser: vi.fn(),
      },
    }),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));