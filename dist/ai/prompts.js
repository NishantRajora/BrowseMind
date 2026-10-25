// src/ai/prompts.ts
function buildPrompt(selection, pageContent, settings) {
  let styleInstr = "";
  if (settings.responseStyle === "concise") {
    styleInstr = "Give a concise answer. Provide the answer in direct key points with no extra filler or pleasantries.";
  } else if (settings.responseStyle === "detailed") {
    styleInstr = "Provide a detailed answer with structured key points.";
  } else {
    styleInstr = "CRITICAL INSTRUCTION: Provide the answer STRICTLY as concise, direct key bullet points only.\n- Absolutely NO introductory phrases (e.g. do not say 'Here are the key points', 'Based on the text', etc.).\n- Absolutely NO conversational filler, pleasantries, greetings, or conclusions.\n- Provide ONLY the direct, informative key points.";
  }
  const pageSnippet = pageContent ? `
Relevant page context (max ${settings.maxText} chars):
${pageContent}` : "";
  if (selection && selection.trim().length > 0) {
    return `${styleInstr}

Selected text / Question:
"""${selection.trim()}"""
${pageSnippet}`;
  } else {
    return `${styleInstr}

Analyze the page context and extract the key points and summary:
${pageSnippet}`;
  }
}
export {
  buildPrompt
};
//# sourceMappingURL=prompts.js.map
