import { ExtensionSettings } from "../shared/types";

export function buildPrompt(selection: string, pageContent: string, settings: ExtensionSettings): string {
  let styleInstr = "";
  if (settings.responseStyle === "concise") {
    styleInstr = "Give a concise answer. Provide the answer in direct key points with no extra filler or pleasantries.";
  } else if (settings.responseStyle === "detailed") {
    styleInstr = "Provide a detailed answer with structured key points.";
  } else {
    // "keypoints" (default) or "normal"
    styleInstr = "CRITICAL INSTRUCTION: Provide the answer STRICTLY as concise, direct key bullet points only.\n- Absolutely NO introductory phrases (e.g. do not say 'Here are the key points', 'Based on the text', etc.).\n- Absolutely NO conversational filler, pleasantries, greetings, or conclusions.\n- Provide ONLY the direct, informative key points.";
  }

  const pageSnippet = pageContent
    ? `\nRelevant page context (max ${settings.maxText} chars):\n${pageContent}`
    : "";

  if (selection && selection.trim().length > 0) {
    return `${styleInstr}\n\nSelected text / Question:\n"""${selection.trim()}"""\n${pageSnippet}`;
  } else {
    return `${styleInstr}\n\nAnalyze the page context and extract the key points and summary:\n${pageSnippet}`;
  }
}
