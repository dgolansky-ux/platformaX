/**
 * identity/workplaces — cross-domain contracts.
 *
 * Workplaces never reach into other domains directly. The application layer
 * wires resolvers (e.g. for the contact-access verdict used by the contact
 * visibility policy) — the service consumes them via these ports.
 */
import type { WorkplaceContactVisibility } from "./dto";

export type WorkplaceContactAccessVerdict =
  | "owner"
  | "friend"
  | "approved_contact_fields"
  | "stranger";

export interface WorkplaceContactAccessResolver {
  /** Resolves the viewer's relationship to the workplace owner for contact gating. */
  resolveVerdict(
    viewerUserId: string,
    ownerUserId: string,
  ): Promise<WorkplaceContactAccessVerdict>;
}

export interface WorkplaceContactRule {
  visibility: WorkplaceContactVisibility;
  verdict: WorkplaceContactAccessVerdict;
}
