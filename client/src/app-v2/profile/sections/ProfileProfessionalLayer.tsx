import { ProfessionBlock } from "./ProfessionBlock";
import { ProfileSpecialists } from "./ProfileSpecialists";
import { ProfileProfessionalActivities } from "./ProfileProfessionalActivities";

type ProfileProfessionalLayerProps = {
  isOwner: boolean;
};

/**
 * Professional layer of the SAME profile (mode === "professional"). Not a
 * separate route or domain — just the professional sections shown instead of the
 * personal content sections. UI shell with empty states only (no profession data).
 */
export function ProfileProfessionalLayer({ isOwner }: ProfileProfessionalLayerProps) {
  return (
    <>
      <ProfessionBlock isOwner={isOwner} />
      <ProfileSpecialists isOwner={isOwner} />
      <ProfileProfessionalActivities isOwner={isOwner} />
    </>
  );
}
