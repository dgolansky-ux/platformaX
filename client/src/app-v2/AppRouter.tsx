import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./landing/LandingPage";
import { LoginRoute } from "./auth/LoginRoute";
import { RegisterRoute } from "./auth/RegisterRoute";
import { ResetPasswordRoute } from "./auth/ResetPasswordRoute";
import { CheckEmailRoute } from "./auth/CheckEmailRoute";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";

// Heavy authenticated/demo routes are lazy-loaded to keep the initial bundle
// small and let Vite emit one chunk per route group. Auth + landing remain
// eager so the first paint never waits on a chunk.
const ProfilePage = lazy(() =>
  import("./profile/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const PersonalProfileRoute = lazy(() =>
  import("./profile/PersonalProfileRoute").then((m) => ({ default: m.PersonalProfileRoute })),
);
const FriendFeedPageRoute = lazy(() =>
  import("./friend-feed/FriendFeedPageRoute").then((m) => ({ default: m.FriendFeedPageRoute })),
);
const ContactsPage = lazy(() =>
  import("./contacts/ContactsPage").then((m) => ({ default: m.ContactsPage })),
);
const ContactRequestsPage = lazy(() =>
  import("./contacts/ContactRequestsPage").then((m) => ({ default: m.ContactRequestsPage })),
);
const FriendsPage = lazy(() =>
  import("./friends/FriendsPage").then((m) => ({ default: m.FriendsPage })),
);
const FriendRequestsPage = lazy(() =>
  import("./friends/FriendRequestsPage").then((m) => ({ default: m.FriendRequestsPage })),
);
const CommunitiesPage = lazy(() =>
  import("./communities/CommunitiesPage").then((m) => ({ default: m.CommunitiesPage })),
);
const CreateCommunityPage = lazy(() =>
  import("./communities/CreateCommunityPage").then((m) => ({ default: m.CreateCommunityPage })),
);
const CommunityProfilePage = lazy(() =>
  import("./communities/CommunityProfilePage").then((m) => ({ default: m.CommunityProfilePage })),
);
const CommunityManagePage = lazy(() =>
  import("./communities/CommunityManagePage").then((m) => ({ default: m.CommunityManagePage })),
);
const CommunityStructurePage = lazy(() =>
  import("./communities/CommunityStructurePage").then((m) => ({ default: m.CommunityStructurePage })),
);
const CommunityFeedPage = lazy(() =>
  import("./communities/CommunityFeedPage").then((m) => ({ default: m.CommunityFeedPage })),
);
const CommunityModulesManagePage = lazy(() =>
  import("./communities/CommunityModulesManagePage").then((m) => ({ default: m.CommunityModulesManagePage })),
);
const CommunityChannelsPage = lazy(() =>
  import("./communities/CommunityChannelsPage").then((m) => ({ default: m.CommunityChannelsPage })),
);
const CommunityHubPage = lazy(() =>
  import("./communities/CommunityHubPage").then((m) => ({ default: m.CommunityHubPage })),
);
const ChannelsPage = lazy(() =>
  import("./channels/ChannelsPage").then((m) => ({ default: m.ChannelsPage })),
);
const ChannelProfilePage = lazy(() =>
  import("./channels/ChannelProfilePage").then((m) => ({ default: m.ChannelProfilePage })),
);
const ManageDashboard = lazy(() =>
  import("./manage/ManageDashboard").then((m) => ({ default: m.ManageDashboard })),
);
const PersonalProfileManageRoute = lazy(() =>
  import("./manage/PersonalProfileManageRoute").then((m) => ({ default: m.PersonalProfileManageRoute })),
);
const ProfessionalSectionRoute = lazy(() =>
  import("./manage/ProfessionalSectionRoute").then((m) => ({ default: m.ProfessionalSectionRoute })),
);
// React.lazy returns one component per call; per-section variants need
// individual wrappers so each export becomes its own dynamic boundary.
// All variants share one dynamically-imported chunk because Vite dedupes
// the import() call.
function lazyManage<K extends string>(key: K) {
  return lazy(() =>
    import("./manage/ManageSectionRoute").then((m) => ({
      default: (m as unknown as Record<K, React.ComponentType>)[key],
    })),
  );
}
const ManageAccountRoute = lazyManage("ManageAccountRoute");
const ManageChannelsRoute = lazyManage("ManageChannelsRoute");
const ManageCommunitiesRoute = lazyManage("ManageCommunitiesRoute");
const ManageContactRoute = lazyManage("ManageContactRoute");
const ManageFriendsRoute = lazyManage("ManageFriendsRoute");
const ManageMediaRoute = lazyManage("ManageMediaRoute");
const ManageModulesRoute = lazyManage("ManageModulesRoute");
const ManageNotificationsRoute = lazyManage("ManageNotificationsRoute");
const ManagePrivacyRoute = lazyManage("ManagePrivacyRoute");
const ManageSecurityRoute = lazyManage("ManageSecurityRoute");
const ManageWorkplacesRoute = lazyManage("ManageWorkplacesRoute");

const WorkplaceCreateRoute = lazy(() =>
  import("./profile/workplaces/WorkplaceCreateRoute").then((m) => ({ default: m.WorkplaceCreateRoute })),
);
const WorkplacePageRoute = lazy(() =>
  import("./profile/workplaces/WorkplacePageRoute").then((m) => ({ default: m.WorkplacePageRoute })),
);
const NotificationsPage = lazy(() =>
  import("./notifications/NotificationsPage").then((m) => ({ default: m.NotificationsPage })),
);
const ModerationAdminPage = lazy(() => import("./admin/ModerationAdminPage"));

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        font: "500 14px/1.4 'DM Sans', sans-serif",
      }}
    >
      Ładuję…
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/reset-password" element={<ResetPasswordRoute />} />
          <Route path="/check-email" element={<CheckEmailRoute />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<PersonalProfileRoute />} />
          <Route path="/friends-feed" element={<FriendFeedPageRoute />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/requests" element={<ContactRequestsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friends/requests" element={<FriendRequestsPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/new" element={<CreateCommunityPage />} />
          <Route path="/communities/:slug" element={<CommunityProfilePage />} />
          <Route path="/communities/:slug/manage" element={<CommunityManagePage />} />
          <Route path="/communities/:slug/structure" element={<CommunityStructurePage />} />
          <Route path="/communities/:slug/feed" element={<CommunityFeedPage />} />
          <Route path="/communities/:slug/manage/modules" element={<CommunityModulesManagePage />} />
          <Route path="/communities/:slug/channels" element={<CommunityChannelsPage />} />
          <Route path="/communities/:slug/hub" element={<CommunityHubPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/channels/:slug" element={<ChannelProfilePage />} />
          <Route path="/manage" element={<ManageDashboard />} />
          <Route path="/manage/account" element={<ManageAccountRoute />} />
          <Route path="/manage/profil-osobisty" element={<PersonalProfileManageRoute />} />
          <Route path="/manage/privacy" element={<ManagePrivacyRoute />} />
          <Route path="/manage/contact" element={<ManageContactRoute />} />
          <Route path="/manage/friends" element={<ManageFriendsRoute />} />
          <Route path="/manage/notifications" element={<ManageNotificationsRoute />} />
          <Route path="/manage/media" element={<ManageMediaRoute />} />
          <Route path="/manage/sekcja-zawodowa" element={<ProfessionalSectionRoute />} />
          <Route path="/manage/workplaces" element={<ManageWorkplacesRoute />} />
          <Route path="/manage/modules" element={<ManageModulesRoute />} />
          <Route path="/manage/channels" element={<ManageChannelsRoute />} />
          <Route path="/manage/communities" element={<ManageCommunitiesRoute />} />
          <Route path="/manage/security" element={<ManageSecurityRoute />} />
          <Route path="/manage/profile/workplaces/new" element={<WorkplaceCreateRoute />} />
          <Route path="/profile/workplaces/:slug" element={<WorkplacePageRoute />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin/moderation" element={<ModerationAdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
