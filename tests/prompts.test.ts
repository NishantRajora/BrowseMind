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

test("buildPrompt enforces key points only and handles empty selection", () => {
  const settings: ExtensionSettings = {
    enabled: true,
    provider: "ollama",
    ollamaUrl: "https://ollama.com",
    ollamaModel: "gemma4:31b",
    apiUrl: "",
    apiKey: "",
    apiModel: "",
    theme: "system",
    responseStyle: "keypoints",
    maxText: 30000,
    debugMode: false
  };
  const prompt = buildPrompt("", "Full page text excerpt here", settings);
  expect(prompt).toContain("CRITICAL INSTRUCTION");
  expect(prompt).toContain("key bullet points only");
  expect(prompt).toContain("Analyze the page context");
});
