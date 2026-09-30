"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ReactLenis root options={{
    autoRaf: true,
    lerp: .09,
    anchors: { offset: -84 },
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
  }}>
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  </ReactLenis>;
}
