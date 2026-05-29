import type {
  CommunityMemberSummaryDTO,
  CommunityRole,
} from "@shared/contracts/communities";
import styles from "../CommunityManage.module.css";

const ROLE_LABEL: Record<CommunityRole, string> = {
  founder: "Founder",
  admin: "Admin",
  moderator: "Moderator",
  member: "Członek",
};

const ROLE_BADGE_CLASS: Record<CommunityRole, string> = {
  founder: styles.founderBadge,
  admin: styles.roleBadgeAdmin,
  moderator: styles.roleBadgeMod,
  member: styles.roleBadgeMember,
};

const ROLE_ICON: Record<CommunityRole, string> = {
  founder: "👑",
  admin: "🛡",
  moderator: "🛡",
  member: "·",
};

export type MembersPanelProps = {
  members: readonly CommunityMemberSummaryDTO[];
  viewerUserId: string;
  viewerRole: CommunityRole | null;
  onChangeRole: (targetUserId: string, nextRole: Exclude<CommunityRole, "founder">) => Promise<void>;
  onRemove: (targetUserId: string) => Promise<void>;
};

function avatarInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function canActOn(
  viewerRole: CommunityRole | null,
  targetRole: CommunityRole,
  isSelf: boolean,
): boolean {
  if (isSelf || targetRole === "founder") return false;
  if (viewerRole === "founder") return true;
  if (viewerRole === "admin") return targetRole !== "admin";
  return false;
}

function RoleSelector({
  value,
  onChange,
}: {
  value: CommunityRole;
  onChange: (next: Exclude<CommunityRole, "founder">) => void;
}) {
  return (
    <label className={styles.roleSelectLabel}>
      <span className="sr-only">Zmień rolę</span>
      <select
        className={styles.roleSelect}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "admin" || next === "moderator" || next === "member") {
            onChange(next);
          }
        }}
      >
        <option value="admin">Mianuj administratorem</option>
        <option value="moderator">Mianuj moderatorem</option>
        <option value="member">Degraduj do członka</option>
      </select>
    </label>
  );
}

export function MembersPanel({
  members,
  viewerUserId,
  viewerRole,
  onChangeRole,
  onRemove,
}: MembersPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="members-heading">
      <h2 id="members-heading" className={styles.panelTitle}>Członkowie ({members.length})</h2>
      <ul className={styles.list}>
        {members.map((member) => {
          const isSelf = member.userId === viewerUserId;
          const actionable = canActOn(viewerRole, member.role, isSelf);
          return (
            <li key={member.userId} className={styles.listItem}>
              <div className={styles.memberLeft}>
                <span className={styles.memberAvatar} aria-hidden>{avatarInitial(member.displayName)}</span>
                <div>
                  <p className={styles.listItemTitle}>
                    {member.displayName}
                    {isSelf ? <span aria-hidden> · ty</span> : null}
                  </p>
                  <p className={styles.listItemMeta}>
                    od {new Date(member.joinedAt).toLocaleDateString("pl-PL")}
                  </p>
                </div>
              </div>
              <div className={styles.listItemActions}>
                <span className={ROLE_BADGE_CLASS[member.role]} aria-label={`Rola: ${ROLE_LABEL[member.role]}`}>
                  <span aria-hidden>{ROLE_ICON[member.role]}</span>
                  {ROLE_LABEL[member.role]}
                </span>
                {actionable ? (
                  <>
                    <RoleSelector value={member.role} onChange={(next) => void onChangeRole(member.userId, next)} />
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => void onRemove(member.userId)}
                      aria-label={`Usuń ze społeczności: ${member.displayName}`}
                    >
                      Usuń
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
