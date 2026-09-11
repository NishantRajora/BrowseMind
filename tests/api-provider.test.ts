import { APIProvider } from "../src/ai/api-client";

declare const global: any;

global.fetch = jest.fn();

describe("APIProvider", () => {
  const mockBase = "https://api.example.com";
  const mockKey = "secret-key";
  const mockModel = "gpt-4";

  beforeEach(() => {
    // @ts-ignore
    fetch.mockReset();
  });

  it("generates answer", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "API answer" } }] })
    });
    const provider = new APIProvider({ baseUrl: mockBase, apiKey: mockKey, model: mockModel });
    const answer = await provider.generate("Hello");
    expect(answer).toBe("API answer");
    // Verify Authorization header is present (but not checking value)
    // @ts-ignore
    expect(fetch).toHaveBeenCalledWith(`${mockBase}/chat/completions`, expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: expect.stringContaining("Bearer") })
    }));
  });

  it("throws on error response", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized"
    });
    const provider = new APIProvider({ baseUrl: mockBase, apiKey: mockKey, model: mockModel });
    await expect(provider.generate("Hello")).rejects.toThrow("API request failed 401");
  });
});
