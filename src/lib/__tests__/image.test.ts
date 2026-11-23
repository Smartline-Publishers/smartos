import { describe, expect, it } from "vitest";
import { AVATAR_MAX_SIDE, fitWithin, LOGO_MAX_SIDE, prepareImageUpload } from "@/lib/image";

describe("fitWithin", () => {
  it("leaves small images untouched", () => {
    expect(fitWithin(400, 300, 512)).toEqual({ width: 400, height: 300 });
  });

  it("scales a wide photo down by its longest side", () => {
    expect(fitWithin(4000, 3000, 512)).toEqual({ width: 512, height: 384 });
  });

  it("scales a tall image down by its longest side", () => {
    expect(fitWithin(1000, 4000, 512)).toEqual({ width: 128, height: 512 });
  });

  it("keeps square aspect", () => {
    expect(fitWithin(2000, 2000, 1024)).toEqual({ width: 1024, height: 1024 });
  });

  it("exposes the display-size bounds", () => {
    expect(AVATAR_MAX_SIDE).toBe(512);
    expect(LOGO_MAX_SIDE).toBe(1024);
  });
});

describe("prepareImageUpload", () => {
  it("falls back to the original file when decoding is unavailable", async () => {
    const file = new File(["bytes"], "photo.jpg", { type: "image/jpeg" });
    const prepared = await prepareImageUpload(file, 512);
    expect(prepared.file).toBe(file);
    expect(prepared.compressed).toBe(false);
    expect(prepared.resultBytes).toBe(file.size);
  });

  it("does not alter non-image files itself (callers validate type)", async () => {
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    const prepared = await prepareImageUpload(file, 512);
    expect(prepared.file).toBe(file);
    expect(prepared.compressed).toBe(false);
  });
});
