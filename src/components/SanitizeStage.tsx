import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  UploadCloud,
  Plus,
  Trash2,
  Tag,
} from 'lucide-react';
import type { CustomEntityDefinition, SanitizationResult } from '../types/ghostshield';

interface SanitizeStageProps {
  rawInput: string;
  onRawInputChange: (text: string) => void;
  sanitizationResult: SanitizationResult;
  customEntities: CustomEntityDefinition[];
  onAddCustomEntity: (text: string, label: 'COMPANY' | 'PERSON' | 'PROJECT' | 'CUSTOM') => void;
  onRemoveCustomEntity: (id: string) => void;
  onFileUpload: (file: File) => void;
  isProcessingFile: boolean;
}

export const SanitizeStage: React.FC<SanitizeStageProps> = ({
  rawInput,
  onRawInputChange,
  sanitizationResult,
  customEntities,
  onAddCustomEntity,
  onRemoveCustomEntity,
  onFileUpload,
  isProcessingFile,
}) => {
  const [copied, setCopied] = useState(false);
  const [newEntityText, setNewEntityText] = useState('');
  const [newEntityLabel, setNewEntityLabel] = useState<
    'COMPANY' | 'PERSON' | 'PROJECT' | 'CUSTOM'
  >('COMPANY');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCopySafePrompt = async () => {
    if (!sanitizationResult.sanitizedText) return;
    try {
      await navigator.clipboard.writeText(sanitizationResult.sanitizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownloadSanitized = () => {
    if (!sanitizationResult.sanitizedText) return;
    const blob = new Blob([sanitizationResult.sanitizedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized_ai_prompt_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleAddEntitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityText.trim()) return;
    onAddCustomEntity(newEntityText.trim(), newEntityLabel);
    setNewEntityText('');
  };

  // Render sanitized text with inline colored pill tokens
  const renderHighlightedSanitizedText = () => {
    const text = sanitizationResult.sanitizedText;
    if (!text) {
      return (
        <span className="text-zinc-600 font-mono text-xs">
          Anonymized output with reversible tokens will render here in real-time...
        </span>
      );
    }

    // Split on tokens like [TOKEN_1], [API_KEY_1], etc.
    const parts = text.split(/(\[[A-Z0-9_]{3,30}_\d+\])/g);

    return parts.map((part, index) => {
      if (/^\[[A-Z0-9_]{3,30}_\d+\]$/.test(part)) {
        // Color-code based on token type
        let badgeColor = 'bg-amber-950/70 text-amber-300 border-amber-600/40';
        if (part.includes('KEY') || part.includes('SECRET') || part.includes('TOKEN') || part.includes('PRIVATE')) {
          badgeColor = 'bg-rose-950/70 text-rose-300 border-rose-600/40';
        } else if (part.includes('COMPANY') || part.includes('PERSON') || part.includes('PROJECT')) {
          badgeColor = 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40';
        } else if (part.includes('EMAIL') || part.includes('IP_') || part.includes('PHONE')) {
          badgeColor = 'bg-sky-950/70 text-sky-300 border-sky-600/40';
        }

        return (
          <span
            key={index}
            className={`inline-block font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border mx-0.5 shadow-xs select-all ${badgeColor}`}
            title="Click or select token"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#09090B]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.log,.csv,.env,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* LEFT PANE: Raw Sensitive Input */}
      <div className="flex-1 flex flex-col h-full border-r border-[#27272A] min-w-0">
        {/* Pane Toolbar */}
        <div className="h-10 px-4 bg-[#111113] border-b border-[#27272A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Raw Sensitive Input
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {rawInput.length.toLocaleString()} chars
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Upload file (.txt, .md, .json, .log, .csv, .env, .pdf)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload Document / File</span>
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-3 flex flex-col min-h-0 relative">
          <textarea
            value={rawInput}
            onChange={(e) => onRawInputChange(e.target.value)}
            placeholder="Paste raw error traces, contracts, code containing API keys, database credentials, emails, customer records, or financial data..."
            className="w-full flex-1 p-3.5 bg-[#0D0D10] text-[#FAFAFA] font-mono text-xs leading-relaxed rounded-lg border border-[#27272A] focus:outline-none focus:border-zinc-500 resize-none placeholder-zinc-600"
            spellCheck={false}
          />

          {isProcessingFile && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-700">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                Parsing document locally in browser memory...
              </div>
            </div>
          )}
        </div>

        {/* Custom Entities Management Strip */}
        <div className="p-3 border-t border-[#27272A] bg-[#0E0E11] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              Custom Target Entities to Mask
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Auto-tokenized consistently
            </span>
          </div>

          {/* Input form */}
          <form onSubmit={handleAddEntitySubmit} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={newEntityText}
              onChange={(e) => setNewEntityText(e.target.value)}
              placeholder="e.g. Acme Corp, Shazir, Project Titan"
              className="flex-1 px-2.5 py-1 text-xs bg-[#18181B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 font-mono"
            />

            <select
              value={newEntityLabel}
              onChange={(e) => setNewEntityLabel(e.target.value as any)}
              className="px-2 py-1 text-xs bg-[#18181B] border border-[#27272A] rounded-md text-zinc-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="COMPANY">COMPANY</option>
              <option value="PERSON">PERSON</option>
              <option value="PROJECT">PROJECT</option>
              <option value="CUSTOM">CUSTOM</option>
            </select>

            <button
              type="submit"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white border border-zinc-700 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add</span>
            </button>
          </form>

          {/* List of active custom entities */}
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {customEntities.map((ce) => (
              <span
                key={ce.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300"
              >
                <span className="text-[10px] text-emerald-400 font-semibold">{ce.label}:</span>
                <span>{ce.text}</span>
                <button
                  type="button"
                  onClick={() => onRemoveCustomEntity(ce.id)}
                  className="text-zinc-500 hover:text-rose-400 ml-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANE: Live Anonymized Output (Safe for AI) */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Pane Toolbar */}
        <div className="h-10 px-4 bg-[#111113] border-b border-[#27272A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              Live Sanitized Output (Safe for AI)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {sanitizationResult.tokensFoundCount} Replaced
            </span>
            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
              ({sanitizationResult.executionTimeMs.toFixed(1)}ms)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSanitized}
              disabled={!sanitizationResult.sanitizedText}
              className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-40"
              title="Download sanitized text to local file"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleCopySafePrompt}
              disabled={!sanitizationResult.sanitizedText}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              } disabled:opacity-40`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Sanitized Text!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Safe Prompt for AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visual Highlight Output View */}
        <div className="flex-1 p-3 flex flex-col min-h-0">
          <div className="w-full flex-1 p-3.5 bg-[#0D0D10] text-[#FAFAFA] font-mono text-xs leading-relaxed rounded-lg border border-[#27272A] overflow-y-auto whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-white">
            {renderHighlightedSanitizedText()}
          </div>
        </div>

        {/* Safety Indicator Banner */}
        <div className="p-2.5 px-4 border-t border-[#27272A] bg-[#0E0E11] text-[11px] text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Ready to paste safely into ChatGPT, Claude, Gemini, or local LLMs</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">
            Paste reply into Stage 2 to re-hydrate original values
          </span>
        </div>
      </div>
    </div>
  );
};
