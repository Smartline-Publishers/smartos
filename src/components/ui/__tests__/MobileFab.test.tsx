import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Plus } from "@phosphor-icons/react";
import { MobileFab } from "@/components/ui/MobileFab";

describe("MobileFab", () => {
  it("renders a single primary action as an extended pill", () => {
    const onClick = vi.fn();
    render(<MobileFab label="New book" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "New book" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("collapses multiple actions into a speed dial", () => {
    const createWarehouse = vi.fn();
    const recordMovement = vi.fn();

    render(
      <MobileFab
        menuLabel="Inventory actions"
        actions={[
          { label: "New warehouse", icon: Plus, onClick: createWarehouse },
          { label: "Record movement", icon: Plus, onClick: recordMovement },
        ]}
      />,
    );

    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Inventory actions" }));

    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "New warehouse" }));

    expect(createWarehouse).toHaveBeenCalledTimes(1);
    expect(recordMovement).not.toHaveBeenCalled();
    // Choosing an action dismisses the stack so the modal is unobstructed.
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes the speed dial with Escape", () => {
    render(
      <MobileFab
        menuLabel="Finance actions"
        actions={[
          { label: "Record transaction", icon: Plus, onClick: vi.fn() },
          { label: "New budget", icon: Plus, onClick: vi.fn() },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Finance actions" }));
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
