/**
 * app-v2/profile/workplaces/WorkplaceCreateRoute — route shell.
 *
 * Mounts the V2 workplace wizard for the demo viewer. The shell is
 * intentionally thin: no data fetching, no global state — the feature
 * owns its `MOCK_LOCAL_ONLY` adapter.
 */
import { useNavigate } from "react-router-dom";
import { WorkplaceWizard } from "@client/features-v2/professional-profile/public-api";

const DEMO_VIEWER = "u-viewer";

export function WorkplaceCreateRoute() {
  const navigate = useNavigate();
  return (
    <WorkplaceWizard
      viewerUserId={DEMO_VIEWER}
      onCreated={(card) => {
        navigate(`/profile/workplaces/${card.slug}`);
      }}
      onCancel={() => navigate("/profile")}
    />
  );
}
