/**
 * application-v2/use-cases/media — cross-domain permission port.
 *
 * The media domain knows about ownership of its own assets; it does NOT know
 * who is admin of a community, lead of a channel or owner of a workplace.
 * That knowledge lives in the social/communities/channels/workplaces domains.
 *
 * The application layer accepts a `MediaPermissionsPort` so it can answer
 * those questions without the media domain importing other domain internals.
 * A future wiring file injects the real cross-domain implementation; tests
 * inject deterministic stubs.
 */

export type ChannelLeadPermission =
  | "manage_channel_profile"
  | "publish_channel_content";

export interface MediaPermissionsPort {
  isCommunityAdmin(actorUserId: string, communityId: string): Promise<boolean>;
  isCommunityMember(actorUserId: string, communityId: string): Promise<boolean>;
  isChannelLeadWith(
    actorUserId: string,
    channelId: string,
    permission: ChannelLeadPermission,
  ): Promise<boolean>;
  isWorkplaceOwner(actorUserId: string, workplaceId: string): Promise<boolean>;
  isEventOwner(actorUserId: string, eventId: string): Promise<boolean>;
}

/**
 * Conservative default port — refuses every cross-domain permission. Useful
 * for local development where the social/communities/channels wiring is not
 * available yet, and for tests that only exercise profile-owner flows. With
 * this in place the media use-cases that need cross-domain authority will
 * honestly refuse with `PERMISSION_DENIED` instead of silently allowing.
 */
export function createDenyAllMediaPermissionsPort(): MediaPermissionsPort {
  return {
    async isCommunityAdmin() {
      return false;
    },
    async isCommunityMember() {
      return false;
    },
    async isChannelLeadWith() {
      return false;
    },
    async isWorkplaceOwner() {
      return false;
    },
    async isEventOwner() {
      return false;
    },
  };
}
