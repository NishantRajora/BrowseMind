/**
 * BrowseMind AI Connection Tester
 * Reads credentials directly from .env and verifies connectivity to:
 * 1. Ollama (Local or Cloud/Proxy with API Key)
 * 2. OpenAI-compatible API
 *
 * Run with: node test-env.js  OR  npm run test:ai
 */

const fs = require("fs");
const path = require("path");

// Simple .env parser without external dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    console.warn("⚠️  No .env file found at", envPath);
    return {};
  }
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

async function testOllama(env) {
  const url = (env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
  const model = env.OLLAMA_MODEL || "gpt-oss:20b-cloud";
  const apiKey = env.OLLAMA_API_KEY || "";

  console.log("\n==================================================");
  console.log("🔍 TESTING OLLAMA PROVIDER");
  console.log("==================================================");
  console.log(`URL:      ${url}`);
  console.log(`Model:    ${model}`);
  console.log(`API Key:  ${apiKey ? apiKey.slice(0, 4) + "..." + apiKey.slice(-4) : "(None - Local mode)"}`);

  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // 1. Check /api/tags
  console.log("\n1️⃣  Checking model list at /api/tags...");
  try {
    const tagRes = await fetch(`${url}/api/tags`, { headers });
    if (tagRes.ok) {
      const tagData = await tagRes.json();
      const modelNames = (tagData.models || []).map((m) => m.name);
      console.log(`   ✅ Success! Found ${modelNames.length} models:`, modelNames.join(", ") || "(none)");
    } else {
      const errTxt = await tagRes.text().catch(() => "");
      console.log(`   ⚠️  /api/tags returned status ${tagRes.status}: ${errTxt}`);
    }
  } catch (err) {
    console.log(`   ❌ Could not reach ${url}/api/tags: ${err.message}`);
  }

  // 2. Test generation in key points
  console.log("\n2️⃣  Testing text generation at /api/generate...");
  const prompt = "CRITICAL: Answer in 2 short bullet key points only. What is AI?";
  const startTime = Date.now();

  try {
    const genRes = await fetch(`${url}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    const duration = Date.now() - startTime;
    if (genRes.ok) {
      const genData = await genRes.json();
      console.log(`   ✅ Ollama Generation Succeeded in ${duration}ms!`);
      console.log("   --- Response Output ---");
      console.log(genData.response?.trim());
      console.log("   -----------------------");
      return true;
    } else {
      const errTxt = await genRes.text().catch(() => "");
      console.log(`   ❌ Ollama generation failed (Status ${genRes.status}): ${errTxt}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Error connecting to Ollama: ${err.message}`);
    return false;
  }
}

async function testOpenAICompatible(env) {
  let baseUrl = (env.API_BASE_URL || "").replace(/\/+$/, "");
  if ((baseUrl.endsWith("ollama.com") || baseUrl.includes(":11434")) && !baseUrl.endsWith("/v1")) {
    baseUrl = `${baseUrl}/v1`;
  }
  const apiKey = env.API_KEY || "";
  const model = env.API_MODEL || "gpt-3.5-turbo";

  if (!baseUrl && !apiKey) {
    console.log("\n⏭️  Skipping OpenAI-compatible API test (API_KEY and API_BASE_URL not set in .env)");
    return;
  }

  console.log("\n==================================================");
  console.log("🔍 TESTING OPENAI-COMPATIBLE API PROVIDER");
  console.log("==================================================");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Model:    ${model}`);
  console.log(`API Key:  ${apiKey ? apiKey.slice(0, 4) + "..." + apiKey.slice(-4) : "(None)"}`);

  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const endpoint = `${baseUrl}/chat/completions`;
  const startTime = Date.now();

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Provide answers in direct bullet key points only." },
          { role: "user", content: "What is AI? Answer in 2 key points only." }
        ],
        temperature: 0.2
      })
    });

    const duration = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      console.log(`   ✅ API Generation Succeeded in ${duration}ms!`);
      console.log("   --- Response Output ---");
      console.log(content);
      console.log("   -----------------------");
      return true;
    } else {
      const errTxt = await res.text().catch(() => "");
      console.log(`   ❌ API request failed (Status ${res.status}): ${errTxt}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Error connecting to API: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("📄 Loading .env configuration...");
  const env = loadEnv();

  await testOllama(env);
  await testOpenAICompatible(env);

  console.log("\n🏁 Done! You can edit .env anytime to paste your keys and re-run:");
  console.log("   npm run test:ai\n");
}

main();
