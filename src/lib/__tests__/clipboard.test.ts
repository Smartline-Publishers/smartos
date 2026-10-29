import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "@/lib/clipboard";

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
  vi.restoreAllMocks();
});

describe("copyText", () => {
  it("writes to the clipboard when the Clipboard API is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await copyText("https://example.test/invite/accept?token=abc");

    expect(writeText).toHaveBeenCalledWith(
      "https://example.test/invite/accept?token=abc",
    );
  });

  it("falls back to execCommand when the Clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    await copyText("fallback-copy");

    expect(execCommand).toHaveBeenCalledWith("copy");
  });
});
