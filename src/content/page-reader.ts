import { getSettings } from "../shared/storage";

/**
 * Returns a cleaned, readable version of the page's text content.
 * - Removes scripts, styles, navbars, footers, sidebars, ads, hidden elements.
 * - Truncates to the maxText length defined in settings (default 30000).
 */
export async function extractPageContent(): Promise<string> {
  const settings = await getSettings();
  const maxChars = settings.maxText ?? 30000;

  // Clone body to avoid mutating the live DOM.
  const clone = document.body.cloneNode(true) as HTMLElement;

  // Remove unwanted selectors.
  const selectors = [
    "script",
    "style",
    "noscript",
    "header",
    "nav",
    "footer",
    "aside",
    "svg",
    "canvas",
    ".ad",
    ".ads",
    ".advertisement",
    ".cookie",
    ".popup",
    ".modal"
  ];
  selectors.forEach((sel) => {
    const elems = clone.querySelectorAll(sel);
    elems.forEach((el) => el.remove());
  });

  // Remove elements hidden via CSS.
  const allElems = clone.querySelectorAll<HTMLElement>("*");
  allElems.forEach((el) => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      el.remove();
    }
  });

  let text = (clone.textContent || "").trim().replace(/\s+/g, " ");
  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
  }
  return text;
}
