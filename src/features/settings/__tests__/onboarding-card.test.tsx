import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingChecklistCard } from "@/features/settings/OnboardingChecklistCard";
import type { OnboardingChecklist } from "@/features/settings/api";

const refresh = async () => {};

function mockOnboarding(items: OnboardingChecklist["items"], overrides: Partial<OnboardingChecklist> = {}) {
  const required = items.filter((i) => !i.optional);
  const value: OnboardingChecklist = {
    items,
    complete: required.every((i) => i.completed),
    dismissed: false,
    requiredCompleted: required.filter((i) => i.completed).length,
    requiredTotal: required.length,
    optionalTotal: items.length - required.length,
    ...overrides,
  };
  return value;
}

// The mock reads `current` lazily so each test can set it before rendering.
// `vi.hoisted` lifts the holder above the hoisted mock factory.
const state = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/hooks/use-org", () => ({
  useOrg: () => ({ onboarding: state.current, refresh: async () => {} }),
}));

vi.mock("@/features/settings/api", () => ({
  updateOnboarding: vi.fn(),
}));

describe("onboarding checklist card", () => {
  it("renders each label separately from its status", async () => {
    state.current = mockOnboarding([
      {
        key: "profile",
        label: "Set up your profile",
        description: "Add a picture.",
        completed: false,
        optional: false,
        href: "/settings?section=profile",
      },
      {
        key: "logo",
        label: "Add an organization logo",
        description: "Upload a logo.",
        completed: true,
        optional: true,
        href: "/settings?section=organization",
      },
    ]);
    render(<OnboardingChecklistCard />);

    // The label must not be concatenated with the "Done" status.
    const label = screen.getByText("Add an organization logo");
    expect(label.textContent).toBe("Add an organization logo");
    expect(label.textContent).not.toContain("Done");
  });

  it("counts only required steps toward progress", async () => {
    state.current = mockOnboarding([
      {
        key: "profile",
        label: "Set up your profile",
        description: "Add a picture.",
        completed: true,
        optional: false,
        href: "/settings?section=profile",
      },
      {
        key: "two-factor",
        label: "Set up two-factor authentication",
        description: "Protect your account.",
        completed: false,
        optional: false,
        href: "/settings?section=security",
      },
      {
        key: "theme",
        label: "Configure the organization theme",
        description: "Brand colors.",
        completed: false,
        optional: true,
        href: "/settings?section=organization",
      },
    ]);
    render(<OnboardingChecklistCard />);

    // Two required steps, one done: the optional step must not dilute it.
    expect(screen.getByText("1 of 2 required complete")).toBeTruthy();
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("1");
    expect(bar.getAttribute("aria-valuemax")).toBe("2");
  });

  it("points Complete Setup at the first outstanding required step", async () => {
    state.current = mockOnboarding([
      {
        key: "profile",
        label: "Set up your profile",
        description: "Add a picture.",
        completed: false,
        optional: false,
        href: "/settings?section=profile",
      },
      {
        key: "two-factor",
        label: "Set up two-factor authentication",
        description: "Protect your account.",
        completed: false,
        optional: false,
        href: "/settings?section=security",
      },
    ]);
    render(<OnboardingChecklistCard />);

    const cta = screen.getByRole("link", { name: "Complete Setup" });
    expect(cta.getAttribute("href")).toBe("/settings?section=profile");
  });

  it("marks optional steps distinctly and explains they do not block completion", async () => {
    state.current = mockOnboarding([
      {
        key: "profile",
        label: "Set up your profile",
        description: "Add a picture.",
        completed: false,
        optional: false,
        href: "/settings?section=profile",
      },
      {
        key: "theme",
        label: "Configure the organization theme",
        description: "Brand colors.",
        completed: false,
        optional: true,
        href: "/settings?section=organization",
      },
    ]);
    render(<OnboardingChecklistCard />);

    expect(screen.getByText("Optional")).toBeTruthy();
    expect(screen.getByText(/do not affect completion/)).toBeTruthy();
  });

  it("hides itself once every required step is done", async () => {
    state.current = mockOnboarding([
      {
        key: "profile",
        label: "Set up your profile",
        description: "Add a picture.",
        completed: true,
        optional: false,
        href: "/settings?section=profile",
      },
      {
        key: "theme",
        label: "Configure the organization theme",
        description: "Brand colors.",
        completed: false,
        optional: true,
        href: "/settings?section=organization",
      },
    ]);
    render(<OnboardingChecklistCard />);

    // An outstanding optional task must not keep the card on screen.
    expect(screen.queryByText("Getting started")).toBeNull();
  });
});
