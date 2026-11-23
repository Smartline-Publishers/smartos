import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import type { ActivityItem } from "@/types/dashboard";

const ITEMS: ActivityItem[] = [
  {
    id: "1",
    actor: "Vera Viewer",
    action: "created a book",
    createdAt: "2026-10-26T12:00:00Z",
  },
];

describe("ActivityFeed", () => {
  it("presents a feed with no scope as the caller's own activity", () => {
    render(<ActivityFeed items={ITEMS} />);

    expect(screen.getByRole("heading", { name: "Your recent activity" })).toBeTruthy();
    expect(screen.getByText("Vera Viewer")).toBeTruthy();
    expect(screen.getByText(/created a book/)).toBeTruthy();
  });

  it("labels an organisation-wide feed only when the backend says so", () => {
    render(<ActivityFeed items={ITEMS} scope="ORGANIZATION" />);

    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Your recent activity" })).toBeNull();
  });

  it("defers the heading to a surrounding card without changing the scope", () => {
    render(<ActivityFeed items={ITEMS} showHeading={false} />);

    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByRole("region", { name: "Your recent activity" })).toBeTruthy();
  });

  it("keeps the empty state personal for the default scope", () => {
    render(<ActivityFeed items={[]} />);

    expect(screen.getByText("Actions you take will appear here.")).toBeTruthy();
  });

  it("describes the organisation empty state for administrators", () => {
    render(<ActivityFeed items={[]} scope="ORGANIZATION" />);

    expect(screen.getByText("Actions across your organisation will appear here.")).toBeTruthy();
  });
});
