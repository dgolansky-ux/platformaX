import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { FormNotice } from "./forms/SubmitButton";
import stackStyles from "./forms/FormStack.module.css";

const BRAND = {
  kicker: "Sprawdź skrzynkę",
  title: "Twoje konto czeka na potwierdzenie",
  lead: "Wysyłamy link aktywacyjny, gdy backend tożsamości będzie dostępny. Następnie wrócisz tu i przejdziesz do onboardingu.",
  bullets: [
    "Link aktywacyjny w wiadomości e-mail",
    "Sprawdź również folder Spam",
    "Możesz zamknąć tę kartę i wrócić później",
  ],
};

export function CheckEmailRoute() {
  return (
    <AuthLayout
      brand={BRAND}
      heading="Sprawdź swoją skrzynkę"
      subheading="Jeśli dane są poprawne, wyślemy link aktywacyjny na podany adres e-mail po podłączeniu backendu identity."
      footer={
        <>
          Wrócisz do logowania?{" "}
          <Link to="/login" className={stackStyles.smallLink}>
            Przejdź do logowania
          </Link>
        </>
      }
    >
      <FormNotice title="UI shell — backend nie jest podłączony">
        E-mail z linkiem aktywacyjnym zostanie wysłany po wdrożeniu domeny
        identity. W tej chwili widzisz wyłącznie ekran potwierdzający flow
        rejestracji. Po aktywacji konta przejdziesz do{" "}
        <Link to="/onboarding" className={stackStyles.smallLink}>
          onboardingu
        </Link>
        .
      </FormNotice>
    </AuthLayout>
  );
}
