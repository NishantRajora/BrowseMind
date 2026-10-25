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

  // Preserve line breaks between block elements so questions and list items remain clearly separated
  const blockTags = ["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "br", "section", "article"];
  blockTags.forEach((tag) => {
    clone.querySelectorAll(tag).forEach((el) => {
      el.prepend(document.createTextNode("\n"));
    });
  });

  let text = (clone.textContent || "")
    .replace(/[ \t\r]+/g, " ")      // Collapse horizontal whitespace
    .replace(/\n\s*\n+/g, "\n\n")   // Preserve distinct paragraph/question boundaries
    .trim();

  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
  }
  return text;
}
