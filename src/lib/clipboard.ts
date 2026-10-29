/** Copy text to the clipboard, falling back to execCommand on plain-http origins. */
export async function copyText(text: string): Promise<void> {
  // Clipboard API requires a secure context; fall back to execCommand so
  // plain-http local development still works.
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    if (!document.execCommand("copy")) throw new Error("copy failed");
  } finally {
    area.remove();
  }
}
