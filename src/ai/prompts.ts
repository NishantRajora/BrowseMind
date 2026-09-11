import { ExtensionSettings } from "../shared/types";

export function buildPrompt(selection: string, pageContent: string, settings: ExtensionSettings): string {
  const styleInstr = settings.responseStyle === "concise"
    ? "Give a concise answer."
    : settings.responseStyle === "detailed"
    ? "Provide a detailed answer."
    : "";

  const pageSnippet = pageContent
    ? `\nRelevant page excerpt (max ${settings.maxText} chars):\n${pageContent}`
    : "";

  return `${styleInstr}
User selected text:
"""${selection}"""
${pageSnippet}`;
}
