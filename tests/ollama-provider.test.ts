import { OllamaProvider } from "../src/ai/ollama";

// Mock fetch globally for these tests
declare const global: any;

global.fetch = jest.fn();

describe("OllamaProvider", () => {
  const mockUrl = "http://localhost:11434";
  const mockModel = "gpt-oss:120b";

  beforeEach(() => {
    // @ts-ignore
    fetch.mockReset();
  });

  it("generates answer", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "Test answer" })
    });
    const provider = new OllamaProvider({ url: mockUrl, model: mockModel });
    const answer = await provider.generate("Hello");
    expect(answer).toBe("Test answer");
    // @ts-ignore
    expect(fetch).toHaveBeenCalledWith(`${mockUrl}/api/generate`, expect.objectContaining({
      headers: { "Content-Type": "application/json" }
    }));
  });

  it("sends Authorization header when apiKey is configured", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "Auth answer" })
    });
    const provider = new OllamaProvider({ url: mockUrl, model: mockModel, apiKey: "ollama-secret-123" });
    const answer = await provider.generate("Hello");
    expect(answer).toBe("Auth answer");
    // @ts-ignore
    expect(fetch).toHaveBeenCalledWith(`${mockUrl}/api/generate`, expect.objectContaining({
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ollama-secret-123"
      }
    }));
  });

  it("sends Authorization header in testConnection when apiKey is provided", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] })
    });
    const provider = new OllamaProvider({ url: mockUrl, model: mockModel, apiKey: "ollama-secret-123" });
    await provider.testConnection();
    // @ts-ignore
    expect(fetch).toHaveBeenCalledWith(`${mockUrl}/api/tags`, expect.objectContaining({
      headers: {
        "Authorization": "Bearer ollama-secret-123"
      }
    }));
  });

  it("throws on non‑ok response", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Server error"
    });
    const provider = new OllamaProvider({ url: mockUrl, model: mockModel });
    await expect(provider.generate("Hello")).rejects.toThrow("Ollama request failed 500");
  });
});
