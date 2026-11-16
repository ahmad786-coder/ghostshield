import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { rehydrateText } from '../utils/sanitizerEngine';

interface RehydrateStageProps {
  vaultMap: Record<string, string>;
  isImportedVault?: boolean;
  onLoadSampleAiResponse: () => void;
}

export const RehydrateStage: React.FC<RehydrateStageProps> = ({
  vaultMap,
  isImportedVault = false,
  onLoadSampleAiResponse,
}) => {
  const [aiResponseInput, setAiResponseInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Instant re-hydration
  const { restoredText, replacementsCount, unmatchedTokens } = rehydrateText(
    aiResponseInput,
    vaultMap
  );

  const handleCopyRestored = async () => {
    if (!restoredText) return;
    try {
      await navigator.clipboard.writeText(restoredText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy restored text', e);
    }
  };

  const handleDownloadRestored = () => {
    if (!restoredText) return;
    const blob = new Blob([restoredText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rehydrated_ai_output_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#09090B]">
      {/* LEFT PANE: AI Response Input */}
      <div className="flex-1 flex flex-col h-full border-r border-[#27272A] min-w-0">
        <div className="h-10 px-4 bg-[#111113] border-b border-[#27272A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
              AI Response Input (Contains Masked Placeholders)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {aiResponseInput.length.toLocaleString()} chars
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLoadSampleAiResponse();
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Load sample AI completion containing [API_KEY_1], [EMAIL_1], etc."
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample AI Reply</span>
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="flex-1 p-3 flex flex-col min-h-0">
          <textarea
            value={aiResponseInput}
            onChange={(e) => setAiResponseInput(e.target.value)}
            placeholder="Paste the completion or answer received from ChatGPT / Claude / Gemini here (e.g., text containing [COMPANY_1], [EMAIL_1], [API_KEY_1])..."
            className="w-full flex-1 p-3.5 bg-[#0D0D10] text-[#FAFAFA] font-mono text-xs leading-relaxed rounded-lg border border-[#27272A] focus:outline-none focus:border-amber-500/60 resize-none placeholder-zinc-600"
            spellCheck={false}
          />
        </div>

        {/* Informational Guidance */}
        <div className="p-3 border-t border-[#27272A] bg-[#0E0E11] text-[11px] text-zinc-400 flex items-center justify-between">
          <span>
            Active Vault Map has {Object.keys(vaultMap).length} tokens available for replacement.
            <span className="ml-1 text-zinc-500 font-mono">
              · {isImportedVault ? 'Imported vault' : 'Live session vault'}
            </span>
          </span>
          <span className="font-mono text-zinc-500">Case & Markdown Tolerant</span>
        </div>
      </div>

      {/* RIGHT PANE: Restored Final Output */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="h-10 px-4 bg-[#111113] border-b border-[#27272A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              Restored & Re-Hydrated Final Output
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {replacementsCount} Replaced
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadRestored}
              disabled={!restoredText}
              className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-40"
              title="Download restored text to file"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleCopyRestored}
              disabled={!restoredText}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              } disabled:opacity-40`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Restored Output!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Restored Output</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Restored Output Preview */}
        <div className="flex-1 p-3 flex flex-col min-h-0">
          <div className="w-full flex-1 p-3.5 bg-[#0D0D10] text-[#FAFAFA] font-mono text-xs leading-relaxed rounded-lg border border-[#27272A] overflow-y-auto whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-white">
            {restoredText ? (
              restoredText
            ) : (
              <span className="text-zinc-600 font-mono text-xs">
                Restored text with all original credentials and client details returned to their exact locations will appear here...
              </span>
            )}
          </div>
        </div>

        {/* Warning if unmatched tokens exist */}
        {unmatchedTokens.length > 0 && (
          <div className="p-2.5 px-4 border-t border-amber-900/40 bg-amber-950/20 text-[11px] text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Found {unmatchedTokens.length} token(s) not in current vault: {unmatchedTokens.slice(0, 3).join(', ')}
                {unmatchedTokens.length > 3 ? '...' : ''}
              </span>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono">
              Import original Vault key JSON if sanitized in an earlier session
            </span>
          </div>
        )}

        {unmatchedTokens.length === 0 && (
          <div className="p-2.5 px-4 border-t border-[#27272A] bg-[#0E0E11] text-[11px] text-zinc-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full bidirectional fidelity — 100% ready to use in your codebase or report</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">
              Zero cloud transmission
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
