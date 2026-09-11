// src/ai/prompts.ts
function buildPrompt(selection, pageContent, settings) {
  const styleInstr = settings.responseStyle === "concise" ? "Give a concise answer." : settings.responseStyle === "detailed" ? "Provide a detailed answer." : "";
  const pageSnippet = pageContent ? `
Relevant page excerpt (max ${settings.maxText} chars):
${pageContent}` : "";
  return `${styleInstr}
User selected text:
"""${selection}"""
${pageSnippet}`;
}
export {
  buildPrompt
};
//# sourceMappingURL=prompts.js.map
