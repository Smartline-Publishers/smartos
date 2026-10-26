import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "@/components/ui/Select";

describe("Select", () => {
  it("renders labelled options with the custom chevron styling", () => {
    render(
      <Select
        label="Status"
        defaultValue="draft"
        options={[
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
        ]}
      />,
    );

    const select = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(select.value).toBe("draft");
    expect(screen.getByRole("option", { name: "Published" })).toBeTruthy();
    // Native arrows are replaced by the shared caret so the control matches
    // Input and Button on mobile.
    expect(select.className).toContain("appearance-none");
    expect(document.querySelector("svg")).toBeTruthy();
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

    const select = screen.getByLabelText("Warehouse");
    expect(select.getAttribute("aria-invalid")).toBe("true");
    expect(select.getAttribute("aria-describedby")).toBe("select-warehouse-hint");
    expect(screen.getByRole("alert").textContent).toBe("Choose a warehouse");
  });
});
