import React, { useState } from 'react';
import {
  ShieldAlert,
  CreditCard,
  Globe,
  Tag,
  Eye,
  EyeOff,
  CheckCircle2,
  Undo2,
  Lock,
  Search,
  Filter,
} from 'lucide-react';
import type { DetectedEntity, EntityCategory } from '../types/ghostshield';

interface VaultSidebarProps {
  entities: DetectedEntity[];
  whitelistTokens: string[];
  onToggleWhitelist: (value: string) => void;
  vaultMap: Record<string, string>;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  entities,
  whitelistTokens,
  onToggleWhitelist,
  vaultMap,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'ALL' | EntityCategory>('ALL');

  const whitelistSet = new Set(whitelistTokens);

  // Group entities by category
  const filteredEntities = entities.filter((item) => {
    const matchesTab = activeTab === 'ALL' || item.category === activeTab;
    const matchesSearch =
      filterQuery.trim() === '' ||
      item.token.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.ruleName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.originalValue.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const criticalCount = entities.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = entities.filter((e) => e.severity === 'HIGH').length;
  const mediumCount = entities.filter((e) => e.severity === 'MEDIUM').length;

  const toggleReveal = (token: string) => {
    setRevealedTokens((prev) => ({
      ...prev,
      [token]: !prev[token],
    }));
  };

  const getCategoryIcon = (category: EntityCategory) => {
    switch (category) {
      case 'SECRET':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'FINANCIAL':
        return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
      case 'NETWORK_PII':
        return <Globe className="w-3.5 h-3.5 text-sky-400" />;
      case 'CUSTOM':
        return <Tag className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 font-semibold">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
            HIGH
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 font-medium">
            MEDIUM
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111113] border-l border-[#27272A] w-88 shrink-0">
      {/* Vault Header */}
      <div className="p-3.5 border-b border-[#27272A] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-tight text-[#FAFAFA] flex items-center gap-1.5">
                Session Vault
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  {Object.keys(vaultMap).length} Active
                </span>
              </h2>
              <p className="text-[11px] text-[#A1A1AA]">Bidirectional Redaction Map</p>
            </div>
          </div>
        </div>

        {/* Severity Metrics Pills */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="flex flex-col items-center justify-center p-1.5 rounded bg-[#18181B] border border-[#27272A]">
            <span className="text-[10px] text-rose-400 font-mono">Critical</span>
            <span className="text-xs font-bold font-mono text-[#FAFAFA]">{criticalCount}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 rounded bg-[#18181B] border border-[#27272A]">
            <span className="text-[10px] text-amber-400 font-mono">High PII</span>
            <span className="text-xs font-bold font-mono text-[#FAFAFA]">{highCount}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 rounded bg-[#18181B] border border-[#27272A]">
            <span className="text-[10px] text-sky-400 font-mono">Standard</span>
            <span className="text-xs font-bold font-mono text-[#FAFAFA]">{mediumCount}</span>
          </div>
        </div>

        {/* Search & Category Filter Tabs */}
        <div className="relative mt-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#71717A]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search tokens or values..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#18181B] border border-[#27272A] rounded-md text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-emerald-500/60 font-mono"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-medium text-[#A1A1AA]">
          {(['ALL', 'SECRET', 'FINANCIAL', 'NETWORK_PII', 'CUSTOM'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'hover:text-zinc-200'
              }`}
            >
              {tab === 'NETWORK_PII' ? 'PII' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* List of Detected Entities in Vault */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredEntities.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Filter className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No items in this category</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Paste or type sensitive content to generate tokens
            </p>
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const isWhitelisted = whitelistSet.has(entity.originalValue);
            const isRevealed = !!revealedTokens[entity.token];

            return (
              <div
                key={entity.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  isWhitelisted
                    ? 'bg-zinc-900/40 border-zinc-800 opacity-60'
                    : 'bg-[#18181B]/80 hover:bg-[#18181B] border-[#27272A]'
                }`}
              >
                {/* Header row: Token Pill & Actions */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getCategoryIcon(entity.category)}
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-900 text-amber-300 border border-amber-500/30 truncate">
                      {entity.token}
                    </span>
                    {entity.occurrenceCount > 1 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700" title="Occurrences in document">
                        ×{entity.occurrenceCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {getSeverityBadge(entity.severity)}
                  </div>
                </div>

                {/* Subtitle / Rule info */}
                <div className="text-[10px] font-mono text-[#71717A] mb-1.5">
                  {entity.ruleName}
                </div>

                {/* Secret Value Row with Blur / Reveal */}
                <div className="p-1.5 rounded bg-[#09090B] border border-[#27272A] flex items-center justify-between gap-2">
                  <div className="font-mono text-[11px] truncate flex-1 select-all">
                    {isRevealed ? (
                      <span className="text-rose-200">{entity.originalValue}</span>
                    ) : (
                      <span className="blur-[5px] select-none text-zinc-400 tracking-wider">
                        {entity.originalValue.slice(0, 4)}••••••••••••••••
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleReveal(entity.token)}
                    className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                    title={isRevealed ? 'Hide secret' : 'Reveal original value'}
                    aria-label={isRevealed ? `Hide secret for ${entity.token}` : `Reveal original value for ${entity.token}`}
                  >
                    {isRevealed ? (
                      <EyeOff className="w-3.5 h-3.5 text-zinc-300" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Bottom Action: Unmask / Whitelist */}
                <div className="mt-2 flex items-center justify-end">
                  <button
                    onClick={() => onToggleWhitelist(entity.originalValue)}
                    className={`text-[10px] font-mono flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                      isWhitelisted
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {isWhitelisted ? (
                      <>
                        <Undo2 className="w-3 h-3" />
                        <span>Re-Mask Item</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Whitelist (Allow Unmasked)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-[#27272A] bg-[#0C0C0E] text-[11px] text-[#71717A] flex items-center justify-between">
        <span>Tokens auto-wipe on tab close</span>
        <span className="font-mono text-emerald-400">100% Client-Side</span>
      </div>
    </div>
  );
};
