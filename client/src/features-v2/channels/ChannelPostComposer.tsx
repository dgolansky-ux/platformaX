import { useMemo } from "react";
import { ChannelComposer } from "../publishing";
import { channelPublishingTarget, createChannelPublishingAdapter } from "./publishing-adapter";

type Props = {
  channelSlug: string;
  channelName: string;
  canPublish: boolean;
  onPublished: () => Promise<void>;
};

export function ChannelPostComposer({ channelSlug, channelName, canPublish, onPublished }: Props) {
  const target = useMemo(() => channelPublishingTarget(channelSlug, channelName, canPublish), [channelSlug, channelName, canPublish]);
  const adapter = useMemo(() => createChannelPublishingAdapter(target), [target]);
  if (!canPublish) return null;
  return (
    <ChannelComposer
      viewerUserId="u-viewer-demo"
      adapter={adapter}
      availableTargets={[target]}
      channelTarget={target}
      onPublished={() => void onPublished()}
    />
  );
}
