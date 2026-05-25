import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { FormField } from "./forms/FormField";
import { SubmitButton, FormNotice } from "./forms/SubmitButton";
import { validateEmail } from "./forms/validation";
import stackStyles from "./forms/FormStack.module.css";

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

export function ResetPasswordRoute() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      setSentTo(null);
      return;
    }
    setError(undefined);
    setSentTo(email.trim());
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
      {sentTo ? (
        <FormNotice title="Wiadomość przygotowana">
          Jeśli konto powiązane z <strong>{sentTo}</strong> istnieje, otrzymasz
          link do ustawienia nowego hasła. Sprawdź skrzynkę i folder Spam.
          (Wysyłka maila zostanie podłączona razem z backendem tożsamości.)
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
          <SubmitButton>Wyślij link resetujący</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
