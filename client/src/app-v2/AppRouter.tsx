import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./landing/LandingPage";
import { LoginRoute } from "./auth/LoginRoute";
import { RegisterRoute } from "./auth/RegisterRoute";
import { ResetPasswordRoute } from "./auth/ResetPasswordRoute";
import { CheckEmailRoute } from "./auth/CheckEmailRoute";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { ProfilePage } from "./profile/ProfilePage";
import { ContactsPage } from "./contacts/ContactsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/reset-password" element={<ResetPasswordRoute />} />
        <Route path="/check-email" element={<CheckEmailRoute />} />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
