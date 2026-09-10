# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- Install dependencies: `npm install`
- Build extension: `npm run build`
- Watch for changes: `npm run watch`
- Run tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Clean build: `npm run clean`

## Architecture and Structure

BrowseMind is a Manifest V3 browser extension designed for AI-powered webpage analysis.

### High-Level Architecture
`Webpage` $\rightarrow$ `Content Script` $\rightarrow$ `Background Service Worker` $\rightarrow$ `AI Service` $\rightarrow$ `Provider Manager` $\rightarrow$ `(Ollama | OpenAI API)` $\rightarrow$ `AI Response` $\rightarrow$ `Response Panel (UI)`

### Directory Structure
- `src/background/`: Contains the `service-worker.ts` which acts as the central orchestrator.
- `src/content/`: Handles DOM interaction and content extraction.
    - `content.ts`: Manages the "Ask AI" button and UI integration.
    - `page-reader.ts`: Extracts readable content from the webpage.
- `src/ai/`: Core AI logic.
    - `ai-service.ts`: Primary interface for AI requests.
    - `provider-manager.ts`: Routes requests to the selected AI provider.
    - `ollama.ts` & `api-client.ts`: Provider-specific implementations.
    - `prompts.ts`: Centralized AI prompt definitions.
- `src/popup/` & `src/options/`: UI for the extension popup and settings page.
- `src/shared/`: Common utilities, types, and browser storage wrappers.

### Key Technical Details
- **Manifest V3**: Uses a service worker for background tasks.
- **Security**: Implements strict prompt-injection protection and XSS escaping for AI output.
- **AI Providers**: Supports local (Ollama) and remote (OpenAI-compatible) APIs.
- **Content Extraction**: Filters out noise (ads, nav, footers) to minimize token usage.
