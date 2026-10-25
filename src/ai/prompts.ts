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
    return `${styleInstr}

IMPORTANT MULTIPLE QUESTIONS RESOLUTION:
- The user selected ONE specific question or problem below.
- FOCUS 100% EXCLUSIVELY on answering THIS EXACT SELECTED QUESTION.
- Do NOT answer or get confused by any other questions that appear elsewhere on the page.
- If it is a multiple-choice question, immediately state the correct option letter and answer, followed by brief key points.

Selected text / Question:
"""${selection.trim()}"""
${pageSnippet}`;
  } else {
    return `${styleInstr}

IMPORTANT MULTIPLE QUESTIONS RESOLUTION:
- If the page contains multiple questions or problems:
  1. DO NOT get confused by multiple questions.
  2. Answer each question individually in order (e.g., "1. [Direct Answer / Option]", "2. [Direct Answer / Option]").
  3. For multiple-choice questions, clearly specify the correct option letter and text.
  4. Keep every answer strictly concise in key points with zero conversational filler.

Analyze the page context and extract the key points and summary:
${pageSnippet}`;
  }
}
