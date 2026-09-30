"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Analysis, FeatureKey, ModelName } from "@/types";
import { FEATURE_LABEL, MODELS, MODEL_COLOR } from "@/lib/crops";
import { num, pct, pp } from "@/lib/format";
import { Card, Reveal, SectionHead, Segmented, Tip, useTooltip } from "@/components/ui";

type View = "Permutation" | "Tree splits";

function ImportanceBars({ values, color, format }: { values: Record<FeatureKey, number>; color: string; format: (v: number) => string }) {
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]) as [FeatureKey, number][];
  const max = Math.max(...rows.map(r => r[1]), .0001);
  return <ul className="space-y-3">
    {rows.map(([key, value], i) => <li key={key} className="grid grid-cols-[96px_1fr_56px] items-center gap-3 text-[12px]">
      <span className="text-ink-2">{FEATURE_LABEL[key]}</span>
      <span className="h-[10px] overflow-hidden rounded-r-[4px] bg-[#dcebd60d]">
        <motion.span className="block h-full rounded-r-[4px]" style={{ background: color }} initial={{ width: 0 }}
          whileInView={{ width: `${(value / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: .9, delay: i * .05, ease: [.22, 1, .36, 1] }} />
      </span>
      <span className="text-right tabular-nums text-ink">{format(value)}</span>
    </li>)}
  </ul>;
}

function AblationGrid({ analysis }: { analysis: Analysis }) {
  const features = analysis.dataset_stats.feature_names;
  const { container, tip, show, hide } = useTooltip<{ model: ModelName; feature: FeatureKey; drop: number; without: number }>();
  const max = Math.max(...MODELS.flatMap(m => features.map(f => Math.abs(analysis.ablation_study[m].feature_drops[f].accuracy_drop))));
  const color = (drop: number) => {
    const t = Math.min(Math.abs(drop) / max, 1);
    if (Math.abs(drop) < .0005) return "#dcebd612";
    return drop > 0 ? `color-mix(in oklab, #e0795b ${18 + t * 82}%, #1f3a2d)` : `color-mix(in oklab, #6fa9d6 ${18 + t * 82}%, #1f3a2d)`;
  };

  return <div ref={container} className="chart overflow-x-auto" data-lenis-prevent-horizontal onPointerLeave={hide}>
    <div className="min-w-[520px]">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `120px repeat(${features.length}, minmax(0, 1fr))` }}>
        <span />
        {features.map(f => <span key={f} className="pb-2 text-center text-[11px] text-ink-3">{FEATURE_LABEL[f]}</span>)}
        {MODELS.map(model => <div key={model} className="contents">
          <span className="flex items-center gap-2 pr-2 text-[12px] text-ink-2"><span className="swatch" style={{ background: MODEL_COLOR[model] }} />{model}</span>
          {features.map(f => {
            const d = analysis.ablation_study[model].feature_drops[f];
            return <span key={f} tabIndex={0} className="heat-cell flex h-12 items-center justify-center text-[11px] tabular-nums text-ink" style={{ background: color(d.accuracy_drop) }}
              aria-label={`${model} without ${FEATURE_LABEL[f]}: ${pp(d.accuracy_drop)}`}
              onPointerMove={e => show(e, { model, feature: f, drop: d.accuracy_drop, without: d.accuracy_without })}
              onFocus={e => show(e, { model, feature: f, drop: d.accuracy_drop, without: d.accuracy_without })} onBlur={hide}>
              {Math.abs(d.accuracy_drop) >= .0005 ? (d.accuracy_drop * 100).toFixed(1) : "0"}
            </span>;
          })}
        </div>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 pl-[123px] text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-2"><span className="swatch" style={{ background: "#e0795b" }} />Accuracy lost (pp)</span>
        <span className="inline-flex items-center gap-2"><span className="swatch" style={{ background: "#6fa9d6" }} />Slightly improved</span>
        <span className="inline-flex items-center gap-2"><span className="swatch" style={{ background: "#dcebd630" }} />No change</span>
      </div>
    </div>
    <Tip tip={tip}>{tip && <>
      <strong className="font-semibold">{tip.data.model}</strong> <span className="tip-muted">without</span> {FEATURE_LABEL[tip.data.feature]}
      <div className="tabular-nums">{pct(tip.data.without, 2)} <span className="tip-muted">accuracy</span></div>
      <div className="tabular-nums">{pp(tip.data.drop)} <span className="tip-muted">{tip.data.drop > 0 ? "lost" : "change"}</span></div>
    </>}</Tip>
  </div>;
}

export function FeaturesSection({ analysis }: { analysis: Analysis }) {
  const [view, setView] = useState<View>("Permutation");
  const [model, setModel] = useState<ModelName>("Decision Tree");
  const treeImportance = analysis.feature_importance["Decision Tree"];

  const biggest = useMemo(() => {
    let top = { model: MODELS[0], feature: "rainfall" as FeatureKey, drop: -Infinity };
    for (const m of MODELS) for (const [f, d] of Object.entries(analysis.ablation_study[m].feature_drops) as [FeatureKey, { accuracy_drop: number }][])
      if (d.accuracy_drop > top.drop) top = { model: m, feature: f, drop: d.accuracy_drop };
    return top;
  }, [analysis]);

  const stats = analysis.dataset_stats.feature_stats;
  const features = analysis.dataset_stats.feature_names;

  return <section id="features" className="px-3 py-20 md:px-8 md:py-28" aria-labelledby="features-title">
    <div className="mx-auto max-w-[1440px]">
      <SectionHead id="features" eyebrow="What the models listen to" title="Some readings" accent="matter more.">
        Importance shows what a model leans on. The ablation study goes further: remove one reading, retrain, and see how much accuracy the field loses.
      </SectionHead>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <Reveal>
          <Card title="Feature importance" className="h-full"
            subtitle={view === "Permutation" ? "Accuracy lost when a feature's values are shuffled." : "Share of the Decision Tree's split gain."}
            action={<Segmented label="Importance type" options={["Permutation", "Tree splits"] as const} value={view} onChange={setView} />}>
            {view === "Permutation" ? <>
              <div className="mb-5"><Segmented label="Importance model" options={MODELS} value={model} onChange={setModel} /></div>
              <ImportanceBars values={analysis.permutation_importance[model]} color={MODEL_COLOR[model]} format={v => num(v, 3)} />
            </> : treeImportance ? <ImportanceBars values={treeImportance} color={MODEL_COLOR["Decision Tree"]} format={v => pct(v, 1)} />
              : <p className="text-[13px] text-ink-3">No tree importance in this analysis.</p>}
          </Card>
        </Reveal>
        <Reveal delay={.08}>
          <Card title="Ablation study" subtitle="Accuracy change in percentage points when each reading is left out." className="h-full">
            <AblationGrid analysis={analysis} />
            <div className="mt-6 flex items-start gap-4 rounded-2xl border hairline bg-[#dcebd608] p-4">
              <span className="font-display text-[28px] leading-none font-medium tracking-tight text-wheat tabular-nums">{(biggest.drop * 100).toFixed(1)}</span>
              <p className="text-[12px] leading-5 text-ink-2">percentage points is the largest single loss: {FEATURE_LABEL[biggest.feature].toLowerCase()}, removed from {biggest.model}. With 99% baselines every drop is small, but it shows which readings the models can&apos;t replace.</p>
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-4">
        <Card title="The dataset at a glance" subtitle={`${analysis.dataset_stats.n_samples.toLocaleString()} samples across ${analysis.dataset_stats.n_crops} crops, perfectly balanced at 100 each.`}>
          <div className="overflow-x-auto" data-lenis-prevent-horizontal>
            <table className="w-full min-w-[560px] border-collapse text-[12px]">
              <thead><tr className="border-b hairline text-left text-ink-3">
                {["Reading", "Mean", "Std dev", "Min", "Max", "Range"].map((h, i) => <th key={h} scope="col" className={`py-3 font-medium ${i ? "text-right" : ""}`}>{h}</th>)}
              </tr></thead>
              <tbody className="tabular-nums">
                {features.map(f => {
                  const s = stats[f];
                  const span = s.max - s.min;
                  return <tr key={f} className="border-b border-[#e6eed812] last:border-0">
                    <th scope="row" className="py-3 text-left font-medium text-ink">{FEATURE_LABEL[f]}</th>
                    <td className="py-3 text-right text-ink-2">{num(s.mean, 2)}</td>
                    <td className="py-3 text-right text-ink-2">{num(s.std, 2)}</td>
                    <td className="py-3 text-right text-ink-2">{num(s.min, 2)}</td>
                    <td className="py-3 text-right text-ink-2">{num(s.max, 2)}</td>
                    <td className="py-3 text-right text-ink-2">{num(span, 2)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>
    </div>
  </section>;
}
