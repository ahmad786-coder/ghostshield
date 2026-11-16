import { describe, it, expect } from 'vitest';
import {
  validateVaultExport,
  MAX_VAULT_ENTRIES,
} from '../vaultValidation';

describe('Vault Import Validation', () => {
  it('valid minimal vault passes', () => {
    const validVault = {
      version: '1.0',
      vaultMap: {
        '[OPENAI_KEY_1]': 'sk_test_mockKey1234567890abcdef',
        '[EMAIL_1]': 'alice@example.com',
      },
    };

    const result = validateVaultExport(validVault);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.vault.version).toBe('1.0');
      expect(result.vault.vaultMap['[EMAIL_1]']).toBe('alice@example.com');
    }
  });

  it('wrong version rejected', () => {
    const invalidVault = {
      version: '2.0',
      vaultMap: {
        '[EMAIL_1]': 'alice@example.com',
      },
    };

    const result = validateVaultExport(invalidVault);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Unsupported vault version');
    }
  });

  it('vaultMap with a non-string value rejected', () => {
    const invalidVault = {
      version: '1.0',
      vaultMap: {
        '[EMAIL_1]': 12345, // invalid: not a string
      },
    };

    const result = validateVaultExport(invalidVault);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('must be a non-empty string');
    }
  });

  it('vaultMap key not matching the token pattern rejected', () => {
    const invalidVault = {
      version: '1.0',
      vaultMap: {
        'INVALID_TOKEN': 'alice@example.com', // missing brackets and index
      },
    };

    const result = validateVaultExport(invalidVault);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('invalid token format');
    }
  });

  it('10,001 entries rejected', () => {
    const largeMap: Record<string, string> = {};
    for (let i = 1; i <= MAX_VAULT_ENTRIES + 1; i++) {
      largeMap[`[KEY_${i}]`] = `val_${i}`;
    }

    const invalidVault = {
      version: '1.0',
      vaultMap: largeMap,
    };

    const result = validateVaultExport(invalidVault);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('exceeds maximum allowed entries');
    }
  });

  it('entities with a bad category rejected', () => {
    const invalidVault = {
      version: '1.0',
      vaultMap: {
        '[EMAIL_1]': 'alice@example.com',
      },
      entities: [
        {
          token: '[EMAIL_1]',
          originalValue: 'alice@example.com',
          category: 'NOT_A_REAL_CATEGORY', // invalid
          ruleName: 'Email Detector',
        },
      ],
    };

    const result = validateVaultExport(invalidVault);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('category is invalid');
    }
  });

  it('entities with a bad token rejected', () => {
    const invalidVault = {
      version: '1.0',
      vaultMap: {
        '[EMAIL_1]': 'alice@example.com',
      },
      entities: [
        {
          token: 'BAD_TOKEN', // invalid
          originalValue: 'alice@example.com',
          category: 'NETWORK_PII',
          ruleName: 'Email Detector',
        },
      ],
    };

    const result = validateVaultExport(invalidVault);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('token is invalid');
    }
  });

  it('null / array / string input rejected', () => {
    expect(validateVaultExport(null).ok).toBe(false);
    expect(validateVaultExport([]).ok).toBe(false);
    expect(validateVaultExport('not an object').ok).toBe(false);
    expect(validateVaultExport(undefined).ok).toBe(false);
  });

  it('exportedAt as a non-string rejected', () => {
    const invalidVault = {
      version: '1.0',
      exportedAt: 123456789, // invalid: should be string timestamp
      vaultMap: {
        '[AWS_ACCESS_KEY_1]': 'AKIAIOSFODNN7EXAMPLE',
      },
    };

    const result = validateVaultExport(invalidVault);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('exportedAt must be a string');
    }
  });
});
