import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Download,
  Upload,
  Lock,
  Layers,
  Settings2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { DetectionToggles } from '../utils/sanitizerEngine';

export interface ImportStatus {
  kind: 'success' | 'error';
  message: string;
}

interface TopZeroTrustBarProps {
  onLoadSample: () => void;
  onExportVault: () => void;
  onImportVault: (file: File) => void;
  onClearSession: () => void;
  toggles: DetectionToggles;
  onToggleCategory: (key: keyof DetectionToggles) => void;
  activeStage: 'STAGE_1_SANITIZE' | 'STAGE_2_REHYDRATE';
  onChangeStage: (stage: 'STAGE_1_SANITIZE' | 'STAGE_2_REHYDRATE') => void;
  vaultSize: number;
  importStatus: ImportStatus | null;
}

export const TopZeroTrustBar: React.FC<TopZeroTrustBarProps> = ({
  onLoadSample,
  onExportVault,
  onImportVault,
  onClearSession,
  toggles,
  onToggleCategory,
  activeStage,
  onChangeStage,
  vaultSize,
  importStatus,
}) => {
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportVault(e.target.files[0]);
    }
    // Reset file input value so selecting the same file again triggers onChange
    e.target.value = '';
  };

  return (
    <header className="h-14 bg-[#0E0E11] border-b border-[#27272A] flex items-center justify-between px-4 sm:px-6 select-none shrink-0 z-30">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Brand & Air-Gapped Trust Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-xs">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[#FAFAFA]">
                GhostShield
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                v1.0 Zero-Trust
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] hidden sm:block">
              100% Client-Side Reversible PII & Secret Anonymizer
            </p>
          </div>
        </div>

        {/* Live Zero-Trust Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Air-Gapped RAM Mode — 0 Network Requests • Vault Auto-Wipes on Close</span>
        </div>
      </div>

      {/* Center 2-Stage Navigation Switcher */}
      <div className="flex items-center bg-[#18181B] p-1 rounded-lg border border-[#27272A]">
        <button
          onClick={() => onChangeStage('STAGE_1_SANITIZE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeStage === 'STAGE_1_SANITIZE'
              ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Stage 1: Sanitize (To AI)</span>
        </button>

        <button
          onClick={() => onChangeStage('STAGE_2_REHYDRATE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeStage === 'STAGE_2_REHYDRATE'
              ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/80'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Stage 2: Re-Hydrate (From AI)</span>
          {vaultSize > 0 && (
            <span className="text-[10px] font-mono px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {vaultSize}
            </span>
          )}
        </button>
      </div>

      {/* Action Controls & Utilities */}
      <div className="flex items-center gap-2">
        {/* Inline Import/Export Status Feedback */}
        {importStatus && (
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border max-w-xs truncate transition-all ${
              importStatus.kind === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
            }`}
            title={importStatus.message}
          >
            {importStatus.kind === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            )}
            <span className="truncate">{importStatus.message}</span>
          </div>
        )}

        {/* Load Sample Button */}
        <button
          onClick={onLoadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
          title="Load realistic stack trace with API keys, client email, IBAN, and company name"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Load Sample Sensitive Payload</span>
          <span className="lg:hidden">Sample</span>
        </button>

        {/* Export / Import Vault */}
        <button
          onClick={onExportVault}
          disabled={vaultSize === 0}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#18181B] hover:bg-zinc-800 text-zinc-300 border border-[#27272A] transition-colors cursor-pointer disabled:opacity-40"
          title="Save active token mapping dictionary to a local .json file"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden xl:inline">Export Vault</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#18181B] hover:bg-zinc-800 text-zinc-300 border border-[#27272A] transition-colors cursor-pointer"
          title="Import previously saved Vault JSON to re-hydrate responses anytime"
        >
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden xl:inline">Import Vault</span>
        </button>

        {/* Category Filter Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowConfigMenu(!showConfigMenu)}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              showConfigMenu
                ? 'bg-zinc-700 text-white border-zinc-600'
                : 'bg-[#18181B] text-zinc-300 border-[#27272A] hover:bg-zinc-800'
            }`}
            title="Configure active detection categories"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {showConfigMenu && (
            <div className="absolute right-0 top-10 w-64 p-3 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl z-50 flex flex-col gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Active Detection Categories
              </span>

              <label className="flex items-center justify-between text-xs text-zinc-300 hover:text-white cursor-pointer py-1">
                <span>Secrets & API Keys</span>
                <input
                  type="checkbox"
                  checked={toggles.maskSecrets}
                  onChange={() => onToggleCategory('maskSecrets')}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-zinc-300 hover:text-white cursor-pointer py-1">
                <span>Financial (Cards, IBAN, SSN)</span>
                <input
                  type="checkbox"
                  checked={toggles.maskFinancial}
                  onChange={() => onToggleCategory('maskFinancial')}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-zinc-300 hover:text-white cursor-pointer py-1">
                <span>Network & Contact PII (Email, IP)</span>
                <input
                  type="checkbox"
                  checked={toggles.maskNetworkPii}
                  onChange={() => onToggleCategory('maskNetworkPii')}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-zinc-300 hover:text-white cursor-pointer py-1">
                <span>Currency Amounts</span>
                <input
                  type="checkbox"
                  checked={toggles.maskCurrency}
                  onChange={() => onToggleCategory('maskCurrency')}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-zinc-300 hover:text-white cursor-pointer py-1">
                <span>Custom Named Entities</span>
                <input
                  type="checkbox"
                  checked={toggles.maskCustom}
                  onChange={() => onToggleCategory('maskCustom')}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* Clear Session */}
        <button
          onClick={onClearSession}
          className="p-1.5 rounded-lg bg-[#18181B] text-zinc-400 hover:text-rose-400 border border-[#27272A] hover:border-rose-900/60 transition-colors cursor-pointer"
          title="Clear all text and reset vault"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
