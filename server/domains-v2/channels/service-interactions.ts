import type { ChannelRepository, ChannelInteractionSettingsRepository } from "./ports";
import type {
  ChannelInteractionSettingsDTO,
  UpdateChannelInteractionSettingsInput,
} from "./interaction-settings";
import { toChannelInteractionSettingsDTO } from "./mapper";

type Deps = {
  channels: ChannelRepository;
  interactionSettings?: ChannelInteractionSettingsRepository;
  clock: { now: () => Date };
};

type SettingsErrorCode = "NOT_FOUND" | "SETTINGS_REPOSITORY_MISSING";
type SettingsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: SettingsErrorCode; message: string } };

function fail<T>(code: SettingsErrorCode, message: string): SettingsResult<T> {
  return { ok: false, error: { code, message } };
}

function defaultInteractionSettings(channelId: string, updatedAt: string): ChannelInteractionSettingsDTO {
  return {
    channelId,
    commentsEnabled: true,
    reactionsEnabled: true,
    commentPolicy: "followers",
    moderationPolicy: "lead_permission_required",
    updatedAt,
  };
}

export async function getInteractionSettings(deps: Deps, channelId: string): Promise<SettingsResult<ChannelInteractionSettingsDTO>> {
  if (!(await deps.channels.getById(channelId))) return fail("NOT_FOUND", "Channel not found.");
  const existing = await deps.interactionSettings?.get(channelId);
  if (existing) return { ok: true, value: toChannelInteractionSettingsDTO(existing) };
  return { ok: true, value: defaultInteractionSettings(channelId, deps.clock.now().toISOString()) };
}

export async function updateInteractionSettings(deps: Deps, input: UpdateChannelInteractionSettingsInput): Promise<SettingsResult<ChannelInteractionSettingsDTO>> {
  if (!deps.interactionSettings) return fail("SETTINGS_REPOSITORY_MISSING", "Interaction settings repository is not configured.");
  const current = await getInteractionSettings(deps, input.channelId);
  if (!current.ok) return current;
  const next = await deps.interactionSettings.upsert({
    channelId: input.channelId,
    commentsEnabled: input.commentsEnabled ?? current.value.commentsEnabled,
    reactionsEnabled: input.reactionsEnabled ?? current.value.reactionsEnabled,
    commentPolicy: input.commentPolicy ?? current.value.commentPolicy,
    moderationPolicy: input.moderationPolicy ?? current.value.moderationPolicy,
    updatedAt: deps.clock.now().toISOString(),
  });
  return { ok: true, value: toChannelInteractionSettingsDTO(next) };
}
