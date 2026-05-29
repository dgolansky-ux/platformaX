/**
 * features-v2/channels / ChannelProfileShell — `/channels/:slug` page.
 *
 * Hero + owner community link + follow CTA + leads panel + real MOCK_LOCAL_ONLY
 * channel feed. Composer is visible only for leads with publish permission.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ChannelProfileDTO } from "@shared/contracts/channels";
import { channelsMockAdapter } from "./channels-mock-adapter";
import { ChannelLeadsPanel } from "./ChannelLeadsPanel";
import { ChannelPostComposer } from "./ChannelPostComposer";
import { ChannelFeedList } from "./ChannelFeedList";
import styles from "./Channels.module.css";

type Props = { slug: string };

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ChannelProfileDTO };

function followLabel(channel: { viewerFollows: boolean }): string {
  return channel.viewerFollows ? "Obserwujesz" : "Obserwuj";
}

export function ChannelProfileShell({ slug }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await channelsMockAdapter.getChannelProfile(slug);
    if (!res.ok) { setState({ status: "error", message: res.error.message }); return; }
    setState({ status: "ready", data: res.value });
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  async function toggleFollow() {
    if (state.status !== "ready") return;
    setBusy(true);
    const fn = state.data.channel.viewerFollows ? channelsMockAdapter.unfollowChannel : channelsMockAdapter.followChannel;
    await fn({ channelSlug: slug });
    setBusy(false);
    await load();
  }

  if (state.status === "loading") {
    return <section className={styles.root}><div className={styles.state} aria-busy="true">Ładowanie kanału…</div></section>;
  }
  if (state.status === "error") {
    return <section className={styles.root}><div className={styles.errorState} role="alert">{state.message}</div></section>;
  }
  const { channel, leads, viewer } = state.data;
  return (
    <section className={styles.root} aria-labelledby="channel-heading">
      <header className={styles.profileHero}>
        <span className={styles.profileEmoji} aria-hidden="true">{channel.name.charAt(0).toUpperCase()}</span>
        <div className={styles.profileBody}>
          <h1 id="channel-heading" className={styles.profileName}>{channel.name}</h1>
          <p className={styles.profileOwner}>
            Kanał społeczności <Link to={`/communities/${channel.owner.communitySlug}`}>{channel.owner.communityName}</Link>
          </p>
          {channel.description ? <p className={styles.profileDesc}>{channel.description}</p> : null}
          <div className={styles.profileMeta}>
            <span><span className={styles.metaCount}>{channel.followerCount}</span> obserwujących</span>
            <span className={styles.metaDot}>·</span>
            <span><span className={styles.metaCount}>{channel.leadCount}</span> prowadzących</span>
            {channel.visibility === "private" ? (
              <>
                <span className={styles.metaDot}>·</span>
                <span className={`${styles.badge} ${styles.badgePrivate}`}>Prywatny</span>
              </>
            ) : null}
            {viewer.isLead ? (
              <>
                <span className={styles.metaDot}>·</span>
                <span className={`${styles.badge} ${viewer.leadRole === "lead" ? styles.badgeLead : styles.badgeCoLead}`}>
                  {viewer.leadRole === "lead" ? "Prowadzisz" : "Współprowadzisz"}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={channel.viewerFollows ? styles.secondaryBtn : styles.primaryBtn}
            onClick={() => void toggleFollow()}
            disabled={busy || !viewer.canFollow}
            aria-pressed={channel.viewerFollows}
            aria-label={channel.viewerFollows ? "Przestań obserwować kanał" : "Obserwuj kanał"}
          >
            {followLabel({ viewerFollows: channel.viewerFollows })}
          </button>
        </div>
      </header>

      <ChannelPostComposer
        channelSlug={channel.slug}
        canPublish={state.data.feed.canPublish}
        onPublished={load}
      />

      <ChannelFeedList
        channelSlug={channel.slug}
        feed={state.data.feed}
        onChanged={load}
      />

      <ChannelLeadsPanel
        channelSlug={channel.slug}
        communitySlug={channel.owner.communitySlug}
        leads={leads}
        canManageLeads={viewer.canManageLeads}
        onChanged={load}
      />
    </section>
  );
}
