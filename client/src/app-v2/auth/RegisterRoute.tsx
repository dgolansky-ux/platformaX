import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { FormField } from "./forms/FormField";
import { PasswordField } from "./forms/PasswordField";
import { SubmitButton, FormNotice } from "./forms/SubmitButton";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  MIN_PASSWORD_LENGTH_HINT,
} from "./forms/validation";
import { identityAuthAdapter } from "../../features-v2/identity";
import type { IdentityAuthAdapter } from "../../features-v2/identity";
import stackStyles from "./forms/FormStack.module.css";

type Errors = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  terms?: string;
};

type RegisterRouteProps = {
  authAdapter?: IdentityAuthAdapter;
};

const BRAND = {
  kicker: "Załóż konto",
  title: "Dołącz do PlatformaX",
  lead: "Buduj sieć kontaktów, twórz społeczności i rozwijaj aktywność na własnych zasadach — bez reklam, bez handlu danymi.",
  bullets: [
    "Bezpłatne konto",
    "Bez reklam i bez handlu Twoimi danymi",
    "Pełna kontrola nad tym, co publikujesz",
  ],
};

export function RegisterRoute({
  authAdapter = identityAuthAdapter,
}: RegisterRouteProps = {}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Errors = {};
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) next.email = emailCheck.message;
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) next.password = passwordCheck.message;
    const matchCheck = validatePasswordMatch(password, passwordConfirm);
    if (!matchCheck.valid) next.passwordConfirm = matchCheck.message;
    if (!terms) next.terms = "Musisz zaakceptować regulamin i politykę prywatności";

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await authAdapter.signUp(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    navigate("/check-email");
  }

  return (
    <AuthLayout
      brand={BRAND}
      heading="Załóż konto"
      subheading="Dołącz do spokojniejszej przestrzeni do relacji, społeczności i działania."
      footer={
        <>
          Masz już konto?{" "}
          <Link to="/login" className={stackStyles.smallLink}>
            Zaloguj się
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className={stackStyles.stack}>
        <FormField
          label="E-mail"
          type="email"
          placeholder="twoj@email.pl"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Hasło"
          placeholder="Minimum 8 znaków"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`Minimum ${MIN_PASSWORD_LENGTH_HINT} znaków`}
          error={errors.password}
        />
        <PasswordField
          label="Powtórz hasło"
          placeholder="Powtórz hasło"
          autoComplete="new-password"
          required
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={errors.passwordConfirm}
        />

        <label className={stackStyles.checkRow}>
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className={stackStyles.check}
            aria-invalid={errors.terms ? true : undefined}
          />
          <span className={stackStyles.checkText}>
            Akceptuję regulamin i politykę prywatności PlatformaX.
          </span>
        </label>
        {errors.terms ? (
          <p className={stackStyles.inlineError}>{errors.terms}</p>
        ) : null}

        <SubmitButton disabled={submitting}>
          {submitting ? "Zakładanie konta…" : "Załóż konto"}
        </SubmitButton>

        {formError ? (
          <FormNotice title="Nie udało się założyć konta">{formError}</FormNotice>
        ) : null}
      </form>
    </AuthLayout>
  );
}
