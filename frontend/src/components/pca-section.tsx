"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Analysis } from "@/types";
import { cropName } from "@/lib/crops";
import { pct } from "@/lib/format";
import { Card, Reveal, SectionHead, Tip, useTooltip } from "@/components/ui";

const W = 520, H = 240, PAD = { l: 40, r: 12, t: 12, b: 28 };
const px = (i: number, n: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
const py = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);

function PercentLine({ series, xLabel }: { series: { label: string; values: number[]; color: string; bars?: boolean }[]; xLabel: string }) {
  const n = series[0].values.length;
  const { container, tip, show, hide } = useTooltip<number>();
  const bandW = (W - PAD.l - PAD.r) / (n - 1);

  return <div ref={container} className="chart" onPointerLeave={hide}>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label={series.map(s => s.label).join(" and ")}>
      {[0, .25, .5, .75, 1].map(t => <g key={t}>
        <line x1={PAD.l} x2={W - PAD.r} y1={py(t)} y2={py(t)} className={t === 0 ? "base-line" : "grid-line"} />
        <text x={PAD.l - 8} y={py(t) + 4} textAnchor="end" className="axis-text">{t * 100}%</text>
      </g>)}
      {Array.from({ length: n }, (_, i) => <text key={i} x={px(i, n)} y={H - 8} textAnchor="middle" className="axis-text">{i + 1}</text>)}
      {tip && <line x1={px(tip.data, n)} x2={px(tip.data, n)} y1={PAD.t} y2={H - PAD.b} stroke="#e6eed866" strokeDasharray="3 3" />}
      {series.map(s => s.bars
        ? s.values.map((v, i) => <motion.rect key={`${s.label}-${i}`} x={px(i, n) - 9} width={18} rx={4} fill={s.color} opacity={.55}
            initial={{ y: py(0), height: 0 }} whileInView={{ y: py(v), height: py(0) - py(v) }} viewport={{ once: true }} transition={{ duration: .8, delay: i * .05 }} />)
        : <g key={s.label}>
            <motion.path d={s.values.map((v, i) => `${i ? "L" : "M"}${px(i, n)},${py(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [.22, 1, .36, 1] }} />
            {s.values.map((v, i) => <circle key={i} cx={px(i, n)} cy={py(v)} r={tip?.data === i ? 5 : 3.5} fill={s.color} stroke="#1a3326" strokeWidth={2} />)}
          </g>)}
      {Array.from({ length: n }, (_, i) => <rect key={i} x={px(i, n) - bandW / 2} y={PAD.t} width={bandW} height={H - PAD.t - PAD.b} fill="transparent"
        onPointerMove={e => show(e, i)} />)}
    </svg>
    <Tip tip={tip}>{tip && <>
      <div className="tip-muted">{xLabel} {tip.data + 1}</div>
      {series.map(s => <div key={s.label} className="flex items-center gap-2"><span className="swatch" style={{ background: s.color }} />{s.label} <strong className="ml-auto pl-3 tabular-nums">{pct(s.values[tip.data])}</strong></div>)}
    </>}</Tip>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 pl-10 text-[11px] text-ink-3">
      <span>{xLabel}s →</span>
      <ul className="flex flex-wrap gap-4 text-ink-2">{series.map(s => <li key={s.label} className="inline-flex items-center gap-2"><span className="swatch" style={{ background: s.color }} />{s.label}</li>)}</ul>
    </div>
  </div>;
}

function Scatter({ analysis }: { analysis: Analysis }) {
  const { x, y, labels } = analysis.pca.scatter_2d;
  const crops = analysis.dataset_stats.crop_names;
  const [focus, setFocus] = useState("rice");
  const bounds = useMemo(() => ({ x0: Math.min(...x), x1: Math.max(...x), y0: Math.min(...y), y1: Math.max(...y) }), [x, y]);
  const sw = 640, sh = 380, pad = 16;
  const sx = (v: number) => pad + ((v - bounds.x0) / (bounds.x1 - bounds.x0)) * (sw - pad * 2);
  const sy = (v: number) => sh - pad - ((v - bounds.y0) / (bounds.y1 - bounds.y0)) * (sh - pad * 2);
  const count = labels.filter(l => l === focus).length;

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
    <div className="rounded-2xl border hairline bg-[#06180f26] p-2">
      <svg viewBox={`0 0 ${sw} ${sh}`} className="w-full" role="img" aria-label={`PCA scatter, ${cropName(focus)} highlighted`}>
        {x.map((_, i) => labels[i] !== focus && <circle key={i} cx={sx(x[i])} cy={sy(y[i])} r={3} fill="#c9d8c2" opacity={.2} />)}
        {x.map((_, i) => labels[i] === focus && <circle key={`f${i}`} cx={sx(x[i])} cy={sy(y[i])} r={5} fill="#f1bd7b" stroke="#1a3326" strokeWidth={2} />)}
      </svg>
      <div className="flex justify-between px-2 pb-1 text-[11px] text-ink-3"><span>PC 1 →</span><span>↑ PC 2</span></div>
    </div>
    <div>
      <p className="text-[12px] leading-5 text-ink-2"><span className="font-semibold text-wheat">{cropName(focus)}</span> · {count} of {labels.length} sampled points. Pick a crop to see where it lives once seven readings are squeezed into two.</p>
      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Highlight crop">
        {crops.map(c => <button key={c} type="button" className="chip !px-2.5 !py-1 !text-[11px]" aria-pressed={focus === c} onClick={() => setFocus(c)}>{cropName(c)}</button>)}
      </div>
    </div>
  </div>;
}

export function PcaSection({ analysis }: { analysis: Analysis }) {
  const { explained_variance, cumulative_variance, accuracy_by_components } = analysis.pca;
  const accuracy = Object.keys(accuracy_by_components).sort((a, b) => +a - +b).map(k => accuracy_by_components[k]);
  const twoComponents = cumulative_variance[1];

  return <section id="pca" className="px-3 py-20 md:px-8 md:py-28" aria-labelledby="pca-title">
    <div className="mx-auto max-w-[1440px]">
      <SectionHead id="pca" eyebrow="Patterns in the soil" title="Can we see it" accent="in fewer numbers?">
        {`PCA compresses the seven readings into principal components. Two of them keep only ${pct(twoComponents, 0)} of the variation, which is why crops overlap in the flat view below.`}
      </SectionHead>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal><Card title="Variance explained" subtitle="Per component, and running total." className="h-full">
          <PercentLine xLabel="Component" series={[
            { label: "Per component", values: explained_variance, color: "#c9d8c2", bars: true },
            { label: "Cumulative", values: cumulative_variance, color: "#f1bd7b" },
          ]} />
        </Card></Reveal>
        <Reveal delay={.08}><Card title="Accuracy vs. components kept" subtitle="How well a model does using only the first k components." className="h-full">
          <PercentLine xLabel="Component" series={[{ label: "Accuracy", values: accuracy, color: "#b9d3a4" }]} />
        </Card></Reveal>
      </div>

      <Reveal className="mt-4"><Card title="The field, flattened" subtitle="Training samples on the first two principal components."><Scatter analysis={analysis} /></Card></Reveal>
    </div>
  </section>;
}
