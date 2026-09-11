import { getSettings, setSettings } from "../src/shared/storage";

test("defaults are loaded", async () => {
  const settings = await getSettings();
  expect(settings.enabled).toBe(true);
  expect(settings.provider).toBe("ollama");
});

test("setSettings saves and persists", async () => {
  await setSettings({ enabled: false, provider: "api" });
  const settings = await getSettings();
  expect(settings.enabled).toBe(false);
  expect(settings.provider).toBe("api");
});
