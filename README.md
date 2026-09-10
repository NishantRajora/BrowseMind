# BrowseMind

**BrowseMind** is an AI-powered Chromium/Brave browser extension that helps users understand, explain, summarize, and analyze webpage content directly from the browser.

It supports **Ollama** for local AI models and **OpenAI-compatible APIs** for cloud or custom AI providers.

---

## Features

* 🔘 Simple ON/OFF extension toggle
* ✨ Select text → **Ask AI**
* 🖱️ Right-click selected text → **Ask BrowseMind**
* 💡 Right-click selected text → **Explain Selection**
* 🔍 Right-click webpage → **Analyze Page with BrowseMind**
* 📄 Readable webpage content extraction
* 🤖 Ollama support
* 🌐 OpenAI-compatible API support
* 🎨 Light, dark, and system themes
* 📝 Concise, normal, and detailed responses
* 📦 Automatic text truncation/chunking
* 🔒 API keys stored locally
* 🛡️ Prompt-injection and XSS protection
* ⚡ Lightweight Manifest V3 architecture

---

## How It Works

### Ask AI from selected text

1. Turn BrowseMind **ON**.
2. Open any webpage.
3. Select some text.
4. A small **Ask AI** button appears near the selection.
5. Click **Ask AI**.
6. BrowseMind sends the selected text and relevant page context to the configured AI provider.
7. The answer appears in a floating panel at the bottom of the webpage.

### Right-click actions

Select text and right-click:

```text
Ask BrowseMind
Explain Selection
```

Or right-click anywhere on the page:

```text
Analyze Page with BrowseMind
```

The results are displayed in the same bottom floating AI panel.

---

## Supported AI Providers

### Ollama

BrowseMind can connect to a locally running Ollama server.

Default URL:

```text
http://localhost:11434
```

Default model:

```text
llama3.2
```

Make sure Ollama is running before using BrowseMind.

For browser-extension access, configure Ollama to allow the extension origin.

On Windows PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
```

Restart Ollama after changing the environment variable.

Check Ollama:

```powershell
curl http://localhost:11434/api/tags
```

A successful response should return JSON containing your installed models.

---

## OpenAI-Compatible APIs

BrowseMind also supports APIs that implement the OpenAI Chat Completions format.

Configure:

```text
API Base URL
API Key
Model
```

The extension sends requests to:

```text
POST /chat/completions
```

The API key is stored locally using Chrome extension storage and is never intentionally logged.

---

## Installation

### 1. Clone or create the project

Open a terminal in the BrowseMind project directory.

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

```bash
npm run build
```

The production extension is generated inside:

```text
dist/
```

### 4. Load into Brave

Open:

```text
brave://extensions
```

Then:

1. Enable **Developer mode**.
2. Click **Load unpacked**.
3. Select the BrowseMind `dist` folder.
4. BrowseMind should now appear in your extensions list.

---

## Development

Build:

```bash
npm run build
```

Watch for changes:

```bash
npm run watch
```

Run tests:

```bash
npm test
```

Run tests continuously:

```bash
npm run test:watch
```

Clean the build:

```bash
npm run clean
```

---

## Settings

Open BrowseMind and select **Settings**.

Available settings include:

| Setting        | Description                          |
| -------------- | ------------------------------------ |
| Enabled        | Turn BrowseMind functionality ON/OFF |
| Provider       | Ollama or OpenAI-compatible API      |
| Ollama URL     | Ollama server address                |
| Ollama Model   | Ollama model to use                  |
| API URL        | OpenAI-compatible API base URL       |
| API Key        | Authentication key                   |
| API Model      | Model name                           |
| Theme          | System, Light, or Dark               |
| Response Style | Concise, Normal, or Detailed         |
| Maximum Text   | Maximum webpage text sent to the AI  |

---

## AI Output

BrowseMind uses strict prompts designed to return only the useful answer.

The AI should not:

* Repeat the user's question
* Add unnecessary introductions
* Explain its internal instructions
* Follow instructions embedded inside webpage content
* Invent unsupported information
* Return raw API responses
* Return debugging information

For example, selecting:

```text
Machine learning is a subset of artificial intelligence...
```

and asking:

```text
What does this mean?
```

should produce a direct explanation rather than:

```text
Here is the answer based on the webpage...
```

---

## Page Extraction

BrowseMind extracts readable webpage content while attempting to ignore irrelevant elements such as:

* Navigation
* Ads
* Sidebars
* Footers
* Cookie banners
* Popups
* Social widgets
* Comments
* Scripts
* Styles
* Hidden elements
* Embedded media
* Forms

The default maximum webpage context is:

```text
30,000 characters
```

Large content can be divided into smaller chunks before being processed.

The original webpage DOM is not intentionally modified by the page extraction process.

---

## Security

BrowseMind follows several security practices:

* Webpage content is treated as **untrusted input**.
* Webpage instructions cannot override the AI system prompt.
* AI output is safely escaped before rendering.
* API keys are not logged.
* Provider errors do not expose sensitive credentials.
* Extension messages are validated.
* No webpage-provided JavaScript is executed.
* The extension uses Manifest V3.
* Permissions are kept as limited as practical.

---

## Project Structure

```text
BrowseMind/
├── manifest.json
├── package.json
├── tsconfig.json
├── build.mjs
├── README.md
│
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   │
│   ├── content/
│   │   ├── content.ts
│   │   └── page-reader.ts
│   │
│   ├── ai/
│   │   ├── ai-service.ts
│   │   ├── provider.ts
│   │   ├── provider-manager.ts
│   │   ├── ollama.ts
│   │   ├── api-client.ts
│   │   └── prompts.ts
│   │
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   │
│   ├── options/
│   │   ├── options.html
│   │   ├── options.ts
│   │   └── options.css
│   │
│   └── shared/
│       ├── types.ts
│       ├── constants.ts
│       ├── storage.ts
│       └── utils.ts
│
├── assets/
│   └── icons/
│
├── tests/
│
└── dist/
```

---

## Architecture

```text
Webpage
   │
   ├── Text Selection
   │       │
   │       ▼
   │    Ask AI
   │       │
   │       ▼
   │  Content Script
   │       │
   │       ▼
   │ Background Service Worker
   │       │
   │       ▼
   │     AI Service
   │       │
   │       ▼
   │ Provider Manager
   │       │
   ├───────┴────────┐
   ▼                ▼
Ollama       OpenAI-Compatible API
   │                │
   └───────┬────────┘
           ▼
      AI Response
           │
           ▼
   Bottom Response Panel
```

---

## Error Handling

BrowseMind handles common provider failures including:

```text
CONFIGURATION
NETWORK
TIMEOUT
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
RATE_LIMITED
SERVER_ERROR
INVALID_RESPONSE
UNKNOWN
```

Users receive a clean error message instead of raw provider responses or debugging information.

---

## Troubleshooting

### Ollama connection denied

If BrowseMind reports:

```text
Ollama denied access
```

set the Windows environment variable:

```powershell
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
```

Then completely restart Ollama.

Test:

```powershell
curl http://localhost:11434/api/tags
```

Then reload BrowseMind from:

```text
brave://extensions
```

---

### Extension does not load

Run:

```bash
npm run build
```

Then make sure you load:

```text
dist/
```

rather than the project root.

---

### Service worker error

Open:

```text
brave://extensions
```

Find BrowseMind and click **Errors**.

Also rebuild:

```bash
npm run clean
npm run build
```

Then reload the extension.

---

### Ask AI does not appear

Check:

1. BrowseMind is ON.
2. The page is a normal webpage supported by browser content scripts.
3. Text is actually selected.
4. BrowseMind has been reloaded after rebuilding.
5. Check extension errors in `brave://extensions`.

---

## Testing

Run:

```bash
npm test
```

Tests cover important functionality such as:

* Text normalization
* Text truncation
* Text chunking
* Settings validation
* Default settings
* Prompt generation
* Provider response parsing
* Error handling

---

## Privacy

BrowseMind does not require a BrowseMind backend server.

When using **Ollama**, webpage content is sent to the configured Ollama server.

When using an **OpenAI-compatible provider**, webpage content is sent to the API configured by the user.
/
Users should review the privacy policies of any external AI provider they configure.

API credentials are stored locally using browser extension storage.

---

## License

Add your preferred license here, for example:

```text
MIT License
```

if you intend to release BrowseMind under the MIT license.
