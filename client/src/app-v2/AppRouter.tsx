import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./landing/LandingPage";
import { LoginRoute } from "./auth/LoginRoute";
import { RegisterRoute } from "./auth/RegisterRoute";
import { ResetPasswordRoute } from "./auth/ResetPasswordRoute";
import { CheckEmailRoute } from "./auth/CheckEmailRoute";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { ProfilePage } from "./profile/ProfilePage";
import { ContactsPage } from "./contacts/ContactsPage";
import { CommunitiesPage } from "./communities/CommunitiesPage";
import { CreateCommunityPage } from "./communities/CreateCommunityPage";
import { CommunityProfilePage } from "./communities/CommunityProfilePage";
import { CommunityManagePage } from "./communities/CommunityManagePage";
import { CommunityStructurePage } from "./communities/CommunityStructurePage";
import { CommunityModulesManagePage } from "./communities/CommunityModulesManagePage";
import { CommunityChannelsPage } from "./communities/CommunityChannelsPage";
import { CommunityHubPage } from "./communities/CommunityHubPage";
import { ManageDashboard } from "./manage/ManageDashboard";
import { PersonalProfileManageRoute } from "./manage/PersonalProfileManageRoute";
import { ProfessionalSectionRoute } from "./manage/ProfessionalSectionRoute";

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
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/communities/new" element={<CreateCommunityPage />} />
        <Route path="/communities/:slug" element={<CommunityProfilePage />} />
        <Route path="/communities/:slug/manage" element={<CommunityManagePage />} />
        <Route path="/communities/:slug/structure" element={<CommunityStructurePage />} />
        <Route path="/communities/:slug/manage/modules" element={<CommunityModulesManagePage />} />
        <Route path="/communities/:slug/channels" element={<CommunityChannelsPage />} />
        <Route path="/communities/:slug/hub" element={<CommunityHubPage />} />
        <Route path="/manage" element={<ManageDashboard />} />
        <Route path="/manage/profil-osobisty" element={<PersonalProfileManageRoute />} />
        <Route path="/manage/sekcja-zawodowa" element={<ProfessionalSectionRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
