import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/Input";

describe("Input password visibility", () => {
  it("starts masked and toggles without submitting a form", () => {
    render(<Input label="Password" type="password" defaultValue="secret" />);

    const input = screen.getByLabelText(/Password/) as HTMLInputElement;
    expect(input.type).toBe("password");

    const show = screen.getByRole("button", { name: "Show password" });
    expect(show.getAttribute("type")).toBe("button");
    fireEvent.click(show);

    expect(input.type).toBe("text");
    const hide = screen.getByRole("button", { name: "Hide password" });
    expect(hide.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(hide);
    expect(input.type).toBe("password");
  });

  it("does not add a toggle to non-password inputs", () => {
    render(<Input label="Email" type="email" />);
    expect(screen.queryByRole("button", { name: /password/i })).toBeNull();
  });
});
