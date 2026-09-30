"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { animate } from "framer-motion";

const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const r2 = (v: number) => Math.round(v * 100) / 100;
const pollen = Array.from({ length: 34 }, (_, i) => ({
  left: `${r2(rand(i + 600) * 100)}%`,
  size: `${r2(1.5 + rand(i + 700) * 3)}px`,
  dur: `${r2(13 + rand(i + 800) * 16)}s`,
  delay: `${r2(-rand(i + 900) * 30)}s`,
  dx: `${Math.round((rand(i + 1000) - .3) * 140)}px`,
  o: String(r2(.3 + rand(i + 1100) * .5)),
}));

export function FieldScene() {
  const root = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);

  useLenis(({ scroll }) => {
    root.current?.style.setProperty("--sy", String(Math.min(scroll, 3000)));
  });

  useEffect(() => {
    const onVisibility = () => root.current?.toggleAttribute("data-paused", document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const intro = photo.current && !reduce
      ? animate(photo.current, { scale: [1.06, 1] }, { duration: 3, ease: [.22, 1, .36, 1] })
      : undefined;
    return () => { document.removeEventListener("visibilitychange", onVisibility); intro?.stop(); };
  }, []);

  return <div ref={root} aria-hidden="true">
    <div className="scene">
      <div className="scene-layer absolute inset-0" style={{ "--depth": .04 } as React.CSSProperties}>
        <div ref={photo} className="landscape" />
      </div>
    </div>
    <div className="scene-shade" />
    <div className="scene-dusk" />
    <div className="drift">
      {pollen.map((p, i) => <span key={i} className="pollen" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.dur, animationDelay: p.delay, "--dx": p.dx, "--o": p.o } as React.CSSProperties} />)}
    </div>
  </div>;
}
