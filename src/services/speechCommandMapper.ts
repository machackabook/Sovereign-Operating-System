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

export function mapSpeechToEvent(transcript: string): string | null {
  const lower = transcript.toLowerCase();
  for (const [phrase, event] of Object.entries(commandMap)) {
    if (lower.includes(phrase)) {
      return event;
    }
  }
  return null;
}
