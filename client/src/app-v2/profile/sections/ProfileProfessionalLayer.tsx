import { ProfessionBlock } from "./ProfessionBlock";
import { ProfileSpecialists } from "./ProfileSpecialists";
import { ProfileProfessionalActivities } from "./ProfileProfessionalActivities";

type ProfileProfessionalLayerProps = {
  /** True only when an authenticated owner is viewing their own profile. */
  canEdit: boolean;
};

/**
 * Professional layer of the SAME profile (mode === "professional"). Not a
 * separate route or domain — just the professional sections shown instead of the
 * personal content sections. UI shell with empty states only (no profession data).
 */
export function ProfileProfessionalLayer({ canEdit }: ProfileProfessionalLayerProps) {
  return (
    <>
      <ProfessionBlock isOwner={canEdit} />
      <ProfileSpecialists isOwner={canEdit} />
      <ProfileProfessionalActivities isOwner={canEdit} />
    </>
  );
}
