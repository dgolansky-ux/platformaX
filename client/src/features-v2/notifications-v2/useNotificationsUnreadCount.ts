import { useEffect, useState } from "react";
import { notificationsMockAdapter } from "./mock-adapter";
import type { NotificationUnreadCountUi } from "./types";

const EMPTY_COUNT: NotificationUnreadCountUi = {
  total: 0,
  byCategory: {
    friend_feed: 0,
    communities: 0,
    channels: 0,
    professional: 0,
    modules: 0,
    system: 0,
  },
};

/**
 * Subscribes the caller to the notifications adapter's unread count. The
 * count is loaded on mount and refreshed whenever any other consumer of the
 * adapter mutates state (mark read, archive, etc.). The hook returns the last
 * known truthful value, never a fake/optimistic count.
 */
export function useNotificationsUnreadCount(viewerUserId: string | null): NotificationUnreadCountUi {
  const [count, setCount] = useState<NotificationUnreadCountUi>(EMPTY_COUNT);

  useEffect(() => {
    if (!viewerUserId) {
      setCount(EMPTY_COUNT);
      return;
    }
    let cancelled = false;
    async function load(): Promise<void> {
      if (!viewerUserId) return;
      const res = await notificationsMockAdapter.getUnreadCount(viewerUserId);
      if (cancelled) return;
      if (res.ok) setCount(res.value);
    }
    void load();
    const off = notificationsMockAdapter.subscribe(() => {
      void load();
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [viewerUserId]);

  return count;
}
