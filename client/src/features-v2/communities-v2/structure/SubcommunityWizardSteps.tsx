/**
 * features-v2/communities-v2 / structure / SubcommunityWizardSteps — the five
 * step bodies for CreateSubcommunityWizard, kept 1:1 with the legacy
 * SubCommunityWizard steps: Podstawy · Kategoria · Lokalizacja · Przynależność
 * · Podsumowanie. Presentational only; state lives in the wizard container.
 */
import type { CommunityCategoryDTO } from "@shared/contracts/communities";
import type { SubcommunityStaffCandidateDTO } from "@shared/contracts/communities-structure";
import styles from "./Structure.module.css";

export type SubWizardData = {
  name: string;
  slug: string;
  description: string;
  visibility: "public" | "private";
  categorySlug: string | null;
  topic: string;
  operatingMode: "in_person" | "online" | "hybrid";
  locationCity: string;
  founderJoins: boolean;
  staff: { userId: string; role: "admin" | "moderator" }[];
};

type Patch = (partial: Partial<SubWizardData>) => void;

export function StepBasics({ data, update }: { data: SubWizardData; update: Patch }) {
  const nameError = data.name.trim().length > 0 && data.name.trim().length < 3;
  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sub-name">Nazwa podspołeczności *</label>
        <input id="sub-name" className={styles.input} placeholder="np. Frontend Guild" value={data.name} maxLength={100} onChange={(e) => update({ name: e.target.value })} />
        {nameError ? <span className={styles.fieldError}>Nazwa musi mieć co najmniej 3 znaki.</span> : <span className={styles.hint}>{data.name.length}/100</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sub-slug">Slug *</label>
        <input id="sub-slug" className={styles.input} placeholder="frontend-guild" value={data.slug} onChange={(e) => update({ slug: e.target.value })} />
        <span className={styles.hint}>Małe litery, cyfry i pojedyncze myślniki. Auto z nazwy — możesz zmienić.</span>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sub-desc">Opis (opcjonalny)</label>
        <textarea id="sub-desc" className={styles.textarea} placeholder="Czym jest ta podspołeczność?" value={data.description} maxLength={500} onChange={(e) => update({ description: e.target.value })} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Typ społeczności</span>
        <div className={styles.choiceGrid}>
          {(["public", "private"] as const).map((v) => (
            <button key={v} type="button" className={`${styles.choice} ${data.visibility === v ? styles.choiceActive : ""}`.trim()} onClick={() => update({ visibility: v })}>
              <p className={styles.choiceTitle}>{v === "public" ? "Publiczna" : "Prywatna"}</p>
              <p className={styles.choiceDesc}>{v === "public" ? "Każdy może dołączyć" : "Tylko po zaproszeniu"}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StepCategory({
  data,
  update,
  categories,
}: {
  data: SubWizardData;
  update: Patch;
  categories: readonly CommunityCategoryDTO[];
}) {
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Kategoria</span>
        <div className={styles.chips}>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              className={`${styles.chip} ${data.categorySlug === cat.slug ? styles.chipActive : ""}`.trim()}
              onClick={() => update({ categorySlug: data.categorySlug === cat.slug ? null : cat.slug })}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sub-topic">Temat / słowo kluczowe (opcjonalne)</label>
        <input id="sub-topic" className={styles.input} placeholder="np. React, TypeScript" value={data.topic} maxLength={200} onChange={(e) => update({ topic: e.target.value })} />
      </div>
    </div>
  );
}

const MODES = [
  { value: "in_person" as const, label: "Stacjonarnie", desc: "Spotykamy się" },
  { value: "online" as const, label: "Online", desc: "W internecie" },
  { value: "hybrid" as const, label: "Hybryda", desc: "Oba tryby" },
];

export function StepLocation({ data, update }: { data: SubWizardData; update: Patch }) {
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Tryb działania</span>
        <div className={styles.choiceGrid3}>
          {MODES.map((m) => (
            <button key={m.value} type="button" className={`${styles.choice} ${data.operatingMode === m.value ? styles.choiceActive : ""}`.trim()} onClick={() => update({ operatingMode: m.value })}>
              <p className={styles.choiceTitle}>{m.label}</p>
              <p className={styles.choiceDesc}>{m.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="sub-city">
          {data.operatingMode === "online" ? "Siedziba (opcjonalnie)" : "Miejscowość"}
        </label>
        <input id="sub-city" className={styles.input} placeholder="np. Kraków" value={data.locationCity} onChange={(e) => update({ locationCity: e.target.value })} />
      </div>
    </div>
  );
}

export function StepBelonging({
  data,
  update,
  candidates,
}: {
  data: SubWizardData;
  update: Patch;
  candidates: readonly SubcommunityStaffCandidateDTO[];
}) {
  const toggle = (userId: string, role: "admin" | "moderator") => {
    const existing = data.staff.find((s) => s.userId === userId);
    if (existing && existing.role === role) {
      update({ staff: data.staff.filter((s) => s.userId !== userId) });
    } else if (existing) {
      update({ staff: data.staff.map((s) => (s.userId === userId ? { userId, role } : s)) });
    } else {
      update({ staff: [...data.staff, { userId, role }] });
    }
  };
  return (
    <div>
      <div className={styles.field}>
        <span className={styles.label}>Czy należysz do tej podspołeczności?</span>
        <div className={styles.choiceGrid}>
          <button type="button" className={`${styles.choice} ${data.founderJoins ? styles.choiceActive : ""}`.trim()} onClick={() => update({ founderJoins: true })}>
            <p className={styles.choiceTitle}>Tak, należę</p>
            <p className={styles.choiceDesc}>Stajesz się founderem i członkiem</p>
          </button>
          <button type="button" className={`${styles.choice} ${!data.founderJoins ? styles.choiceActive : ""}`.trim()} onClick={() => update({ founderJoins: false })}>
            <p className={styles.choiceTitle}>Nie, tworzę dla innych</p>
            <p className={styles.choiceDesc}>Tworzysz, ale nie dołączasz</p>
          </button>
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Admini i moderatorzy (opcjonalnie)</span>
        <span className={styles.hint}>Wybierz z członków społeczności nadrzędnej. Możesz też dodać później.</span>
        {candidates.length === 0 ? (
          <p className={styles.notice}>Brak członków do wskazania w społeczności nadrzędnej.</p>
        ) : (
          candidates.map((m) => {
            const pick = data.staff.find((s) => s.userId === m.userId);
            return (
              <div key={m.userId} className={`${styles.staffRow} ${pick ? styles.staffRowActive : ""}`.trim()}>
                <span className={styles.staffAvatar} aria-hidden="true">{m.displayName.charAt(0).toUpperCase()}</span>
                <span className={styles.staffName}>{m.displayName}</span>
                <span className={styles.staffBtns}>
                  <button type="button" className={`${styles.staffBtn} ${pick?.role === "admin" ? styles.staffBtnActive : ""}`.trim()} onClick={() => toggle(m.userId, "admin")}>Admin</button>
                  <button type="button" className={`${styles.staffBtn} ${pick?.role === "moderator" ? styles.staffBtnActive : ""}`.trim()} onClick={() => toggle(m.userId, "moderator")}>Mod</button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function StepSummary({
  data,
  parentName,
  categories,
}: {
  data: SubWizardData;
  parentName: string;
  categories: readonly CommunityCategoryDTO[];
}) {
  const category = categories.find((c) => c.slug === data.categorySlug);
  return (
    <div>
      <div className={styles.summaryCard}>
        <p className={styles.choiceTitle} style={{ fontSize: "1.05rem" }}>{data.name || "Bez nazwy"}</p>
        <p className={styles.choiceDesc}>{data.description || "Brak opisu"}</p>
      </div>
      <div>
        <div className={styles.summaryRow}><span className={styles.summaryKey}>Slug</span><span className={styles.summaryVal}>/{data.slug || "—"}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryKey}>Rodzic</span><span className={styles.summaryVal}>{parentName}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryKey}>Widoczność</span><span className={styles.summaryVal}>{data.visibility === "public" ? "Publiczna" : "Prywatna"}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryKey}>Kategoria</span><span className={styles.summaryVal}>{category ? `${category.emoji} ${category.name}` : "—"}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryKey}>Przynależność</span><span className={styles.summaryVal}>{data.founderJoins ? "Dołączasz jako founder" : "Tworzysz bez dołączania"}</span></div>
        <div className={styles.summaryRow}><span className={styles.summaryKey}>Kadra</span><span className={styles.summaryVal}>{data.staff.length > 0 ? `${data.staff.length} wskazanych` : "—"}</span></div>
      </div>
    </div>
  );
}
