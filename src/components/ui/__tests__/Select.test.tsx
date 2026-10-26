import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Select } from "@/components/ui/Select";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

describe("Select", () => {
  it("opens a styled listbox and reports the chosen option", () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Status"
        value="draft"
        onChange={onChange}
        options={STATUS_OPTIONS}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: /Status/ });
    expect(trigger.textContent).toContain("Draft");

    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeTruthy();

    const published = screen.getByRole("option", { name: "Published" });
    expect(published.getAttribute("aria-selected")).toBe("false");
    fireEvent.click(published);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as { target: { value: string } }).target.value).toBe(
      "published",
    );
    // Choosing an option dismisses the popup.
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("supports keyboard selection and Escape", () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Status"
        value="draft"
        onChange={onChange}
        options={STATUS_OPTIONS}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: /Status/ });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeTruthy();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("listbox")).toBeNull();

    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("wires validation state and hint text", () => {
    render(
      <Select
        label="Warehouse"
        hint="Stock is posted here."
        error="Choose a warehouse"
        options={[{ value: "", label: "Choose" }]}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: /Warehouse/ });
    const alert = screen.getByRole("alert");

    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(trigger.getAttribute("aria-describedby")).toBe(alert.id);
    expect(alert.textContent).toBe("Choose a warehouse");
  });
});
