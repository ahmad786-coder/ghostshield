# GhostShield

> **100% Client-Side Reversible PII & Secret Anonymizer for AI**

GhostShield is a zero-trust, air-gapped web utility designed to sanitize sensitive credentials, personal identifiable information (PII), proprietary business records, and code tokens before pasting them into external AI models (ChatGPT, Claude, Gemini). When the AI responds, GhostShield reversibly re-hydrates the original names and values locally in your browser.

---

## How It Works

### Stage 1: Sanitize (Before Sending to AI)
1. **Input:** Paste raw logs, code, stack traces, `.env` configs, or drop files (`.txt`, `.md`, `.json`, `.log`, `.csv`, `.pdf`).
2. **Deterministic Tokenization:** GhostShield identifies secrets (OpenAI, Anthropic, AWS, GitHub, Stripe, Private Keys, DB URIs, JWTs), financial identifiers (Credit/Debit cards with Luhn check, IBANs, SSNs, Currency), network PII (Emails, Phone numbers, IPv4, IPv6, MAC), and custom entities (`COMPANY`, `PERSON`, `PROJECT`).
3. **Consistent Placeholders:** Identical occurrences map to the exact same placeholder (e.g. `john@acme.com` $\to$ `[EMAIL_1]`).
4. **Local Vault:** A bidirectional token dictionary (`VaultMap`) is stored purely in browser RAM.

### Stage 2: Re-Hydrate (After Receiving AI Response)
1. **Input:** Paste the AI's completion containing placeholders (e.g., `[COMPANY_1]`, `[EMAIL_1]`, `[API_KEY_1]`).
2. **Reversible Restoration:** GhostShield maps tokens back to their original values with descending-length resolution to avoid token collision (e.g., `[EMAIL_10]` before `[EMAIL_1]`).
3. **Clean Output:** Copy or download the fully restored original content.

---

## Local-Only Guarantee

- **Zero Backend Calls:** Redaction, regex scanning, CSV parsing, and PDF text extraction occur 100% client-side in the browser.
- **Air-Gapped RAM Storage:** The token vault exists exclusively in ephemeral browser memory and is automatically wiped on tab close.
- **Local Vault Backup:** Users can export the vault dictionary as a local `.json` file to restore responses in later sessions.

---

## Honest Threat-Model Note

> [!WARNING]
> An exported Vault JSON contains the original secrets and PII in plaintext **BY DESIGN** so that the vault remains reversible and usable across browser sessions.
> - Store exported vault files securely and treat them with the same sensitivity as the source document.
> - Only import vault files that you created or trust completely.
> - Never upload or share an exported vault JSON.

---

## Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit tests
npm test

# Run Oxlint linter
npm run lint

# Build production bundle
npm run build

# Deploy to GitHub Pages
npx gh-pages -d dist
```

---

## Project Structure

```
src/
├── components/
│   ├── TopZeroTrustBar.tsx   # Air-gapped trust badge, stage tabs, sample loader, import/export
│   ├── SanitizeStage.tsx      # Stage 1: Raw input, custom entity manager, color-coded sanitized output
│   ├── RehydrateStage.tsx     # Stage 2: AI response input and restored final output
│   └── VaultSidebar.tsx       # Live session vault: severity pills, token explorer, whitelist controls
├── types/
│   └── ghostshield.ts         # TypeScript definitions for entities, rules, spans, vault maps
├── utils/
│   ├── sanitizerEngine.ts     # Core multi-category detector, Luhn validator, deterministic token assigner
│   ├── fileParsers.ts         # Client-side PDF text extraction (pdfjs-dist) & RFC-4180 CSV parsing (papaparse)
│   ├── sampleData.ts          # Built-in realistic sample logs and mock AI completion
│   └── __tests__/
│       └── sanitizerEngine.test.ts # Vitest unit test suite
├── App.tsx                    # Main 2-Stage GhostShield Workbench
├── main.tsx                   # React root entry
└── index.css                  # Obsidian canvas & dark workbench Tailwind styling
```
