/**
 * Client-side image preprocessing for uploads (avatars, logos).
 *
 * Photos from phones/cameras are typically 3000–4000px yet avatars render
 * at ~56px and logos at ~40px. Downscaling to a display-size bound cuts the
 * byte size drastically (often 20–50x) while the kept pixels stay exact:
 * the output is encoded as PNG (lossless, transparency-preserving), never
 * as lossy JPEG/WebP, so no compression artifacts are introduced.
 *
 * Anything the browser cannot decode/draw falls back to the original file
 * untouched — an upload that works, just without the size win.
 */

export interface PreparedImage {
  file: File;
  /** True when the file was downscaled/re-encoded, false on fallback. */
  compressed: boolean;
  originalBytes: number;
  resultBytes: number;
}

export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide || longest <= 0) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function decode(
  file: File,
): Promise<{ bitmap: ImageBitmap; width: number; height: number } | null> {
  if (typeof createImageBitmap !== "function") return Promise.resolve(null);
  return createImageBitmap(file)
    .then((bitmap) => ({ bitmap, width: bitmap.width, height: bitmap.height }))
    .catch(() => null);
}

function drawScaled(
  bitmap: ImageBitmap,
  width: number,
  height: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        resolve(null);
        return;
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      // convertToBlob is newer than this project's TS DOM lib: probe structurally.
      const modernCanvas = canvas as HTMLCanvasElement & {
        convertToBlob?: (options?: { type?: string }) => Promise<Blob | null>;
      };
      if (typeof modernCanvas.convertToBlob === "function") {
        modernCanvas.convertToBlob({ type: "image/png" }).then(
          (blob) => resolve(blob),
          () => resolve(null),
        );
      } else {
        canvas.toBlob(
          (blob) => resolve(blob),
          "image/png",
        );
      }
    } catch {
      try {
        bitmap.close();
      } catch {
        // Ignore cleanup failures.
      }
      resolve(null);
    }
  });
}

function withPngName(originalName: string): string {
  const base = originalName.replace(/\.[a-z0-9]+$/i, "").trim() || "image";
  return `${base}.png`;
}

export async function prepareImageUpload(file: File, maxSide: number): Promise<PreparedImage> {
  const fallback: PreparedImage = {
    file,
    compressed: false,
    originalBytes: file.size,
    resultBytes: file.size,
  };
  const decoded = await decode(file);
  if (!decoded) return fallback;
  const target = fitWithin(decoded.width, decoded.height, maxSide);
  // Already small enough and already PNG: nothing to gain, skip re-encode
  // so identical bytes go out.
  if (
    target.width === decoded.width &&
    target.height === decoded.height &&
    file.type === "image/png"
  ) {
    decoded.bitmap.close();
    return fallback;
  }
  const blob = await drawScaled(decoded.bitmap, target.width, target.height);
  if (!blob || blob.size === 0 || blob.size >= file.size) {
    // Re-encoding didn't help (e.g. tiny icon): send the original.
    return fallback;
  }
  return {
    file: new File([blob], withPngName(file.name), { type: "image/png" }),
    compressed: true,
    originalBytes: file.size,
    resultBytes: blob.size,
  };
}

/** Display-size bounds: avatars render at ~56px, logos at ~40px. */
export const AVATAR_MAX_SIDE = 512;
export const LOGO_MAX_SIDE = 1024;
