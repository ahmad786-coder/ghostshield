import type { VaultExport, EntityCategory } from '../types/ghostshield';

export const MAX_VAULT_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VAULT_ENTRIES = 10_000;
export const VAULT_TOKEN_PATTERN = /^\[[A-Z0-9_]+_\d+\]$/;

const VALID_CATEGORIES = new Set<EntityCategory>([
  'SECRET',
  'FINANCIAL',
  'NETWORK_PII',
  'CUSTOM',
]);

/**
 * Pure validator for imported GhostShield Vault JSON.
 * Returns either { ok: true, vault } or { ok: false, error } with plain-words error messages naming the failing rule.
 */
export function validateVaultExport(
  value: unknown
): { ok: true; vault: VaultExport } | { ok: false; error: string } {
  // 1. Value must be a plain object (not null, not an array)
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Vault file must be a plain JSON object' };
  }

  const obj = value as Record<string, unknown>;

  // 2. Version must be exactly string '1.0'
  if (obj.version !== '1.0') {
    return {
      ok: false,
      error: `Unsupported vault version: expected "1.0", received ${
        typeof obj.version === 'string' ? `"${obj.version}"` : typeof obj.version
      }`,
    };
  }

  // 3. vaultMap must be a plain object
  if (
    obj.vaultMap === null ||
    typeof obj.vaultMap !== 'object' ||
    Array.isArray(obj.vaultMap)
  ) {
    return { ok: false, error: 'vaultMap must be a plain JSON object' };
  }

  const mapEntries = Object.entries(obj.vaultMap as Record<string, unknown>);

  // 3a. At most MAX_VAULT_ENTRIES entries
  if (mapEntries.length > MAX_VAULT_ENTRIES) {
    return {
      ok: false,
      error: `vaultMap exceeds maximum allowed entries (${mapEntries.length} > ${MAX_VAULT_ENTRIES})`,
    };
  }

  // 3b. Every key must match VAULT_TOKEN_PATTERN and every value must be a non-empty string
  for (const [token, origVal] of mapEntries) {
    if (!VAULT_TOKEN_PATTERN.test(token)) {
      return {
        ok: false,
        error: `vaultMap contains invalid token format "${token}". Expected pattern: [TAG_N]`,
      };
    }
    if (typeof origVal !== 'string' || origVal.length === 0) {
      return {
        ok: false,
        error: `vaultMap value for token "${token}" must be a non-empty string`,
      };
    }
  }

  // 4. entities, if present, must be an array of valid entity objects
  if ('entities' in obj && obj.entities !== undefined) {
    if (!Array.isArray(obj.entities)) {
      return { ok: false, error: 'entities must be an array of objects' };
    }

    for (let i = 0; i < obj.entities.length; i++) {
      const ent = obj.entities[i];
      if (ent === null || typeof ent !== 'object' || Array.isArray(ent)) {
        return { ok: false, error: `entities[${i}] must be an object` };
      }
      const entObj = ent as Record<string, unknown>;

      if (typeof entObj.token !== 'string' || !VAULT_TOKEN_PATTERN.test(entObj.token)) {
        return {
          ok: false,
          error: `entities[${i}].token is invalid ("${String(entObj.token)}")`,
        };
      }

      if (typeof entObj.originalValue !== 'string' || entObj.originalValue.length === 0) {
        return {
          ok: false,
          error: `entities[${i}].originalValue must be a non-empty string`,
        };
      }

      if (!VALID_CATEGORIES.has(entObj.category as EntityCategory)) {
        return {
          ok: false,
          error: `entities[${i}].category is invalid ("${String(entObj.category)}")`,
        };
      }

      if (typeof entObj.ruleName !== 'string') {
        return {
          ok: false,
          error: `entities[${i}].ruleName must be a string`,
        };
      }
    }
  }

  // 5. exportedAt and description, if present, must be strings
  if ('exportedAt' in obj && obj.exportedAt !== undefined && typeof obj.exportedAt !== 'string') {
    return { ok: false, error: 'exportedAt must be a string' };
  }

  if ('description' in obj && obj.description !== undefined && typeof obj.description !== 'string') {
    return { ok: false, error: 'description must be a string' };
  }

  return {
    ok: true,
    vault: obj as unknown as VaultExport,
  };
}
