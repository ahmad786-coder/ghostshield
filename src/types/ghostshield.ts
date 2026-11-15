export type EntityCategory =
  | 'SECRET'      // OpenAI, AWS, GitHub, Stripe, Private Keys, DB URLs, etc.
  | 'FINANCIAL'   // IBAN, Credit Card, SSN, Currency
  | 'NETWORK_PII' // Email, Phone, IPv4, IPv6, MAC
  | 'CUSTOM';     // User-defined entities: Company, Person, Project, etc.

export type SecretSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface EntityRule {
  id: string;
  name: string;
  category: EntityCategory;
  prefix: string; // e.g., 'API_KEY', 'EMAIL', 'IP_ADDR'
  severity: SecretSeverity;
  description: string;
  enabled: boolean;
}

export interface CustomEntityDefinition {
  id: string;
  text: string;
  label: 'COMPANY' | 'PERSON' | 'PROJECT' | 'CUSTOM';
}

export interface DetectedEntity {
  id: string;
  originalValue: string;
  token: string;
  category: EntityCategory;
  severity: SecretSeverity;
  ruleName: string;
  occurrenceCount: number;
  unmasked: boolean; // Whitelisted by user
}

export interface MatchedSpan {
  start: number;
  end: number;
  originalText: string;
  token: string;
  ruleId: string;
  category: EntityCategory;
  severity: SecretSeverity;
  ruleName: string;
}

export interface SanitizationResult {
  sanitizedText: string;
  tokensFoundCount: number;
  entities: DetectedEntity[];
  vaultMap: Record<string, string>; // token -> originalValue
  reverseVaultMap: Record<string, string>; // originalValue -> token
  executionTimeMs: number;
}

export interface RehydrateResult {
  restoredText: string;
  replacementsCount: number;
  unmatchedTokens: string[];
}

export interface VaultExport {
  version: string;
  exportedAt: string;
  description: string;
  vaultMap: Record<string, string>;
  entities: Array<{
    token: string;
    originalValue: string;
    category: EntityCategory;
    ruleName: string;
  }>;
}
