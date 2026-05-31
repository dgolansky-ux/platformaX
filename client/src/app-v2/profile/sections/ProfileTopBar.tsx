import { Link } from "react-router-dom";
import layout from "../styles/profile-layout.module.css";

type ProfileTopBarProps = {
  editEnabled: boolean;
  onEditBio: () => void;
};

/**
 * Sticky topbar above the profile shell. Edit affordance becomes a real CTA
 * only when the identity boundary returned an owner profile — otherwise it
 * remains an honest disabled-policy button.
 */
export function ProfileTopBar({ editEnabled, onEditBio }: ProfileTopBarProps) {
  return (
    <div className={layout.topbar}>
      <span className={layout.topbarBrand}>PlatformaX</span>
      <div className={layout.topbarActions}>
        <Link to="/" className={layout.iconButton} aria-label="Strona główna">
          ←
        </Link>
        <button
          type="button"
          className={layout.iconButton}
          aria-label={editEnabled ? "Edytuj bio" : "Edytuj profil — niedostępne"}
          title={
            editEnabled
              ? "Edytuj bio"
              : "Edycja profilu będzie dostępna po podłączeniu backendu identity"
          }
          disabled={!editEnabled}
          onClick={editEnabled ? onEditBio : undefined}
        >
          ✎
        </button>
      </div>
    </div>
  );
}
