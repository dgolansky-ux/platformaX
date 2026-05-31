/**
 * features-v2/channels / ChannelLeadsPanel — list + add + revoke leads.
 *
 * UI enforces the same 1–5 invariant the backend enforces (the action shows
 * but reports the same error message if it's blocked there).
 */
import { useState } from "react";
import type {
  ChannelLeadPublicDTO,
  ChannelLeadRole,
} from "@shared/contracts/channel-leads";
import { MAX_ACTIVE_LEADS } from "@shared/contracts/channel-leads";
import { channelsMockAdapter } from "./channels-mock-adapter";
import styles from "./Channels.module.css";

type Props = {
  channelSlug: string;
  communitySlug: string;
  leads: readonly ChannelLeadPublicDTO[];
  canManageLeads: boolean;
  onChanged: () => Promise<void>;
};

function permissionLabel(p: string): string {
  if (p === "manage_channel_profile") return "Profil";
  if (p === "manage_channel_leads") return "Prowadzący";
  return p;
}

export function ChannelLeadsPanel({ channelSlug, communitySlug, leads, canManageLeads, onChanged }: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [role, setRole] = useState<ChannelLeadRole>("co_lead");
  const [memberOptions, setMemberOptions] = useState<ReadonlyArray<{ userId: string; displayName: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadMembers() {
    const res = await channelsMockAdapter.communityMembers(communitySlug);
    if (res.ok) setMemberOptions(res.value.filter((m) => !leads.some((l) => l.userId === m.userId)));
  }

  async function handleAdd() {
    if (!selectedMemberId) return;
    setError(null);
    setBusy(true);
    const res = await channelsMockAdapter.assignLead({ channelSlug, targetUserId: selectedMemberId, role });
    setBusy(false);
    if (!res.ok) { setError(res.error.message); return; }
    setSelectedMemberId("");
    await onChanged();
  }

  async function handleRevoke(userId: string) {
    setError(null);
    setBusy(true);
    const res = await channelsMockAdapter.revokeLead({ channelSlug, targetUserId: userId });
    setBusy(false);
    if (!res.ok) { setError(res.error.message); return; }
    await onChanged();
  }

  const limitReached = leads.length >= MAX_ACTIVE_LEADS;
  return (
    <section className={styles.section} aria-labelledby="leads-heading">
      <header className={styles.sectionHead}>
        <div>
          <h2 id="leads-heading" className={styles.sectionTitle}>Prowadzący ({leads.length} / {MAX_ACTIVE_LEADS})</h2>
          <p className={styles.sectionSubtitle}>Każdy kanał ma od 1 do {MAX_ACTIVE_LEADS} prowadzących. Prowadzącym musi być członek społeczności-właściciela.</p>
        </div>
      </header>

      <div className={styles.leadsPanel}>
        {leads.map((lead) => (
          <div key={lead.userId} className={styles.leadRow}>
            <span className={styles.leadAvatar} aria-hidden="true">{lead.displayName.charAt(0).toUpperCase()}</span>
            <div className={styles.leadInfo}>
              <p className={styles.leadName}>{lead.displayName}</p>
              <p className={styles.leadRole}>
                {lead.role === "lead" ? "Prowadzący" : "Współprowadzący"}
              </p>
              {lead.permissions.length > 0 ? (
                <div className={styles.leadPerms}>
                  {lead.permissions.map((p) => (
                    <span key={p} className={styles.leadPermBadge}>{permissionLabel(p)}</span>
                  ))}
                </div>
              ) : null}
            </div>
            {canManageLeads ? (
              <div className={styles.leadActions}>
                <button
                  type="button"
                  className={styles.leadRevokeBtn}
                  onClick={() => void handleRevoke(lead.userId)}
                  disabled={busy || leads.length <= 1}
                  aria-label={`Usuń ${lead.displayName} z prowadzących`}
                >
                  Usuń
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {canManageLeads ? (
        <div className={styles.form}>
          <div className={styles.formRow}>
            <label className={styles.fieldLabel}>
              Dodaj prowadzącego
              <select
                className={styles.input}
                value={selectedMemberId}
                onFocus={loadMembers}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                disabled={busy || limitReached}
              >
                <option value="">— wybierz członka społeczności —</option>
                {memberOptions.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.displayName}</option>
                ))}
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Rola
              <select
                className={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value as ChannelLeadRole)}
                disabled={busy || limitReached}
              >
                <option value="co_lead">Współprowadzący</option>
                <option value="lead">Prowadzący</option>
              </select>
            </label>
          </div>
          {error ? <p className={styles.formError} role="alert">{error}</p> : null}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void handleAdd()}
              disabled={busy || !selectedMemberId || limitReached}
            >
              Dodaj prowadzącego
            </button>
            {limitReached ? (
              <span className={styles.notice}>Maksymalna liczba prowadzących osiągnięta ({MAX_ACTIVE_LEADS}).</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
