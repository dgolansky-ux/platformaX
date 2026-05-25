import stepsStyles from "./steps.module.css";

type ProfileOption = {
  id: string;
  title: string;
  subtitle: string;
};

const OPTIONS: ReadonlyArray<ProfileOption> = [
  { id: "personal", title: "Profil osobisty", subtitle: "Relacje i bliscy" },
  { id: "creator", title: "Twórca / Pasja", subtitle: "Dziel się tym, co robisz" },
  { id: "pro", title: "Profil zawodowy", subtitle: "Branża i kontakty" },
  { id: "local", title: "Lokalna inicjatywa", subtitle: "Wokół miejsca i sąsiedztwa" },
];

type Step5Props = {
  selectedProfile: string | null;
  onSelect: (id: string) => void;
};

export function Step5Profile({ selectedProfile, onSelect }: Step5Props) {
  return (
    <div className={stepsStyles.stack}>
      <div className={stepsStyles.profileGrid} role="radiogroup" aria-label="Kierunek profilu">
        {OPTIONS.map((opt) => {
          const selected = selectedProfile === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(opt.id)}
              className={`${stepsStyles.profileTile} ${selected ? stepsStyles.profileTileSelected : ""}`}
            >
              <span>{opt.title}</span>
              <span className={stepsStyles.profileTileSub}>{opt.subtitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ONBOARDING_PROFILE_OPTIONS = OPTIONS;
