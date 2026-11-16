# AGENTS.md

## Product Overview
GhostShield is a 100% client-side, zero-backend web utility that sanitizes sensitive code, logs, PII, and financial credentials before users paste them into AI models (ChatGPT, Claude, Gemini). When the AI responds, GhostShield reversibly re-hydrates the original names and values locally in the browser.

## Tech Stack
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (Obsidian `#09090B` dark security aesthetic)
- **Icons:** `lucide-react`
- **Parsers:** `pdfjs-dist` (local worker text extraction) + `papaparse` (RFC-4180 CSV parsing)
- **Testing & Quality:** Vitest + Oxlint
- **Deployment:** GitHub Pages via `gh-pages` CLI (`base: '/ghostshield/'`)
*Note: Do not alter the core stack dependencies without explicit user request.*

## Development & Build Commands
- `npm run dev`: Start local Vite development server
- `npm test`: Run unit tests with Vitest (`vitest run`)
- `npm run lint`: Run code linter with Oxlint (`oxlint`)
- `npm run build`: Type-check and build production distribution (`tsc -b && vite build`)
- `npx gh-pages -d dist`: Publish built distribution to GitHub Pages

## Engineering & Security Rules
- **Never Commit Secrets:** Test fixtures and sample data must use mocked or test-prefixed credentials (e.g. `sk_test_...`, `AKIAIOSFODNN7EXAMPLE`) to avoid triggering GitHub Push Protection or leaking credentials.
- **Client-Side Air-Gap:** Redaction, regex scanning, CSV parsing, and PDF text extraction must remain 100% in-browser RAM with zero network calls.
- **Input Validation & Testing:** Every new detection pattern, entity rule, or input path must include deterministic mapping verification and test coverage in `src/utils/__tests__/sanitizerEngine.test.ts`.
- **Pre-flight Quality Gates:** Always run `npm run lint`, `npm test`, and `npm run build` cleanly before concluding any task.
- **Small, Reviewable Changes:** Commit changes with clear, descriptive messages and preserve project focus.

## Architecture Decision Records (ADRs)
- **2026-11-16 — Deletion of Orphaned ContextForge Module:**
  The ContextForge prompt-packer and file-tree explorer module was permanently removed on 2026-11-16 because it was an orphaned artifact from earlier scaffolding that was never imported by the live GhostShield app and maintained in a separate repository. Do not re-suggest or re-add the context packer codebase without an explicit product decision.
