/**
 * app-v2/profile/workplaces/WorkplacePageRoute — route shell for
 * /profile/workplaces/:slug. The shell mounts the V2 workplace page for the
 * demo viewer; the feature owns its mock adapter.
 */
import { useParams } from "react-router-dom";
import { WorkplacePage } from "@client/features-v2/professional-profile/public-api";

const DEMO_VIEWER = "u-viewer";
const DEMO_OWNER = "u-viewer";

export function WorkplacePageRoute() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  return (
    <WorkplacePage
      viewerUserId={DEMO_VIEWER}
      ownerUserId={DEMO_OWNER}
      workplaceSlug={slug}
    />
  );
}
