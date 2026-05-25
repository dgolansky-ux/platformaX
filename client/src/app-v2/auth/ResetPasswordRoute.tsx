import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { FormField } from "./forms/FormField";
import { SubmitButton, FormNotice } from "./forms/SubmitButton";
import { validateEmail } from "./forms/validation";
import { identityAuthAdapter } from "../../features-v2/identity";
import type { IdentityAuthAdapter } from "../../features-v2/identity";
import stackStyles from "./forms/FormStack.module.css";

type ResetPasswordRouteProps = {
  authAdapter?: IdentityAuthAdapter;
};

const BRAND = {
  kicker: "Reset hasła",
  title: "Nie pamiętasz hasła?",
  lead: "Podaj e-mail przypisany do konta — przygotujemy link do ustawienia nowego hasła, gdy backend tożsamości będzie dostępny.",
  bullets: [
    "Bez ujawniania, czy adres istnieje",
    "Link wygasa po krótkim czasie",
    "Twoje hasło nigdy nie jest logowane",
  ],
};

export function ResetPasswordRoute({
  authAdapter = identityAuthAdapter,
}: ResetPasswordRouteProps = {}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      return;
    }
    setError(undefined);
    setFormError(null);
    setSubmitting(true);
    const result = await authAdapter.resetPassword(email.trim());
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthLayout
      brand={BRAND}
      heading="Reset hasła"
      subheading="Wyślemy link do ustawienia nowego hasła na podany e-mail."
      footer={
        <>
          Pamiętasz hasło?{" "}
          <Link to="/login" className={stackStyles.smallLink}>
            Wróć do logowania
          </Link>
        </>
      }
    >
      {sent ? (
        <FormNotice title="Wiadomość przygotowana">
          Jeśli konto powiązane z podanym adresem istnieje, wyślemy link do
          ustawienia nowego hasła. Sprawdź skrzynkę i folder Spam. Ze względów
          bezpieczeństwa nie potwierdzamy, czy adres jest zarejestrowany.
        </FormNotice>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={stackStyles.stack}>
          <FormField
            label="E-mail"
            type="email"
            placeholder="twoj@email.pl"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <SubmitButton disabled={submitting}>
            {submitting ? "Wysyłanie…" : "Wyślij link resetujący"}
          </SubmitButton>
          {formError ? (
            <FormNotice title="Nie udało się wysłać linku">{formError}</FormNotice>
          ) : null}
        </form>
      )}
    </AuthLayout>
  );
}
