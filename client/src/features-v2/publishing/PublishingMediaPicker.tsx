/**
 * features-v2/publishing — PublishingMediaPicker (thin shell over the shared
 * `MediaPicker` from `features-v2/media`).
 *
 * The composer never speaks to the media adapter directly — it forwards the
 * target's purpose + ownerRef into the shared picker, which validates locally,
 * creates upload intents and emits `MediaRefDTO[]`. The composer maps those
 * refs into its `PublishingMediaRefUi` shape (assetId + mediaType).
 *
 * Honest blocked state is rendered by the shared picker when storage is offline
 * (STORAGE_ADAPTER_ENV_REQUIRED).
 */
import { useCallback, useMemo, useState } from "react";
import { MediaPicker, type MediaRefDTO } from "../media";
import {
  buildDraftOwnerId,
  getPublishingMediaSurface,
} from "./publishingMediaMap";
import type {
  PublishingMediaRefUi,
  PublishingMediaTypeUi,
  PublishingTargetDefinitionUi,
} from "./types";

interface Props {
  viewerUserId: string;
  target: PublishingTargetDefinitionUi;
  mediaRefs: readonly PublishingMediaRefUi[];
  onChange(next: readonly PublishingMediaRefUi[]): void;
}

function mediaTypeFromAllowed(
  allowed: readonly PublishingMediaTypeUi[],
): PublishingMediaTypeUi {
  if (allowed.includes("image")) return "image";
  if (allowed.includes("video")) return "video";
  return allowed[0] ?? "image";
}

export function PublishingMediaPicker({
  viewerUserId,
  target,
  mediaRefs,
  onChange,
}: Props) {
  const surface = useMemo(
    () => getPublishingMediaSurface(target.targetType),
    [target.targetType],
  );
  const ownerRef = useMemo(
    () => ({
      ownerType: surface.ownerType,
      ownerId: buildDraftOwnerId(viewerUserId, target.targetType, target.targetId),
    }),
    [surface.ownerType, viewerUserId, target.targetType, target.targetId],
  );
  const defaultMediaType = useMemo(
    () => mediaTypeFromAllowed(target.allowedMediaTypes),
    [target.allowedMediaTypes],
  );

  const [picker, setPicker] = useState<readonly MediaRefDTO[]>(() =>
    mediaRefs.map((r) => ({ assetId: r.refId })),
  );

  const handlePickerChange = useCallback(
    (next: readonly MediaRefDTO[]) => {
      setPicker(next);
      onChange(
        next.map((ref) => ({
          refId: ref.assetId,
          mediaType: defaultMediaType,
        })),
      );
    },
    [onChange, defaultMediaType],
  );

  return (
    <MediaPicker
      actorUserId={viewerUserId}
      ownerRef={ownerRef}
      purpose={surface.purpose}
      value={picker}
      onChange={handlePickerChange}
      label={`Dodaj media (max ${target.maxMediaCount})`}
      compact
    />
  );
}
