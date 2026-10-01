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

const birds = Array.from({ length: 8 }, (_, i) => ({
  sz: `${Math.round(12 + rand(i + 2000) * 18)}px`,
  flyDur: `${r2(22 + rand(i + 2100) * 26)}s`,
  flyDelay: `${r2(-rand(i + 2200) * 50)}s`,
  y: `${r2(5 + rand(i + 2300) * 28)}%`,
  flapDur: `${r2(.35 + rand(i + 2400) * .3)}s`,
  o: String(r2(.35 + rand(i + 2500) * .35)),
  driftY: `${Math.round(-15 + rand(i + 2600) * -40)}px`,
  color: `rgba(20,20,18,${r2(.4 + rand(i + 2700) * .35)})`,
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
    <div className="birds-layer">
      {birds.map((b, i) => <span key={i} className="bird" style={{ "--sz": b.sz, "--fly-dur": b.flyDur, "--fly-delay": b.flyDelay, "--bird-y": b.y, "--flap-dur": b.flapDur, "--bird-o": b.o, "--drift-y": b.driftY, "--bird-color": b.color } as React.CSSProperties} />)}
    </div>
    <div className="drift">
      {pollen.map((p, i) => <span key={i} className="pollen" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.dur, animationDelay: p.delay, "--dx": p.dx, "--o": p.o } as React.CSSProperties} />)}
    </div>
  </div>;
}
