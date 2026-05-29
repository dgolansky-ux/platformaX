/**
 * application-v2/use-cases/channels — orchestration.
 *
 * createChannelForCommunity enforces the cross-domain authority check that the
 * channels domain intentionally does NOT own: it asks communities-v2 (via the
 * CommunityAuthorityResolver contract) whether the actor may manage the
 * community, then delegates creation to channels. Calls only public surfaces.
 */
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import type {
  ChannelPublicDTO,
  ChannelsErrorCode,
  ChannelsService,
  ChannelVisibility,
} from "@server/domains-v2/channels/public-api";

export type ChannelsUseCaseDeps = {
  authority: CommunityAuthorityResolver;
  channels: ChannelsService;
};

export type CreateChannelForCommunityInput = {
  actorUserId: string;
  communityId: string;
  slug: string;
  name: string;
  description?: string;
  visibility?: ChannelVisibility;
};

export type ChannelsUseCaseErrorCode = "FORBIDDEN" | ChannelsErrorCode;

export type CreateChannelForCommunityResult =
  | { ok: true; value: ChannelPublicDTO }
  | { ok: false; error: { code: ChannelsUseCaseErrorCode; message: string } };

export interface ChannelsUseCase {
  createChannelForCommunity(input: CreateChannelForCommunityInput): Promise<CreateChannelForCommunityResult>;
}

export function createChannelsUseCase(deps: ChannelsUseCaseDeps): ChannelsUseCase {
  return {
    async createChannelForCommunity(input) {
      const allowed = await deps.authority.canManageCommunity(input.communityId, input.actorUserId);
      if (!allowed) {
        return { ok: false, error: { code: "FORBIDDEN", message: "Actor may not manage this community." } };
      }
      return deps.channels.createChannelForCommunity({
        ownerType: "community",
        ownerId: input.communityId,
        slug: input.slug,
        name: input.name,
        description: input.description,
        visibility: input.visibility,
      });
    },
  };
}
