import { getSettings } from "../shared/storage";
import { OllamaProvider } from "./ollama";
import { APIProvider } from "./api-client";
import { AIProvider } from "../shared/types";

export async function getProvider(): Promise<AIProvider> {
  const settings = await getSettings();
  if (settings.provider === "ollama") {
    return new OllamaProvider({ url: settings.ollamaUrl, model: settings.ollamaModel });
  } else {
    return new APIProvider({ baseUrl: settings.apiUrl, apiKey: settings.apiKey, model: settings.apiModel });
  }
}
