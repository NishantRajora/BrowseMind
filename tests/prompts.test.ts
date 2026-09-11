import { buildPrompt } from "../src/ai/prompts";
import { ExtensionSettings } from "../src/shared/types";

test("buildPrompt includes style instruction", () => {
  const settings: ExtensionSettings = {
    enabled: true,
    provider: "ollama",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "gpt-oss:120b",
    apiUrl: "",
    apiKey: "",
    apiModel: "",
    theme: "system",
    responseStyle: "concise",
    maxText: 30000,
    debugMode: false
  };
  const prompt = buildPrompt("selected text", "page content", settings);
  expect(prompt).toContain("Give a concise answer.");
});
