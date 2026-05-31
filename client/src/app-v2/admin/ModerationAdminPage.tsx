/**
 * app-v2/admin/ModerationAdminPage — thin route shell over
 * features-v2/moderation Queue page. Demo viewer hard-coded for the UI shell;
 * replace with real auth/session wiring when transport lands.
 */
import {
  ModerationQueuePage,
  moderationMockAdapter,
  type UiModerationViewer,
} from "@client/features-v2/moderation";

const demoViewer: UiModerationViewer = {
  userId: "usr-current",
  role: "moderator",
};

export default function ModerationAdminPage() {
  return (
    <ModerationQueuePage viewer={demoViewer} adapter={moderationMockAdapter} />
  );
}
