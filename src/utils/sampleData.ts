export const SAMPLE_SENSITIVE_PAYLOAD = `[2026-11-15 09:42:18 UTC] [ERROR] [auth-gateway] Connection failure during customer onboarding webhook:
Request Origin: 192.168.1.105 (Internal NAT: 10.0.4.22, MAC: 00:1A:2B:3C:4D:5E)
Triggered by: alex.morgan@acmepay.io
Tenant: Acme Global Systems (Client Codename: Project Titan)

================= ENVIRONMENT & CREDENTIALS =================
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
OPENAI_API_KEY=sk-proj-7bA8fK9x1qL5mN2vP0wR4tY6uI3oE8dC9vB2n
ANTHROPIC_KEY=sk-ant-api03-abcdef1234567890abcdef1234567890-test_key
DATABASE_URL=postgres://master_admin:P@ssw0rd99!@db.internal.acmepay.io:5432/production_customers?sslmode=require
MONGODB_URI=mongodb+srv://cluster0.example.net/analytics?retryWrites=true&w=majority
STRIPE_LIVE_KEY=sk_test_51MzQ4kL2p9wR4tY6uI3oE8dC9vB2n8fK

User Authentication JWT:
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggTW9yZ2FuIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

================= CLIENT TRANSACTION DETAILS =================
Customer: Sarah Connor (Contact: sarah.connor@cyberdyne.org, Direct: +1 (415) 555-0198)
Billing Address: 742 Evergreen Terrace, San Francisco, CA
Target IBAN: GB29NWBK60161331926819
Payment Card: 4532 0150 1234 5671 (Visa Verified)
US Social Security: 123-45-6789
Authorized Charge Amount: $49,500.00 USD (recurring annual retainer)

Customer Rep Confirmation:
"Please ensure alex.morgan@acmepay.io confirms delivery to Sarah Connor before dispatching to Acme Global Systems server 192.168.1.105."

-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3y1+G0z1EXAMPLEKEYDATAHERE+abcdef1234567890
-----END RSA PRIVATE KEY-----
`;

export const SAMPLE_AI_COMPLETION = `Based on your diagnostic log from **[COMPANY_1]**, here is the remediation plan:

1. **Database & Network Failure:**
   The connection error from client \`[IP_ADDR_1]\` (internal NAT \`[IP_ADDR_2]\`) failed when attempting to reach \`[DB_URI_1]\`. Ensure your firewall allows outbound port 5432.

2. **Revoke Exposed Credentials Immediately:**
   We identified that AWS access key \`[AWS_ACCESS_KEY_1]\`, OpenAI key \`[OPENAI_KEY_1]\`, and Stripe key \`[STRIPE_KEY_1]\` were exposed in plaintext stack traces. Rotate them instantly in your vault.

3. **Customer Billing Incident:**
   The charge of **[AMOUNT_1]** for client **[PERSON_1]** (email: \`[EMAIL_2]\`, phone: \`[PHONE_1]\`) associated with IBAN \`[IBAN_1]\` and card ending in \`[CARD_NUM_1]\` did not settle.
   Please notify [EMAIL_1] regarding **[PROJECT_1]** status.`;
