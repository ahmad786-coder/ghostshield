import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  rehydrateText,
  passesLuhnCheck,
} from '../sanitizerEngine';
import type { CustomEntityDefinition } from '../../types/ghostshield';

describe('GhostShield Sanitizer & Token Engine', () => {
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
});
