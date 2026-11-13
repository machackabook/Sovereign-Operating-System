export const commandMap: Record<string, string> = {
  'toggle canvas': 'gaia:toggle-canvas',
  'show terminal': 'gaia:show-terminal',
  'open workbench': 'gaia:open-workbench',
  'open inspection': 'gaia:open-inspection',
  'open network security': 'gaia:open-netsec',
  'open dashboard': 'gaia:open-netsec',
  'open system pages': 'gaia:open-engrams',
  'inspect system': 'gaia:open-inspection',
  'open integrity ledger': 'gaia:open-integrity-ledger',
  'integrity ledger': 'gaia:open-integrity-ledger',
  'verify ledger': 'gaia:open-integrity-ledger',
  'check tampering': 'gaia:open-integrity-ledger',
  'open sso': 'gaia:open-sso-auditor',
  'sso aggregator': 'gaia:open-sso-auditor',
  'audit index': 'gaia:open-sso-auditor',
  'verify putrefaction': 'gaia:open-sso-auditor',
  'compliance audit': 'gaia:open-sso-auditor',
  'living computation': 'gaia:open-sso-auditor',
  'lifecycle': 'gaia:open-lifecycle',
  'observe digest': 'gaia:open-lifecycle',
  'living pulse': 'gaia:open-lifecycle',
  'pulse cycle': 'gaia:open-lifecycle',
  'shed memory': 'gaia:open-lifecycle',
  'unlock all': 'gaia:unlock-all-paths',
  'unlock paths': 'gaia:unlock-all-paths',
};

export interface NexusVoiceCommandEntry {
  id: string;
  phrase: string;
  event: string;
  risk: 'navigation' | 'identity-check';
  requiresIdentityCheck: boolean;
  voiceAllowed: boolean;
}

/** Runtime projection of the canonical NEXUS_COMMAND_REGISTRY recovery namespace. */
export const NEXUS_COMMAND_REGISTRY: readonly NexusVoiceCommandEntry[] = Object.freeze(
  Object.entries(commandMap).map(([phrase, event], index) => Object.freeze({
    id: `CMD-GAIA-VOX-${String(index + 1).padStart(3, '0')}`,
    phrase,
    event,
    risk: event === 'gaia:unlock-all-paths' ? 'identity-check' as const : 'navigation' as const,
    requiresIdentityCheck: event === 'gaia:unlock-all-paths',
    voiceAllowed: true,
  }))
);

export function mapSpeechToEvent(transcript: string): string | null {
  const lower = transcript.toLowerCase().replace(/\\s+/g, ' ').trim();
  const match = NEXUS_COMMAND_REGISTRY.find((entry) => lower.includes(entry.phrase));
  return match?.event || null;
}
