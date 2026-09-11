import { getSettings } from "../shared/storage";
import { buildPrompt } from "./prompts";
import { getProvider } from "./provider-manager";
import { DebugInfo } from "../shared/types";

export async function askAI(selection: string, pageContent: string): Promise<{ answer?: string; error?: string; debug?: DebugInfo }> {
  const settings = await getSettings();
  const provider = await getProvider();
  const prompt = buildPrompt(selection, pageContent, settings);
  const start = Date.now();
  try {
    const answer = await provider.generate(prompt);
    const duration = Date.now() - start;
    let debug: DebugInfo | undefined;
    if (settings.debugMode) {
      const endpoint = settings.provider === "ollama"
        ? `${settings.ollamaUrl.replace(/\/+$/, "")}/api/generate`
        : `${settings.apiUrl.replace(/\/+$/, "")}/chat/completions`;
      const model = settings.provider === "ollama" ? settings.ollamaModel : settings.apiModel;
      debug = {
        provider: settings.provider,
        endpoint,
        model,
        request: { prompt },
        status: 200,
        response: { answer },
        durationMs: duration
      };
    }
    return { answer, debug };
  } catch (err: any) {
    const duration = Date.now() - start;
    let debug: DebugInfo | undefined;
    if (settings.debugMode) {
      const endpoint = settings.provider === "ollama"
        ? `${settings.ollamaUrl.replace(/\/+$/, "")}/api/generate`
        : `${settings.apiUrl.replace(/\/+$/, "")}/chat/completions`;
      const model = settings.provider === "ollama" ? settings.ollamaModel : settings.apiModel;
      debug = {
        provider: settings.provider,
        endpoint,
        model,
        request: { prompt },
        status: 0,
        response: null,
        durationMs: duration,
        error: err?.message ?? String(err)
      };
    }
    return { error: err?.message ?? String(err), debug };
  }
}
