import { useState, useMemo } from 'react';
import type {
  CustomEntityDefinition,
  VaultExport,
} from './types/ghostshield';
import {
  sanitizeText,
  DEFAULT_DETECTION_TOGGLES,
  type DetectionToggles,
} from './utils/sanitizerEngine';
import { extractTextFromPdf, sanitizeCsvFile } from './utils/fileParsers';
import {
  validateVaultExport,
  MAX_VAULT_FILE_BYTES,
} from './utils/vaultValidation';
import {
  SAMPLE_SENSITIVE_PAYLOAD,
} from './utils/sampleData';
import { TopZeroTrustBar, type ImportStatus } from './components/TopZeroTrustBar';
import { SanitizeStage } from './components/SanitizeStage';
import { RehydrateStage } from './components/RehydrateStage';
import { VaultSidebar } from './components/VaultSidebar';

export function App() {
  // Navigation & View
  const [activeStage, setActiveStage] = useState<'STAGE_1_SANITIZE' | 'STAGE_2_REHYDRATE'>('STAGE_1_SANITIZE');

  // Input & Detection State
  const [rawInput, setRawInput] = useState<string>('');
  const [toggles, setToggles] = useState<DetectionToggles>(DEFAULT_DETECTION_TOGGLES);
  const [customEntities, setCustomEntities] = useState<CustomEntityDefinition[]>([
    { id: 'c1', text: 'Acme Global Systems', label: 'COMPANY' },
    { id: 'c2', text: 'Sarah Connor', label: 'PERSON' },
    { id: 'c3', text: 'Project Titan', label: 'PROJECT' },
  ]);
  const [whitelistTokens, setWhitelistTokens] = useState<string[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Vault Import State & Inline Status
  const [importedVaultMap, setImportedVaultMap] = useState<Record<string, string> | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  // Compute live sanitization result
  const sanitizationResult = useMemo(() => {
    return sanitizeText(rawInput, {
      toggles,
      customEntities,
      whitelistTokens,
    });
  }, [rawInput, toggles, customEntities, whitelistTokens]);

  // Precedence rule: RehydrateStage receives the imported vault ONLY when the live vault
  // is empty; when the live vault is non-empty the live vault wins (the import is for later sessions, not for overriding a live session).
  const liveVaultSize = Object.keys(sanitizationResult.vaultMap).length;
  const activeRehydrateVaultMap = useMemo<Record<string, string>>(() => {
    if (liveVaultSize > 0) {
      return sanitizationResult.vaultMap;
    }
    return importedVaultMap || {};
  }, [liveVaultSize, sanitizationResult.vaultMap, importedVaultMap]);

  const isUsingImportedVault = liveVaultSize === 0 && importedVaultMap !== null;

  // Load Built-in Realistic Sample
  const handleLoadSample = () => {
    setRawInput(SAMPLE_SENSITIVE_PAYLOAD);
    setWhitelistTokens([]);
    setActiveStage('STAGE_1_SANITIZE');
  };

  // Clear Session: resets inputs, whitelists, imported vault, and import status
  const handleClearSession = () => {
    setRawInput('');
    setWhitelistTokens([]);
    setImportedVaultMap(null);
    setImportStatus(null);
  };

  // Toggle Detection Category
  const handleToggleCategory = (key: keyof DetectionToggles) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Add / Remove Custom Entities
  const handleAddCustomEntity = (
    text: string,
    label: 'COMPANY' | 'PERSON' | 'PROJECT' | 'CUSTOM'
  ) => {
    const newEntity: CustomEntityDefinition = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text,
      label,
    };
    setCustomEntities((prev) => [...prev, newEntity]);
  };

  const handleRemoveCustomEntity = (id: string) => {
    setCustomEntities((prev) => prev.filter((e) => e.id !== id));
  };

  // Whitelist / Allow unmask toggle
  const handleToggleWhitelist = (value: string) => {
    setWhitelistTokens((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  // Export Vault to local JSON file
  const handleExportVault = () => {
    const vaultExport: VaultExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      description: 'GhostShield Local Air-Gapped Session Vault',
      vaultMap: sanitizationResult.vaultMap,
      entities: sanitizationResult.entities.map((e) => ({
        token: e.token,
        originalValue: e.originalValue,
        category: e.category,
        ruleName: e.ruleName,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vaultExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GhostShield_Vault_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setImportStatus({
      kind: 'success',
      message: 'Vault exported — this file contains your original secrets in plaintext. Keep it safe.',
    });
  };

  // Import Vault from JSON with strict validation & size checking
  const handleImportVault = async (file: File) => {
    setImportStatus(null);

    // (a) File size check without reading
    if (file.size > MAX_VAULT_FILE_BYTES) {
      setImportStatus({
        kind: 'error',
        message: `Vault file exceeds 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      });
      return;
    }

    // (b) Read text and parse JSON
    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      setImportStatus({
        kind: 'error',
        message: 'Invalid JSON file: parsing failed',
      });
      return;
    }

    // (c) Pure validation
    const validation = validateVaultExport(parsed);
    if (!validation.ok) {
      setImportStatus({
        kind: 'error',
        message: validation.error,
      });
      return;
    }

    // (d) On success: store imported vault and switch to Stage 2
    const tokenCount = Object.keys(validation.vault.vaultMap).length;
    setImportedVaultMap(validation.vault.vaultMap);
    setActiveStage('STAGE_2_REHYDRATE');
    setImportStatus({
      kind: 'success',
      message: `Vault imported (${tokenCount} tokens ready for Stage 2)`,
    });
  };

  // File Upload Handler (TXT, MD, JSON, LOG, CSV, ENV, PDF)
  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessingFile(true);
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'pdf') {
        const extractedText = await extractTextFromPdf(file);
        setRawInput(extractedText);
      } else if (extension === 'csv') {
        const { sanitizedCsvString } = await sanitizeCsvFile(file, {
          toggles,
          customEntities,
          whitelistTokens,
        });
        setRawInput(sanitizedCsvString);
      } else {
        // Plain text, markdown, json, env, log
        const text = await file.text();
        setRawInput(text);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      alert('Could not read file. Ensure it is a valid text, log, CSV, or PDF document.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090B] text-[#FAFAFA] overflow-hidden select-none">
      {/* Top Zero-Trust Bar */}
      <TopZeroTrustBar
        onLoadSample={handleLoadSample}
        onExportVault={handleExportVault}
        onImportVault={handleImportVault}
        onClearSession={handleClearSession}
        toggles={toggles}
        onToggleCategory={handleToggleCategory}
        activeStage={activeStage}
        onChangeStage={setActiveStage}
        vaultSize={Object.keys(activeRehydrateVaultMap).length}
        importStatus={importStatus}
      />

      {/* Main 2-Stage Split Workbench */}
      <div className="flex-1 flex overflow-hidden">
        {/* Stage Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {activeStage === 'STAGE_1_SANITIZE' ? (
            <SanitizeStage
              rawInput={rawInput}
              onRawInputChange={setRawInput}
              sanitizationResult={sanitizationResult}
              customEntities={customEntities}
              onAddCustomEntity={handleAddCustomEntity}
              onRemoveCustomEntity={handleRemoveCustomEntity}
              onFileUpload={handleFileUpload}
              isProcessingFile={isProcessingFile}
            />
          ) : (
            <RehydrateStage
              vaultMap={activeRehydrateVaultMap}
              isImportedVault={isUsingImportedVault}
              onLoadSampleAiResponse={() => {
                // If rawInput was empty, load the sample so vaultMap has matching tokens
                if (!rawInput) {
                  setRawInput(SAMPLE_SENSITIVE_PAYLOAD);
                }
              }}
            />
          )}
        </div>

        {/* Right Sidebar: Live Redaction Vault */}
        <VaultSidebar
          entities={sanitizationResult.entities}
          whitelistTokens={whitelistTokens}
          onToggleWhitelist={handleToggleWhitelist}
          vaultMap={sanitizationResult.vaultMap}
        />
      </div>
    </div>
  );
}

export default App;
