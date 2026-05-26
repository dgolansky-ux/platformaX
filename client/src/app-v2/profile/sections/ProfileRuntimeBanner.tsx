import { Link } from "react-router-dom";
import type { ProfileDataState } from "../data/useProfileData";
import layout from "../styles/profile-layout.module.css";

type ProfileRuntimeBannerProps = {
  state: ProfileDataState;
  onReload: () => void;
};

/**
 * Renders the empty/error banner surfaced by `useProfileData`. The component is
 * an honest disabled-policy/error surface — it never hides a runtime failure.
 */
export function ProfileRuntimeBanner({ state, onReload }: ProfileRuntimeBannerProps) {
  if (state.kind === "empty") {
    return (
      <div className={layout.runtimeBanner} role="status">
        <p>
          Twój profil nie jest jeszcze utworzony. Dokończ rejestrację, aby
          zobaczyć dane.
        </p>
        <Link to="/onboarding" className={layout.runtimeBannerCta}>
          Przejdź do rejestracji
        </Link>
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className={layout.runtimeBanner} role="alert">
        <p>Nie udało się pobrać profilu: {state.message}</p>
        <button
          type="button"
          className={layout.runtimeBannerCta}
          onClick={onReload}
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }
  return null;
}
