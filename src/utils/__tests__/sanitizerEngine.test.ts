import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  rehydrateText,
  passesLuhnCheck,
} from '../sanitizerEngine';
import type { CustomEntityDefinition } from '../../types/ghostshield';
import { SAMPLE_SENSITIVE_PAYLOAD } from '../sampleData';

describe('GhostShield Sanitizer & Token Engine', () => {
  it('passes golden corpus regression test with exact byte-identical outputs', () => {
    // 1. Fixed large corpus: SAMPLE_SENSITIVE_PAYLOAD with standard custom entities
    const customEntities: CustomEntityDefinition[] = [
      { id: 'c1', text: 'Acme Global Systems', label: 'COMPANY' },
      { id: 'c2', text: 'Sarah Connor', label: 'PERSON' },
      { id: 'c3', text: 'Project Titan', label: 'PROJECT' },
    ];

    const largeResult = sanitizeText(SAMPLE_SENSITIVE_PAYLOAD, { customEntities });

    const expectedLargeSanitizedText =
`[2026-11-15 09:42:18 UTC] [ERROR] [auth-gateway] Connection failure during customer onboarding webhook:
Request Origin: [IP_ADDR_1] (Internal NAT: [IP_ADDR_2], MAC: [MAC_ADDR_1])
Triggered by: [EMAIL_1]
Tenant: [COMPANY_1] (Client Codename: [PROJECT_1])

================= ENVIRONMENT & CREDENTIALS =================
AWS_ACCESS_KEY_ID=[AWS_ACCESS_KEY_1]
OPENAI_API_KEY=[OPENAI_KEY_1]
ANTHROPIC_KEY=[OPENAI_KEY_2]
DATABASE_URL=[DB_URI_1]
MONGODB_URI=[DB_URI_2]
STRIPE_LIVE_KEY=[STRIPE_KEY_1]

User Authentication JWT:
Bearer [JWT_TOKEN_1]

================= CLIENT TRANSACTION DETAILS =================
Customer: [PERSON_1] (Contact: [EMAIL_2], Direct: [PHONE_1])
Billing Address: 742 Evergreen Terrace, San Francisco, CA
Target IBAN: [IBAN_1]
Payment Card: [CARD_NUM_1] (Visa Verified)
US Social Security: [SSN_1]
Authorized Charge Amount: [AMOUNT_1] USD (recurring annual retainer)

Customer Rep Confirmation:
"Please ensure [EMAIL_1] confirms delivery to [PERSON_1] before dispatching to [COMPANY_1] server [IP_ADDR_1]."

[PRIVATE_KEY_1]
`;

    const expectedLargeTokens = [
      '[IP_ADDR_1]',
      '[IP_ADDR_2]',
      '[MAC_ADDR_1]',
      '[EMAIL_1]',
      '[COMPANY_1]',
      '[PROJECT_1]',
      '[AWS_ACCESS_KEY_1]',
      '[OPENAI_KEY_1]',
      '[OPENAI_KEY_2]',
      '[DB_URI_1]',
      '[DB_URI_2]',
      '[STRIPE_KEY_1]',
      '[JWT_TOKEN_1]',
      '[PERSON_1]',
      '[EMAIL_2]',
      '[PHONE_1]',
      '[IBAN_1]',
      '[CARD_NUM_1]',
      '[SSN_1]',
      '[AMOUNT_1]',
      '[PRIVATE_KEY_1]',
    ];

    expect(largeResult.sanitizedText).toBe(expectedLargeSanitizedText);
    expect(Object.keys(largeResult.vaultMap)).toEqual(expectedLargeTokens);

    // 2. Short mixed input covering an email, an API key, and a card number
    const mixedInput = 'Alert: dev user test.user@secure-gateway.org with key sk-proj-ab12cd34ef56gh78ij90kl12 and card 4532 0150 1234 5671 reported error';
    const mixedResult = sanitizeText(mixedInput);

    const expectedMixedText = 'Alert: dev user [EMAIL_1] with key [OPENAI_KEY_1] and card [CARD_NUM_1] reported error';
    const expectedMixedTokens = ['[EMAIL_1]', '[OPENAI_KEY_1]', '[CARD_NUM_1]'];

    expect(mixedResult.sanitizedText).toBe(expectedMixedText);
    expect(Object.keys(mixedResult.vaultMap)).toEqual(expectedMixedTokens);
  });
  it('validates credit card numbers with Luhn algorithm accurately', () => {
    // Valid standard test card (Visa checksum = 1)
    expect(passesLuhnCheck('4532 0150 1234 5671')).toBe(true);
    // Invalid card (checksum altered)
    expect(passesLuhnCheck('4532 0150 1234 5679')).toBe(false);
  });

  it('guarantees deterministic token assignment for identical entities', () => {
    const input = 'Send email to alice@example.com. If not delivered, notify alice@example.com again.';
    const result = sanitizeText(input);

    expect(result.tokensFoundCount).toBe(2);
    // Both occurrences must receive [EMAIL_1]
    expect(result.sanitizedText).toBe('Send email to [EMAIL_1]. If not delivered, notify [EMAIL_1] again.');
    expect(result.vaultMap['[EMAIL_1]']).toBe('alice@example.com');
  });

  it('assigns incremental indexed tokens to distinct entities of same category', () => {
    const input = 'Contact alice@example.com and bob@example.com for onboarding.';
    const result = sanitizeText(input);

    expect(result.sanitizedText).toBe('Contact [EMAIL_1] and [EMAIL_2] for onboarding.');
    expect(result.vaultMap['[EMAIL_1]']).toBe('alice@example.com');
    expect(result.vaultMap['[EMAIL_2]']).toBe('bob@example.com');
  });

  it('detects critical API keys, JWTs, IPv4 addresses, and IBANs accurately', () => {
    const input = `
      OPENAI=sk-proj-1234567890abcdef1234567890abcdef123456
      AWS=AKIAIOSFODNN7EXAMPLE
      IP=192.168.1.50
      JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
      IBAN=GB29NWBK60161331926819
    `;

    const result = sanitizeText(input);

    expect(result.sanitizedText).toContain('[OPENAI_KEY_1]');
    expect(result.sanitizedText).toContain('[AWS_ACCESS_KEY_1]');
    expect(result.sanitizedText).toContain('[IP_ADDR_1]');
    expect(result.sanitizedText).toContain('[JWT_TOKEN_1]');
    expect(result.sanitizedText).toContain('[IBAN_1]');
  });

  it('correctly identifies and masks user-defined custom entities', () => {
    const customEntities: CustomEntityDefinition[] = [
      { id: '1', text: 'Acme Global Systems', label: 'COMPANY' },
      { id: '2', text: 'Project Titan', label: 'PROJECT' },
      { id: '3', text: 'Sarah Connor', label: 'PERSON' },
    ];

    const input = 'Welcome to Acme Global Systems. We are working on Project Titan with Sarah Connor.';
    const result = sanitizeText(input, { customEntities });

    expect(result.sanitizedText).toBe(
      'Welcome to [COMPANY_1]. We are working on [PROJECT_1] with [PERSON_1].'
    );
    expect(result.vaultMap['[COMPANY_1]']).toBe('Acme Global Systems');
    expect(result.vaultMap['[PROJECT_1]']).toBe('Project Titan');
    expect(result.vaultMap['[PERSON_1]']).toBe('Sarah Connor');
  });

  it('performs flawless round-trip re-hydration without token collision', () => {
    // Test that [EMAIL_10] and [EMAIL_1] do not collide
    const fakeVault: Record<string, string> = {
      '[EMAIL_1]': 'first@corp.com',
      '[EMAIL_2]': 'second@corp.com',
      '[EMAIL_10]': 'tenth@corp.com',
      '[COMPANY_1]': 'Acme Corp',
    };

    const aiResponse = `Hello **[COMPANY_1]**, we notified [EMAIL_1], [EMAIL_2], and [EMAIL_10] about the fix.`;
    const rehydrated = rehydrateText(aiResponse, fakeVault);

    expect(rehydrated.restoredText).toBe(
      'Hello Acme Corp, we notified first@corp.com, second@corp.com, and tenth@corp.com about the fix.'
    );
    expect(rehydrated.replacementsCount).toBe(4);
  });

  it('respects whitelist and allows specific items to remain unmasked', () => {
    const input = 'Contact alice@example.com or support@public.org';
    const result = sanitizeText(input, {
      whitelistTokens: ['support@public.org'],
    });

    expect(result.sanitizedText).toBe('Contact [EMAIL_1] or support@public.org');
    expect(result.vaultMap['[EMAIL_1]']).toBe('alice@example.com');
  });

  // --- PART 2 REFINEMENT TESTS ---

  it('precision/recall: correctly detects true-positives and ignores true-negatives across categories', () => {
    // 1. SECRET category
    // TP: valid OpenAI key
    const secTP = sanitizeText('Secret: sk-proj-1234567890abcdef1234567890abcdef123456');
    expect(secTP.vaultMap['[OPENAI_KEY_1]']).toBe('sk-proj-1234567890abcdef1234567890abcdef123456');
    // TN: short identifier not matching secret formats
    const secTN = sanitizeText('Identifier: sk-short');
    expect(secTN.tokensFoundCount).toBe(0);

    // 2. FINANCIAL category
    // TP: valid Luhn credit card
    const finTP = sanitizeText('Card: 4532 0150 1234 5671');
    expect(finTP.vaultMap['[CARD_NUM_1]']).toBe('4532 0150 1234 5671');
    // TN: invalid checksum card
    const finTN = sanitizeText('Card: 4532 0150 1234 5679');
    expect(finTN.tokensFoundCount).toBe(0);

    // 3. NETWORK_PII category
    // TP: valid email and IPv4
    const netTP = sanitizeText('Host: 10.20.30.40 user@test.com');
    expect(netTP.vaultMap['[IP_ADDR_1]']).toBe('10.20.30.40');
    expect(netTP.vaultMap['[EMAIL_1]']).toBe('user@test.com');
    // TN: invalid IP range
    const netTN = sanitizeText('Invalid IP: 999.888.777.666 not-an-email');
    expect(netTN.tokensFoundCount).toBe(0);

    // Phone detector: known loose — do not tighten without data.
    // Assert current loose behavior: matches 10-digit number runs.
    const phoneLoose = sanitizeText('Order reference: 8005550199');
    expect(phoneLoose.vaultMap['[PHONE_1]']).toBe('8005550199');

    // 4. CUSTOM category
    // TP: custom company
    const customTP = sanitizeText('Hello CyberDyne partner', {
      customEntities: [{ id: 'cd1', text: 'CyberDyne', label: 'COMPANY' }],
    });
    expect(customTP.vaultMap['[COMPANY_1]']).toBe('CyberDyne');
    // TN: non-matching text
    const customTN = sanitizeText('Hello Initech partner', {
      customEntities: [{ id: 'cd1', text: 'CyberDyne', label: 'COMPANY' }],
    });
    expect(customTN.tokensFoundCount).toBe(0);
  });

  it('overlap resolution: longer and more specific entities win without corrupting inner text', () => {
    // Email inside a DB URI: postgresql://admin:secret@db.service.internal:5432/main
    // The DB connection string detector must win over partial fragments
    const dbInput = 'Connect via postgresql://admin:secret@db.service.internal:5432/main to query';
    const dbResult = sanitizeText(dbInput);

    expect(dbResult.tokensFoundCount).toBe(1);
    expect(dbResult.sanitizedText).toBe('Connect via [DB_URI_1] to query');
    expect(dbResult.vaultMap['[DB_URI_1]']).toBe('postgresql://admin:secret@db.service.internal:5432/main');

    // Credit card number inside longer digit stream or surrounded by text
    const cardInput = 'Ref: 4532 0150 1234 5671 verified';
    const cardResult = sanitizeText(cardInput);
    expect(cardResult.sanitizedText).toBe('Ref: [CARD_NUM_1] verified');
  });

  it('rehydrate edges: handles [TOKEN_10] vs [TOKEN_1], markdown bold, code ticks, and unmatched tokens', () => {
    const vault: Record<string, string> = {
      '[EMAIL_1]': 'alice@corp.com',
      '[EMAIL_10]': 'tenth@corp.com',
      '[COMPANY_1]': 'Acme Corp',
    };

    // Edge 1: [EMAIL_10] vs [EMAIL_1] length collision
    // Edge 2: Markdown bold **[COMPANY_1]**
    // Edge 3: Markdown code ticks `[EMAIL_1]`
    // Edge 4: Unmatched token [UNKNOWN_TOKEN_1] not present in vault
    const aiResponse = 'Greetings **[COMPANY_1]**! Sent report to `[EMAIL_1]` and [EMAIL_10]. Note: [UNKNOWN_TOKEN_1] was skipped.';
    const rehydrated = rehydrateText(aiResponse, vault);

    expect(rehydrated.restoredText).toBe(
      'Greetings Acme Corp! Sent report to alice@corp.com and tenth@corp.com. Note: [UNKNOWN_TOKEN_1] was skipped.'
    );
    expect(rehydrated.replacementsCount).toBe(3);
    expect(rehydrated.unmatchedTokens).toEqual(['[UNKNOWN_TOKEN_1]']);
  });
});
