/**
 * features-v2/communities-v2/wizard / WizardSteps — presentational steps.
 * Pure subcomponents driven by WizardData + update callback. NO @server/* /
 * NO trpc / NO toasts library. Mikrocopy aligned with the legacy wizard.
 */
import type { CommunityCategoryDTO } from "@shared/contracts/communities";
import type { WizardData, WizardLocationMode } from "./wizard-types";
import styles from "./WizardSteps.module.css";

type StepProps = { data: WizardData; update: (patch: Partial<WizardData>) => void };

export function BasicsStep({ data, update }: StepProps) {
  return (
    <div className={styles.stepBody}>
      <div className={styles.stepHero}>
        <div className={styles.stepHeroIcon} aria-hidden="true">✨</div>
        <h2 className={styles.stepTitle}>Zacznijmy od podstaw</h2>
        <p className={styles.stepHelp}>Nadaj nazwę i opisz swoją społeczność</p>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Nazwa społeczności *</span>
        <input
          className={styles.input}
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          maxLength={100}
          placeholder="np. Programiści React"
        />
        <p className={styles.counter}>{data.name.length}/100</p>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Opis <span className={styles.optional}>(opcjonalny)</span></span>
        <textarea
          className={styles.textarea}
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder="Opisz czym jest ta społeczność..."
        />
        <p className={styles.counter}>{data.description.length}/500</p>
      </label>
      <div className={styles.field}>
        <span className={styles.label}>Typ społeczności</span>
        <div className={styles.typeGrid}>
          {(["public", "private"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.typeCard} ${data.visibility === t ? styles.typeCardActive : ""}`}
              onClick={() => update({ visibility: t })}
            >
              <span className={styles.typeIcon} aria-hidden="true">{t === "public" ? "🌐" : "🔒"}</span>
              <strong>{t === "public" ? "Publiczna" : "Prywatna"}</strong>
              <span className={styles.typeHelp}>
                {t === "public" ? "Każdy może dołączyć" : "Tylko po zaproszeniu"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategoryStep({ data, update, categories }: StepProps & { categories: readonly CommunityCategoryDTO[] }) {
  return (
    <div className={styles.stepBody}>
      <div className={styles.stepHero}>
        <div className={styles.stepHeroIcon} aria-hidden="true">🔍</div>
        <h2 className={styles.stepTitle}>Wybierz kategorię</h2>
        <p className={styles.stepHelp}>Pomoże użytkownikom znaleźć Twoją społeczność</p>
      </div>
      <div className={styles.categoryGrid}>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`${styles.categoryChip} ${data.categorySlug === cat.slug ? styles.categoryChipActive : ""}`}
            onClick={() => update({ categorySlug: cat.slug })}
          >
            <span className={styles.categoryEmoji} aria-hidden="true">{cat.emoji}</span>
            <span className={styles.categoryName}>{cat.name}</span>
          </button>
        ))}
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Główny temat <span className={styles.optional}>(opcjonalnie)</span></span>
        <input
          className={styles.input}
          value={data.topic}
          onChange={(e) => update({ topic: e.target.value })}
          maxLength={80}
          placeholder="np. ratownictwo, open source"
        />
      </label>
    </div>
  );
}

export function LocationStep({ data, update }: StepProps) {
  const MODES: readonly { value: WizardLocationMode; label: string; emoji: string; help: string }[] = [
    { value: "online",     label: "Online",       emoji: "📶", help: "Tylko spotkania online" },
    { value: "stationary", label: "Stacjonarna",  emoji: "📍", help: "Spotkania w jednym miejscu" },
    { value: "hybrid",     label: "Hybrydowa",    emoji: "🔁", help: "Online + spotkania na żywo" },
  ];
  return (
    <div className={styles.stepBody}>
      <div className={styles.stepHero}>
        <div className={styles.stepHeroIcon} aria-hidden="true">📍</div>
        <h2 className={styles.stepTitle}>Lokalizacja</h2>
        <p className={styles.stepHelp}>Określ tryb działania społeczności (opcjonalne)</p>
      </div>
      <div className={styles.modeGrid}>
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            className={`${styles.typeCard} ${data.locationMode === m.value ? styles.typeCardActive : ""}`}
            onClick={() => update({ locationMode: m.value })}
          >
            <span className={styles.typeIcon} aria-hidden="true">{m.emoji}</span>
            <strong>{m.label}</strong>
            <span className={styles.typeHelp}>{m.help}</span>
          </button>
        ))}
      </div>
      {data.locationMode !== "online" ? (
        <label className={styles.field}>
          <span className={styles.label}>Miasto / region</span>
          <input
            className={styles.input}
            value={data.locationCity}
            onChange={(e) => update({ locationCity: e.target.value })}
            maxLength={80}
            placeholder="np. Warszawa"
          />
        </label>
      ) : null}
    </div>
  );
}

export function SummaryStep({ data, categoryName }: { data: WizardData; categoryName: string | null }) {
  return (
    <div className={styles.stepBody}>
      <div className={styles.stepHero}>
        <div className={styles.coverPreview} aria-hidden="true">
          <span className={styles.coverEmoji}>🚀</span>
        </div>
        <h2 className={styles.stepTitle}>{data.name || "Twoja społeczność"}</h2>
        <p className={styles.stepHelp}>Sprawdź dane i utwórz społeczność</p>
      </div>
      <dl className={styles.summaryList}>
        <SummaryRow label="Nazwa" value={data.name || "—"} />
        <SummaryRow label="Slug" value={data.slug ? `/${data.slug}` : "—"} />
        <SummaryRow label="Typ" value={data.visibility === "public" ? "Publiczna" : "Prywatna"} />
        <SummaryRow label="Kategoria" value={categoryName ?? "—"} />
        <SummaryRow label="Lokalizacja" value={summaryLocation(data)} />
        <SummaryRow label="Opis" value={data.description || "—"} />
      </dl>
    </div>
  );
}

function summaryLocation(data: WizardData): string {
  if (!data.locationMode) return "—";
  const mode = data.locationMode === "online" ? "Online" : data.locationMode === "stationary" ? "Stacjonarna" : "Hybrydowa";
  return data.locationCity ? `${mode} · ${data.locationCity}` : mode;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <dt className={styles.summaryLabel}>{label}</dt>
      <dd className={styles.summaryValue}>{value}</dd>
    </div>
  );
}
