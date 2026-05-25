import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hide the floating nav on scroll-down, show it on scroll-up (threshold 10px,
 * only after 60px). Behaviour ported from legacy BottomNav — UI only, no runtime.
 */
export function useScrollHide(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) > 10) {
        setHidden(delta > 0 && y > 60);
        lastY.current = y;
      }
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return hidden;
}
