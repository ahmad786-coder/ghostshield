import type {
  EntityCategory,
  SecretSeverity,
  CustomEntityDefinition,
  DetectedEntity,
  MatchedSpan,
  SanitizationResult,
  RehydrateResult,
} from '../types/ghostshield';

// Luhn check algorithm for valid Credit/Debit cards
export function passesLuhnCheck(cardNumberStr: string): boolean {
  const digitsOnly = cardNumberStr.replace(/\D/g, '');
  if (digitsOnly.length < 13 || digitsOnly.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Category Configuration Defaults
export interface DetectionToggles {
  maskSecrets: boolean;
  maskFinancial: boolean;
  maskNetworkPii: boolean;
  maskCurrency: boolean;
  maskCustom: boolean;
}

export const DEFAULT_DETECTION_TOGGLES: DetectionToggles = {
  maskSecrets: true,
  maskFinancial: true,
  maskNetworkPii: true,
  maskCurrency: true,
  maskCustom: true,
};

export interface RegexDetectorDef {
  id: string;
  name: string;
  category: EntityCategory;
  prefix: string;
  severity: SecretSeverity;
  regex: RegExp;
  validator?: (match: string) => boolean;
}

export const REGEX_DETECTORS: RegexDetectorDef[] = [
  // 1. Critical Secrets & Keys
  {
    id: 'openai_key',
    name: 'OpenAI API Key',
    category: 'SECRET',
    prefix: 'OPENAI_KEY',
    severity: 'CRITICAL',
    regex: /\b(sk-(?:proj-|live-)?[a-zA-Z0-9_-]{20,80})\b/g,
  },
  {
    id: 'anthropic_key',
    name: 'Anthropic API Key',
    category: 'SECRET',
    prefix: 'ANTHROPIC_KEY',
    severity: 'CRITICAL',
    regex: /\b(sk-ant-[a-zA-Z0-9_\-\.]{20,100})\b/g,
  },
  {
    id: 'google_api_key',
    name: 'Google Cloud / Gemini Key',
    category: 'SECRET',
    prefix: 'GOOGLE_KEY',
    severity: 'CRITICAL',
    regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
  },
  {
    id: 'aws_access_key',
    name: 'AWS Access Key ID',
    category: 'SECRET',
    prefix: 'AWS_ACCESS_KEY',
    severity: 'CRITICAL',
    regex: /\b((?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16})\b/g,
  },
  {
    id: 'github_token',
    name: 'GitHub Personal Access Token',
    category: 'SECRET',
    prefix: 'GITHUB_TOKEN',
    severity: 'CRITICAL',
    regex: /\b((?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,40}|github_pat_[a-zA-Z0-9_]{50,90})\b/g,
  },
  {
    id: 'stripe_key',
    name: 'Stripe Secret / Restricted Key',
    category: 'SECRET',
    prefix: 'STRIPE_KEY',
    severity: 'CRITICAL',
    regex: /\b((?:sk_live|rk_live|sk_test|rk_test)_[0-9a-zA-Z]{24,40})\b/g,
  },
  {
    id: 'private_key',
    name: 'Private Key Block',
    category: 'SECRET',
    prefix: 'PRIVATE_KEY',
    severity: 'CRITICAL',
    regex: /-----BEGIN(?: [A-Z0-9_-]+)? PRIVATE KEY-----[\s\S]+?-----END(?: [A-Z0-9_-]+)? PRIVATE KEY-----/g,
  },
  {
    id: 'db_connection_string',
    name: 'Database Connection String',
    category: 'SECRET',
    prefix: 'DB_URI',
    severity: 'CRITICAL',
    regex: /\b((?:postgres|postgresql|mongodb|mongodb\+srv|mysql|redis):\/\/[^\s"'`]+)\b/g,
  },
  {
    id: 'jwt_token',
    name: 'JSON Web Token (JWT)',
    category: 'SECRET',
    prefix: 'JWT_TOKEN',
    severity: 'HIGH',
    regex: /\b(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g,
  },

  // 2. Financial & ID Data
  {
    id: 'credit_card',
    name: 'Credit / Debit Card Number',
    category: 'FINANCIAL',
    prefix: 'CARD_NUM',
    severity: 'CRITICAL',
    // 13 to 19 digits with optional hyphens or spaces
    regex: /\b(?:\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,4}|\d{4}[ -]?\d{6}[ -]?\d{4,5})\b/g,
    validator: (m) => passesLuhnCheck(m),
  },
  {
    id: 'iban',
    name: 'IBAN Bank Account',
    category: 'FINANCIAL',
    prefix: 'IBAN',
    severity: 'HIGH',
    // Standard international IBAN regex
    regex: /\b([A-Z]{2}\d{2}[A-Z0-9]{4,30})\b/g,
    validator: (m) => m.length >= 15 && m.length <= 34,
  },
  {
    id: 'ssn',
    name: 'Social Security Number (SSN)',
    category: 'FINANCIAL',
    prefix: 'SSN',
    severity: 'CRITICAL',
    // Strict SSN: 3 digits - 2 digits - 4 digits (excluding 000, 666, 900-999)
    regex: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
  },
  {
    id: 'currency_amount',
    name: 'Monetary Currency Amount',
    category: 'FINANCIAL',
    prefix: 'AMOUNT',
    severity: 'MEDIUM',
    regex: /(?:[\$€£¥₹]|USD|EUR|GBP|CAD|AUD)\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\s?(?:USD|EUR|GBP|CAD|AUD|EUR)/g,
  },

  // 3. Contact & Network PII
  {
    id: 'email',
    name: 'Email Address',
    category: 'NETWORK_PII',
    prefix: 'EMAIL',
    severity: 'HIGH',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  },
  {
    id: 'phone_number',
    name: 'Phone Number',
    category: 'NETWORK_PII',
    prefix: 'PHONE',
    severity: 'HIGH',
    // Phone with optional international prefix + and formatting
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    validator: (m) => {
      // Must have between 7 and 15 digits
      const digits = m.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    },
  },
  {
    id: 'ipv4',
    name: 'IPv4 Address',
    category: 'NETWORK_PII',
    prefix: 'IP_ADDR',
    severity: 'HIGH',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    validator: (m) => {
      // Exclude simple version numbers like 1.0.0 or 0.0.0.0 if not desired, but let's keep all valid IPv4
      const parts = m.split('.').map(Number);
      return parts.length === 4 && parts.every((p) => p >= 0 && p <= 255);
    },
  },
  {
    id: 'ipv6',
    name: 'IPv6 Address',
    category: 'NETWORK_PII',
    prefix: 'IPV6_ADDR',
    severity: 'HIGH',
    regex: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}\b/g,
  },
  {
    id: 'mac_address',
    name: 'MAC Address',
    category: 'NETWORK_PII',
    prefix: 'MAC_ADDR',
    severity: 'MEDIUM',
    regex: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,
  },
];

export interface DetectOptions {
  toggles?: Partial<DetectionToggles>;
  customEntities?: CustomEntityDefinition[];
}

export interface RawEntitySpan {
  start: number;
  end: number;
  originalText: string;
  prefix: string;
  category: EntityCategory;
  severity: SecretSeverity;
  ruleName: string;
  ruleId: string;
}

/**
 * Seam 1: Detect all matching entities in the text and return non-overlapping spans sorted by position.
 * Clones each regex per call to guarantee thread/call safety and prevent shared mutable state.
 */
export function detectEntities(
  inputText: string,
  options: DetectOptions = {}
): RawEntitySpan[] {
  if (!inputText || inputText.trim() === '') {
    return [];
  }

  const toggles: DetectionToggles = {
    ...DEFAULT_DETECTION_TOGGLES,
    ...(options.toggles || {}),
  };

  const customEntities = options.customEntities || [];
  const rawMatches: RawEntitySpan[] = [];

  // 1. Scan for custom entities first
  if (toggles.maskCustom && customEntities.length > 0) {
    for (const ce of customEntities) {
      if (!ce.text || ce.text.trim().length === 0) continue;
      const escaped = ce.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Case-insensitive match with boundary awareness
      const regex = new RegExp(`(?<![a-zA-Z0-9_])${escaped}(?![a-zA-Z0-9_])`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(inputText)) !== null) {
        rawMatches.push({
          start: m.index,
          end: m.index + m[0].length,
          originalText: m[0],
          prefix: ce.label,
          category: 'CUSTOM',
          severity: 'HIGH',
          ruleName: `Custom: ${ce.label}`,
          ruleId: `custom_${ce.id}`,
        });
      }
    }
  }

  // 2. Scan standard regex detectors based on active toggles
  for (const detector of REGEX_DETECTORS) {
    if (detector.category === 'SECRET' && !toggles.maskSecrets) continue;
    if (detector.category === 'FINANCIAL') {
      if (detector.id === 'currency_amount') {
        if (!toggles.maskCurrency) continue;
      } else {
        if (!toggles.maskFinancial) continue;
      }
    }
    if (detector.category === 'NETWORK_PII' && !toggles.maskNetworkPii) continue;

    // Fresh regex instance per call to eliminate mutable shared state across runs
    const regexClone = new RegExp(detector.regex.source, detector.regex.flags);
    let m: RegExpExecArray | null;

    while ((m = regexClone.exec(inputText)) !== null) {
      const matchText = m[0];
      if (detector.validator && !detector.validator(matchText)) {
        continue;
      }

      rawMatches.push({
        start: m.index,
        end: m.index + matchText.length,
        originalText: matchText,
        prefix: detector.prefix,
        category: detector.category,
        severity: detector.severity,
        ruleName: detector.name,
        ruleId: detector.id,
      });
    }
  }

  // 3. Resolve Overlapping Matches Cleanly:
  // Sort by start index ASC, then by length DESC (longer/more specific matches win)
  rawMatches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const nonOverlapping: RawEntitySpan[] = [];
  let lastEnd = 0;

  for (const match of rawMatches) {
    if (match.start >= lastEnd) {
      nonOverlapping.push(match);
      lastEnd = match.end;
    }
  }

  return nonOverlapping;
}

export interface AssignOptions {
  whitelistTokens?: string[]; // IDs or original values the user explicitly whitelisted
}

export interface TokenAssignmentResult {
  sanitizedText: string;
  tokensFoundCount: number;
  entities: DetectedEntity[];
  vaultMap: Record<string, string>;
  reverseVaultMap: Record<string, string>;
}

/**
 * Seam 2: Assign deterministic indexed tokens to non-overlapping spans,
 * apply whitelisting, build the sanitized output text, and populate the bidirectional vault.
 */
export function assignTokens(
  inputText: string,
  spans: RawEntitySpan[],
  options: AssignOptions = {}
): TokenAssignmentResult {
  if (!inputText || spans.length === 0) {
    return {
      sanitizedText: inputText || '',
      tokensFoundCount: 0,
      entities: [],
      vaultMap: {},
      reverseVaultMap: {},
    };
  }

  const whitelist = new Set(options.whitelistTokens || []);

  const originalToTokenMap = new Map<string, string>();
  const tokenToOriginalMap = new Map<string, string>();
  const prefixCounters = new Map<string, number>();
  const entityStats = new Map<
    string,
    {
      token: string;
      originalValue: string;
      category: EntityCategory;
      severity: SecretSeverity;
      ruleName: string;
      ruleId: string;
      count: number;
    }
  >();

  // Helper key normalization (passwords/keys stay case-sensitive, emails become lowercase for lookup)
  function getNormKey(text: string, prefix: string): string {
    if (prefix === 'EMAIL' || prefix === 'COMPANY' || prefix === 'PERSON' || prefix === 'PROJECT') {
      return text.toLowerCase().trim();
    }
    return text;
  }

  const finalizedSpans: MatchedSpan[] = [];

  for (const match of spans) {
    const normKey = getNormKey(match.originalText, match.prefix);

    // If whitelisted by user, do not replace
    if (whitelist.has(match.originalText) || whitelist.has(normKey)) {
      continue;
    }

    let assignedToken = originalToTokenMap.get(normKey);
    if (!assignedToken) {
      const currentCount = (prefixCounters.get(match.prefix) || 0) + 1;
      prefixCounters.set(match.prefix, currentCount);
      assignedToken = `[${match.prefix}_${currentCount}]`;
      originalToTokenMap.set(normKey, assignedToken);
      tokenToOriginalMap.set(assignedToken, match.originalText);
    }

    // Update entity summary statistics
    const existing = entityStats.get(normKey);
    if (existing) {
      existing.count += 1;
    } else {
      entityStats.set(normKey, {
        token: assignedToken,
        originalValue: match.originalText,
        category: match.category,
        severity: match.severity,
        ruleName: match.ruleName,
        ruleId: match.ruleId,
        count: 1,
      });
    }

    finalizedSpans.push({
      start: match.start,
      end: match.end,
      originalText: match.originalText,
      token: assignedToken,
      ruleId: match.ruleId,
      category: match.category,
      severity: match.severity,
      ruleName: match.ruleName,
    });
  }

  // Build Sanitized Output String
  let sanitizedOutput = '';
  let cursor = 0;

  for (const span of finalizedSpans) {
    sanitizedOutput += inputText.slice(cursor, span.start);
    sanitizedOutput += span.token;
    cursor = span.end;
  }
  sanitizedOutput += inputText.slice(cursor);

  // Convert stats to DetectedEntity array
  const entities: DetectedEntity[] = Array.from(entityStats.values()).map((stat, idx) => ({
    id: `entity_${idx}_${stat.token}`,
    originalValue: stat.originalValue,
    token: stat.token,
    category: stat.category,
    severity: stat.severity,
    ruleName: stat.ruleName,
    occurrenceCount: stat.count,
    unmasked: false,
  }));

  // Build plain JS Vault objects
  const vaultMap: Record<string, string> = {};
  const reverseVaultMap: Record<string, string> = {};

  for (const [token, orig] of tokenToOriginalMap.entries()) {
    vaultMap[token] = orig;
    reverseVaultMap[orig] = token;
  }

  return {
    sanitizedText: sanitizedOutput,
    tokensFoundCount: finalizedSpans.length,
    entities,
    vaultMap,
    reverseVaultMap,
  };
}

export interface SanitizeOptions {
  toggles?: Partial<DetectionToggles>;
  customEntities?: CustomEntityDefinition[];
  whitelistTokens?: string[];
}

/**
 * Sanitizes input text, preserving token consistency and building the bidirectional VaultMap.
 * Composes detectEntities and assignTokens seamlessly.
 */
export function sanitizeText(
  inputText: string,
  options: SanitizeOptions = {}
): SanitizationResult {
  const startTime = performance.now();
  if (!inputText || inputText.trim() === '') {
    return {
      sanitizedText: '',
      tokensFoundCount: 0,
      entities: [],
      vaultMap: {},
      reverseVaultMap: {},
      executionTimeMs: 0,
    };
  }

  // 1. Detect spans
  const spans = detectEntities(inputText, {
    toggles: options.toggles,
    customEntities: options.customEntities,
  });

  // 2. Assign tokens and build vault
  const assigned = assignTokens(inputText, spans, {
    whitelistTokens: options.whitelistTokens,
  });

  const executionTimeMs = performance.now() - startTime;

  return {
    ...assigned,
    executionTimeMs,
  };
}

/**
 * Stage 2: Re-Hydrate / Restore AI Response using active VaultMap.
 * Robust against Markdown highlights e.g. `[EMAIL_1]` or **[EMAIL_1]**,
 * and sorts replacement keys descending by length so [EMAIL_10] never collides with [EMAIL_1].
 */
export function rehydrateText(
  aiResponseText: string,
  vaultMap: Record<string, string>
): RehydrateResult {
  if (!aiResponseText || Object.keys(vaultMap).length === 0) {
    return {
      restoredText: aiResponseText || '',
      replacementsCount: 0,
      unmatchedTokens: [],
    };
  }

  let text = aiResponseText;
  let totalReplacements = 0;

  // Sort tokens by string length descending to avoid collision (e.g., [EMAIL_10] before [EMAIL_1])
  const sortedTokens = Object.keys(vaultMap).sort((a, b) => b.length - a.length);

  for (const token of sortedTokens) {
    const originalValue = vaultMap[token];
    if (!originalValue) continue;

    // Remove brackets for inner tag name e.g. "EMAIL_1" from "[EMAIL_1]"
    const innerName = token.replace(/^\[|\]$/g, '');
    const escapedInner = innerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Matches [TOKEN], `[TOKEN]`, **[TOKEN]**, or even bare inner TOKEN in bracketed forms
    // e.g., `\[${escapedInner}\]` with optional surrounding markdown bold, code ticks, etc.
    const tokenRegex = new RegExp(`(?:\`|\\*\\*)?\\[${escapedInner}\\](?:\`|\\*\\*)?`, 'gi');

    const matches = text.match(tokenRegex);
    if (matches) {
      totalReplacements += matches.length;
      text = text.replace(tokenRegex, originalValue);
    }
  }

  // Scan for any lingering unmatched placeholders like [UNKNOWN_1] or tokens not in this vault
  const remainingTokenRegex = /\[[A-Z0-9_]{3,25}_\d+\]/g;
  const lingering = Array.from(new Set(text.match(remainingTokenRegex) || []));

  return {
    restoredText: text,
    replacementsCount: totalReplacements,
    unmatchedTokens: lingering,
  };
}
