"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades + slides a section in once it enters the viewport. Marks content visible immediately
 * (no observer, no animation) under `prefers-reduced-motion: reduce`, same policy as
 * HeroBackground's cross-fade interval.
 */
function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Lazy initializer runs during the client's first render (not inside an effect), so the
  // reduced-motion case never needs its own setState call — only the IntersectionObserver path
  // below calls setVisible, and only from its callback, not synchronously in the effect body.
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="reveal" data-visible={visible}>
      {children}
    </div>
  );
}
