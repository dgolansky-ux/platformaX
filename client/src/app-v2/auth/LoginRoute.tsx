import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { FormField } from "./forms/FormField";
import { PasswordField } from "./forms/PasswordField";
import { SubmitButton, FormNotice } from "./forms/SubmitButton";
import { validateEmail, validateNonEmpty } from "./forms/validation";
import { identityAuthAdapter } from "../../features-v2/identity";
import type { IdentityAuthAdapter } from "../../features-v2/identity";
import stackStyles from "./forms/FormStack.module.css";

type Errors = {
  email?: string;
  password?: string;
};

type LoginRouteProps = {
  authAdapter?: IdentityAuthAdapter;
};

const BRAND = {
  kicker: "Zaloguj się",
  title: "Witaj z powrotem",
  lead: "Wróć do swoich kontaktów, społeczności i aktywności — w spokojnej, czystej przestrzeni.",
  bullets: [
    "Twoje dane zostają Twoje",
    "Bez algorytmicznej presji",
    "Pełna kontrola nad obecnością",
  ],
};

export function LoginRoute({
  authAdapter = identityAuthAdapter,
}: LoginRouteProps = {}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Errors = {};
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) next.email = emailCheck.message;
    const passwordCheck = validateNonEmpty(password, "hasło");
    if (!passwordCheck.valid) next.password = passwordCheck.message;

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setFormError(null);
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await authAdapter.signIn(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    navigate("/onboarding");
  }

  return (
    <AuthLayout
      brand={BRAND}
      heading="Zaloguj się"
      subheading="Wpisz swój e-mail i hasło, aby kontynuować."
      footer={
        <>
          Nie masz konta?{" "}
          <Link to="/register" className={stackStyles.smallLink}>
            Załóż konto
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
          placeholder="Twoje hasło"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className={stackStyles.rowEnd}>
          <Link to="/reset-password" className={stackStyles.smallLink}>
            Nie pamiętasz hasła?
          </Link>
        </div>

        <SubmitButton disabled={submitting}>
          {submitting ? "Logowanie…" : "Zaloguj się"}
        </SubmitButton>

        {formError ? (
          <FormNotice title="Nie udało się zalogować">{formError}</FormNotice>
        ) : null}
      </form>
    </AuthLayout>
  );
}
