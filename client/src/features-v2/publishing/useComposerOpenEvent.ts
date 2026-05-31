/**
 * features-v2/publishing — useComposerOpenEvent.
 *
 * Tiny pub/sub bridge between the mobile FAB (FloatingNav) and the per-surface
 * composer modals. The FAB does not know which surface owns the composer on a
 * given route; it just dispatches `platformax:open-composer` with a `surface`
 * payload, and the page that owns the composer subscribes via this hook.
 *
 * No DOM state, no localStorage, no fake save — just a CustomEvent contract.
 */
import { useEffect } from "react";

export type ComposerSurface = "friend_feed" | "community_feed" | "channel";

const EVENT_NAME = "platformax:open-composer";

interface ComposerOpenDetail {
  surface: ComposerSurface;
}

export function dispatchOpenComposer(surface: ComposerSurface): void {
  if (typeof window === "undefined") return;
  const event = new CustomEvent<ComposerOpenDetail>(EVENT_NAME, {
    detail: { surface },
  });
  window.dispatchEvent(event);
}

export function useComposerOpenEvent(
  surface: ComposerSurface,
  onOpen: () => void,
): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    function handler(e: Event) {
      const ce = e as CustomEvent<ComposerOpenDetail>;
      if (ce.detail?.surface === surface) onOpen();
    }
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [surface, onOpen]);
}
