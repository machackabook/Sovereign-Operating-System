export type NodeUpdateStage =
  | "prepared"
  | "staged"
  | "self-tested"
  | "canary"
  | "promoted"
  | "reconciled"
  | "rolled-back"
  | "quarantined";

export type NodeUpdateEvidenceKind =
  | "manifest-digest"
  | "compatibility"
  | "known-answer"
  | "dependency-check"
  | "canary-health"
  | "promotion-authorization"
  | "ledger-receipt"
  | "rollback-confirmation"
  | "failure-record";

export interface NodeUpdateEvidence {
  kind: NodeUpdateEvidenceKind;
  receiptRef: string;
  verified: boolean;
}

export interface NodeUpdateRecord {
  updateId: string;
  nodeId: string;
  fromVersion: string;
  toVersion: string;
  manifestSha256: string;
  stage: NodeUpdateStage;
  revision: number;
  leaseEpoch: number;
  updatedAtMonotonicMs: number;
  evidence: readonly NodeUpdateEvidence[];
}

export interface NodeUpdateCommand {
  target: NodeUpdateStage;
  expectedRevision: number;
  leaseEpoch: number;
  atMonotonicMs: number;
  evidence: readonly NodeUpdateEvidence[];
}

export type NodeUpdateTransition =
  | { accepted: true; record: NodeUpdateRecord }
  | { accepted: false; reason: string };

const TERMINAL_STAGES = new Set<NodeUpdateStage>([
  "reconciled",
  "rolled-back",
  "quarantined",
]);

const NEXT_STAGES: Record<NodeUpdateStage, readonly NodeUpdateStage[]> = {
  prepared: ["staged", "rolled-back", "quarantined"],
  staged: ["self-tested", "rolled-back", "quarantined"],
  "self-tested": ["canary", "rolled-back", "quarantined"],
  canary: ["promoted", "rolled-back", "quarantined"],
  promoted: ["reconciled", "rolled-back", "quarantined"],
  reconciled: [],
  "rolled-back": [],
  quarantined: [],
};

const REQUIRED_EVIDENCE: Partial<Record<NodeUpdateStage, readonly NodeUpdateEvidenceKind[]>> = {
  staged: ["manifest-digest", "compatibility"],
  "self-tested": ["known-answer", "dependency-check"],
  canary: ["canary-health"],
  promoted: ["promotion-authorization"],
  reconciled: ["ledger-receipt"],
  "rolled-back": ["rollback-confirmation"],
  quarantined: ["failure-record"],
};

function validEvidence(
  supplied: readonly NodeUpdateEvidence[],
  required: readonly NodeUpdateEvidenceKind[],
): boolean {
  return required.every((kind) =>
    supplied.some((item) =>
      item.kind === kind &&
      item.verified === true &&
      typeof item.receiptRef === "string" &&
      item.receiptRef.trim().length > 0
    )
  );
}

/**
 * Pure state transition guard for a staged node update.
 * Persistence, signature verification, lease acquisition, artifact staging,
 * and atomic active-version switching remain responsibilities of the
 * authenticated coordinator/provider adapter.
 */
export function transitionNodeUpdate(
  current: NodeUpdateRecord,
  command: NodeUpdateCommand,
): NodeUpdateTransition {
  if (!current.updateId.trim() || !current.nodeId.trim() ||
      !current.fromVersion.trim() || !current.toVersion.trim() ||
      current.fromVersion === current.toVersion ||
      !/^[a-f0-9]{64}$/i.test(current.manifestSha256)) {
    return { accepted: false, reason: "invalid_update_record" };
  }
  if (!Number.isInteger(current.revision) || current.revision < 0 ||
      !Number.isInteger(current.leaseEpoch) || current.leaseEpoch < 1 ||
      !Number.isFinite(current.updatedAtMonotonicMs) || current.updatedAtMonotonicMs < 0) {
    return { accepted: false, reason: "invalid_update_revision_lease_or_clock" };
  }
  if (command.expectedRevision !== current.revision) {
    return { accepted: false, reason: "revision_conflict" };
  }
  if (command.leaseEpoch !== current.leaseEpoch) {
    return { accepted: false, reason: "stale_or_mismatched_fencing_epoch" };
  }
  if (!Number.isFinite(command.atMonotonicMs) ||
      command.atMonotonicMs < current.updatedAtMonotonicMs) {
    return { accepted: false, reason: "non_monotonic_update_timestamp" };
  }
  if (TERMINAL_STAGES.has(current.stage)) {
    return { accepted: false, reason: "update_is_terminal_create_new_update_id" };
  }
  if (!NEXT_STAGES[current.stage].includes(command.target)) {
    return { accepted: false, reason: "illegal_update_stage_transition" };
  }

  const required = REQUIRED_EVIDENCE[command.target] ?? [];
  if (!validEvidence(command.evidence, required)) {
    return { accepted: false, reason: "required_verified_evidence_missing" };
  }

  const evidenceByKey = new Map<string, NodeUpdateEvidence>();
  for (const item of [...current.evidence, ...command.evidence]) {
    if (item.verified && item.receiptRef.trim()) {
      evidenceByKey.set(item.kind + ":" + item.receiptRef, item);
    }
  }

  return {
    accepted: true,
    record: {
      ...current,
      stage: command.target,
      revision: current.revision + 1,
      updatedAtMonotonicMs: command.atMonotonicMs,
      evidence: [...evidenceByKey.values()],
    },
  };
}
