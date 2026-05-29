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

export type MembersPanelProps = {
  members: readonly CommunityMemberSummaryDTO[];
  onChangeRole: (targetUserId: string, nextRole: Exclude<CommunityRole, "founder">) => Promise<void>;
};

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
        <option value="admin">Admin</option>
        <option value="moderator">Moderator</option>
        <option value="member">Członek</option>
      </select>
    </label>
  );
}

export function MembersPanel({ members, onChangeRole }: MembersPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="members-heading">
      <h2 id="members-heading" className={styles.panelTitle}>Członkowie ({members.length})</h2>
      <ul className={styles.list}>
        {members.map((member) => (
          <li key={member.userId} className={styles.listItem}>
            <div>
              <p className={styles.listItemTitle}>{member.displayName}</p>
              <p className={styles.listItemMeta}>
                {ROLE_LABEL[member.role]} · od {new Date(member.joinedAt).toLocaleDateString("pl-PL")}
              </p>
            </div>
            {member.role !== "founder" ? (
              <div className={styles.listItemActions}>
                <RoleSelector value={member.role} onChange={(next) => void onChangeRole(member.userId, next)} />
              </div>
            ) : (
              <span className={styles.founderBadge}>Founder</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
