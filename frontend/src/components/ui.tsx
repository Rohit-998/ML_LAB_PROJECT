"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Sprout } from "lucide-react";

export function Brand() {
  return <span className="inline-flex items-center gap-2 font-display text-[25px] font-[750] tracking-[-1.2px]">
    <span className="grid h-[34px] w-8 -rotate-8 place-items-center text-wheat"><Sprout size={24} strokeWidth={2.2} /></span>
    CropAI<span className="-ml-2 text-wheat">.</span>
  </span>;
}

export function Reveal({ children, delay = 0, className, y = 22 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }} transition={{ duration: .75, delay, ease: [.22, 1, .36, 1] }}>
    {children}
  </motion.div>;
}

export function SectionHead({ id, eyebrow, title, accent, children }: { id: string; eyebrow: string; title: string; accent?: string; children?: React.ReactNode }) {
  return <Reveal className="mb-9 grid gap-5 md:mb-12 md:grid-cols-[1.25fr_1fr] md:items-end md:gap-12">
    <div>
      <span className="eyebrow"><span className="tiny-sun" />{eyebrow}</span>
      <h2 id={`${id}-title`} className="mt-5 font-display text-[clamp(36px,4.6vw,62px)] leading-[1.04] font-normal tracking-[-2.5px]">
        {title}{accent && <><br /><span className="muted-2">{accent}</span></>}
      </h2>
    </div>
    {children && <p className="max-w-md text-[13px] leading-[1.8] text-ink-2 md:justify-self-end">{children}</p>}
  </Reveal>;
}

export function Card({ children, className, title, subtitle, action }: { children: React.ReactNode; className?: string; title?: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className={clsx("glass rounded-[24px] p-6 md:p-7", className)}>
    {(title || action) && <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {title && <h3 className="font-display text-[15px] font-semibold tracking-[-.3px] text-ink">{title}</h3>}
        {subtitle && <p className="mt-1 text-[12px] leading-5 text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>}
    {children}
  </div>;
}

export function Segmented<T extends string>({ options, value, onChange, label, render }: { options: readonly T[]; value: T; onChange: (value: T) => void; label: string; render?: (value: T) => React.ReactNode }) {
  return <div className="segmented" role="group" aria-label={label}>
    {options.map(option => <button key={option} type="button" aria-pressed={option === value} onClick={() => onChange(option)}>{render ? render(option) : option}</button>)}
  </div>;
}

type TipState<T> = { x: number; y: number; data: T };

export function useTooltip<T>() {
  const container = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState<T> | null>(null);
  const show = useCallback((event: React.PointerEvent | React.FocusEvent, data: T) => {
    const box = container.current?.getBoundingClientRect();
    if (!box) return;
    if ("clientX" in event) setTip({ x: event.clientX - box.left, y: event.clientY - box.top, data });
    else {
      const target = (event.target as Element).getBoundingClientRect();
      setTip({ x: target.left + target.width / 2 - box.left, y: target.top - box.top, data });
    }
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return { container, tip, show, hide };
}

export function Tip<T>({ tip, children }: { tip: TipState<T> | null; children: React.ReactNode }) {
  const [width, setWidth] = useState(0);
  const measure = useCallback((node: HTMLDivElement | null) => { if (node?.parentElement) setWidth(node.parentElement.clientWidth); }, []);
  if (!tip) return null;
  const align = tip.x < 100 ? "start" : width && tip.x > width - 100 ? "end" : undefined;
  return <div ref={measure} className="chart-tip" data-align={align} style={{ left: tip.x, top: tip.y }}>{children}</div>;
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ink-2">
    {items.map(item => <li key={item.label} className="inline-flex items-center gap-2"><span className="swatch" style={{ background: item.color }} />{item.label}</li>)}
  </ul>;
}
