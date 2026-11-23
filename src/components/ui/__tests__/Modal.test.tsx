import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.style.overflow = "";
});

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal open={false} title="New book" onClose={() => undefined}>
        <p>body</p>
      </Modal>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders title, description, and content with dialog semantics", () => {
    render(
      <Modal open title="New book" description="Add a title." onClose={() => undefined}>
        <p>body</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("New book")).toBeTruthy();
    expect(screen.getByText("Add a title.")).toBeTruthy();
    expect(screen.getByText("body")).toBeTruthy();
  });

  it("sizes the dialog per the size prop", () => {
    const { rerender } = render(
      <Modal open title="A" onClose={() => undefined} size="sm">
        <p>body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog").className).toContain("w-[min(480px,100%)]");
    rerender(
      <Modal open title="A" onClose={() => undefined} size="lg">
        <p>body</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog").className).toContain("w-[min(900px,100%)]");
  });

  it("locks body scroll while open and restores it on close", () => {
    const { unmount } = render(
      <Modal open title="A" onClose={() => undefined}>
        <p>body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes via the X button, backdrop click, and Escape", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open title="A" onClose={onClose}>
        <p>body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector('[role="presentation"]') as Element);
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(
      <Modal open title="A" onClose={onClose}>
        <p>other</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("ignores backdrop clicks when disabled", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="A" onClose={onClose} disableBackdropClose>
        <p>body</p>
      </Modal>,
    );
    fireEvent.click(document.querySelector('[role="presentation"]') as Element);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("asks for confirmation before closing a dirty form", () => {
    const onClose = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <Modal open title="A" onClose={onClose} isDirty>
        <p>body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes a clean form without confirmation", () => {
    const onClose = vi.fn();
    const confirm = vi.spyOn(window, "confirm");
    render(
      <Modal open title="A" onClose={onClose}>
        <p>body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
