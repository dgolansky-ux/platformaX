import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { FormNotice } from "./forms/SubmitButton";
import stackStyles from "./forms/FormStack.module.css";
import {
  identityAuthAdapter,
  type IdentityAuthAdapter,
} from "../../features-v2/identity";

type CheckEmailRouteProps = {
  authAdapter?: IdentityAuthAdapter;
};

const BRAND = {
  kicker: "Sprawdź skrzynkę",
  title: "Twoje konto czeka na potwierdzenie",
  lead: "Po założeniu konta wysyłamy link aktywacyjny przez Supabase Auth. Po kliknięciu w link wrócisz tu i przejdziesz do onboardingu.",
  bullets: [
    "Link aktywacyjny w wiadomości e-mail",
    "Sprawdź również folder Spam",
    "Możesz zamknąć tę kartę i wrócić później",
  ],
};

export function CheckEmailRoute({
  authAdapter = identityAuthAdapter,
}: CheckEmailRouteProps = {}) {
  const configured = authAdapter.isConfigured();
  const noticeTitle = configured
    ? "Link aktywacyjny wysłany"
    : "UI shell — backend nie jest skonfigurowany";
  const noticeBody = configured ? (
    <>
      Jeśli rejestracja się powiodła, na podany adres e-mail trafił link
      aktywacyjny od Supabase Auth. Po kliknięciu w link przejdziesz do{" "}
      <Link to="/onboarding" className={stackStyles.smallLink}>
        onboardingu
      </Link>
      .
    </>
  ) : (
    <>
      Adapter Supabase Auth jest zaimportowany, ale w tym środowisku brakuje
      kluczy <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>,
      więc żadna wiadomość nie została wysłana. Po skonfigurowaniu kluczy
      ponowna rejestracja wyśle link aktywacyjny i przejdziesz do{" "}
      <Link to="/onboarding" className={stackStyles.smallLink}>
        onboardingu
      </Link>
      .
    </>
  );
  const subheading = configured
    ? "Jeśli dane są poprawne, wyślemy link aktywacyjny na podany adres e-mail przez Supabase Auth."
    : "Po skonfigurowaniu Supabase Auth wyślemy link aktywacyjny na podany adres e-mail.";

  return (
    <AuthLayout
      brand={BRAND}
      heading="Sprawdź swoją skrzynkę"
      subheading={subheading}
      footer={
        <>
          Wrócisz do logowania?{" "}
          <Link to="/login" className={stackStyles.smallLink}>
            Przejdź do logowania
          </Link>
        </>
      }
    >
      <FormNotice title={noticeTitle}>{noticeBody}</FormNotice>
    </AuthLayout>
  );
}
