"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { Analysis, ModelName } from "@/types";
import { MODELS, MODEL_BLURB, MODEL_COLOR, cropName } from "@/lib/crops";
import { pct } from "@/lib/format";
import { Card, Legend, Reveal, SectionHead, Segmented, Tip, useTooltip } from "@/components/ui";

type Metric = "accuracy" | "f1_weighted" | "cv_mean";
const METRICS: Metric[] = ["accuracy", "f1_weighted", "cv_mean"];
const METRIC_LABEL: Record<Metric, string> = { accuracy: "Test accuracy", f1_weighted: "Weighted F1", cv_mean: "5-fold CV" };

function MetricBars({ analysis }: { analysis: Analysis }) {
  const { container, tip, show, hide } = useTooltip<{ model: ModelName; metric: Metric; value: number; std?: number }>();
  const floor = .94;
  const ticks = [.94, .96, .98, 1];
  const h = 220;
  const y = (v: number) => h - ((Math.max(v, floor) - floor) / (1 - floor)) * h;

  return <div ref={container} className="chart" onPointerLeave={hide}>
    <div className="relative ml-10" style={{ height: h }}>
      {ticks.map(t => <div key={t} className="absolute inset-x-0 flex items-center" style={{ top: y(t) }}>
        <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-[11px] tabular-nums text-ink-3">{Math.round(t * 100)}%</span>
        <span className={t === floor ? "h-px w-full bg-[#e6eed84d]" : "h-px w-full bg-[#e6eed81a]"} />
      </div>)}
      <div className="absolute inset-0 grid grid-cols-3 gap-6 px-2">
        {METRICS.map(metric => <div key={metric} className="flex items-end justify-center gap-[2px]">
          {MODELS.map((model, i) => {
            const result = analysis.model_results[model];
            const value = result[metric];
            return <button key={model} type="button" className="bar-hit flex h-full w-full max-w-11 items-end focus-visible:outline-offset-2"
              aria-label={`${model}, ${METRIC_LABEL[metric]} ${pct(value, 2)}`}
              onPointerMove={e => show(e, { model, metric, value, std: metric === "cv_mean" ? result.cv_std : undefined })}
              onFocus={e => show(e, { model, metric, value })} onBlur={hide}>
              <motion.span className="bar-fill block w-full rounded-t-[4px]" style={{ background: MODEL_COLOR[model] }}
                initial={{ height: 0 }} whileInView={{ height: h - y(value) }} viewport={{ once: true }} transition={{ duration: 1, delay: i * .08, ease: [.22, 1, .36, 1] }} />
            </button>;
          })}
        </div>)}
      </div>
      <Tip tip={tip}>{tip && <>
        <strong className="font-semibold">{tip.data.model}</strong>
        <div className="tip-muted">{METRIC_LABEL[tip.data.metric]}</div>
        <div className="tabular-nums">{pct(tip.data.value, 2)}{tip.data.std !== undefined && <span className="tip-muted"> ± {pct(tip.data.std, 2)}</span>}</div>
      </>}</Tip>
    </div>
    <div className="mt-3 ml-10 grid grid-cols-3 gap-6 px-2 text-center text-[11px] text-ink-3">
      {METRICS.map(m => <span key={m}>{METRIC_LABEL[m]}</span>)}
    </div>
    <div className="mt-5 ml-10"><Legend items={MODELS.map(m => ({ label: m, color: MODEL_COLOR[m] }))} /></div>
  </div>;
}

function Confusion({ analysis, model }: { analysis: Analysis; model: ModelName }) {
  const crops = analysis.dataset_stats.crop_names;
  const matrix = analysis.model_results[model].confusion_matrix;
  const max = Math.max(...matrix.flat());
  const { container, tip, show, hide } = useTooltip<{ actual: string; predicted: string; count: number }>();
  const mistakes = useMemo(() => {
    const list: { actual: string; predicted: string; count: number }[] = [];
    matrix.forEach((row, i) => row.forEach((count, j) => { if (i !== j && count > 0) list.push({ actual: crops[i], predicted: crops[j], count }); }));
    return list.sort((a, b) => b.count - a.count);
  }, [matrix, crops]);

  return <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px]">
    <div ref={container} className="chart overflow-x-auto" data-lenis-prevent-horizontal onPointerLeave={hide}>
      <div className="min-w-[560px]">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `88px repeat(${crops.length}, minmax(0, 1fr))` }} role="grid" aria-label={`Confusion matrix for ${model}`}>
          {matrix.map((row, i) => <div key={crops[i]} className="contents" role="row">
            <span className="truncate pr-2 text-right text-[10px] leading-[18px] text-ink-3" role="rowheader">{cropName(crops[i])}</span>
            {row.map((count, j) => {
              const diagonal = i === j;
              const bg = count === 0 ? "#dcebd60a" : diagonal ? `color-mix(in oklab, #f1bd7b ${35 + (count / max) * 65}%, #1f3a2d)` : "#e0795b";
              return <span key={j} role="gridcell" tabIndex={count > 0 ? 0 : -1} className="heat-cell aspect-square min-h-[18px]" style={{ background: bg }}
                aria-label={`Actual ${cropName(crops[i])}, predicted ${cropName(crops[j])}: ${count}`}
                onPointerMove={e => show(e, { actual: crops[i], predicted: crops[j], count })} onFocus={e => show(e, { actual: crops[i], predicted: crops[j], count })} onBlur={hide} />;
            })}
          </div>)}
        </div>
        <div className="mt-2 flex justify-between pl-[90px] text-[10px] text-ink-3"><span>Predicted crop →</span><span>rows are the actual crop</span></div>
      </div>
      <Tip tip={tip}>{tip && <>
        <div><span className="tip-muted">Actual</span> {cropName(tip.data.actual)}</div>
        <div><span className="tip-muted">Predicted</span> {cropName(tip.data.predicted)}</div>
        <strong className="tabular-nums">{tip.data.count} {tip.data.count === 1 ? "sample" : "samples"}</strong>
      </>}</Tip>
    </div>

    <div>
      <div className="flex flex-wrap gap-4 text-[11px] text-ink-2">
        <span className="inline-flex items-center gap-2"><span className="swatch" style={{ background: "#f1bd7b" }} />Correct</span>
        <span className="inline-flex items-center gap-2"><span className="swatch" style={{ background: "#e0795b" }} />Mix-up</span>
      </div>
      <h4 className="mt-6 text-[11px] font-semibold tracking-[1.4px] text-ink-3 uppercase">Where it slips</h4>
      {mistakes.length === 0 ? <p className="mt-3 text-[13px] text-ink-2">No mistakes on the test set.</p> :
        <ul className="mt-3 divide-y divide-[#e6eed820]">
          {mistakes.slice(0, 6).map(m => <li key={m.actual + m.predicted} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
            <span className="text-ink-2">{cropName(m.actual)} <span className="text-ink-3">read as</span> {cropName(m.predicted)}</span>
            <span className="tabular-nums text-ink">{m.count}</span>
          </li>)}
        </ul>}
      <p className="mt-4 text-[12px] leading-5 text-ink-3">{mistakes.reduce((s, m) => s + m.count, 0)} of {matrix.flat().reduce((a, b) => a + b, 0)} test samples misclassified.</p>
    </div>
  </div>;
}

export function ModelsSection({ analysis }: { analysis: Analysis }) {
  const [model, setModel] = useState<ModelName>(analysis.best_model);
  const best = analysis.best_model;

  return <section id="models" className="px-3 py-20 md:px-8 md:py-28" aria-labelledby="models-title">
    <div className="mx-auto max-w-[1440px]">
      <SectionHead id="models" eyebrow="The three advisors" title="Different minds," accent="the same field.">
        Each model was trained on the same 1,760 samples and tested on 440 it had never seen. All three land near the ceiling, so the chart zooms in on the top six percent.
      </SectionHead>

      <div className="grid gap-4 md:grid-cols-3">
        {MODELS.map((name, i) => {
          const r = analysis.model_results[name];
          return <Reveal key={name} delay={i * .08}>
            <div className="glass h-full rounded-[22px] p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2.5 text-[13px] font-semibold"><span className="swatch" style={{ background: MODEL_COLOR[name] }} />{name}</span>
                {name === best && <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f1bd7b1f] px-2 py-1 text-[10px] font-semibold text-wheat"><Trophy size={12} />Best</span>}
              </div>
              <p className="mt-5 font-display text-[44px] leading-none font-medium tracking-[-2px] tabular-nums">{pct(r.accuracy)}</p>
              <p className="mt-1.5 text-[11px] text-ink-3">test accuracy</p>
              <p className="mt-5 text-[12px] leading-5 text-ink-2">{MODEL_BLURB[name]}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t hairline pt-4 text-[12px]">
                <div><dt className="text-ink-3">Weighted F1</dt><dd className="m-0 mt-1 tabular-nums">{pct(r.f1_weighted, 2)}</dd></div>
                <div><dt className="text-ink-3">Cross-validation</dt><dd className="m-0 mt-1 tabular-nums">{pct(r.cv_mean, 2)} <span className="text-ink-3">± {pct(r.cv_std, 1)}</span></dd></div>
              </dl>
            </div>
          </Reveal>;
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <Reveal><Card title="Scores side by side" subtitle="Hover a bar for the exact value." className="h-full"><MetricBars analysis={analysis} /></Card></Reveal>
        <Reveal delay={.08}>
          <Card title="Confusion matrix" subtitle="Where each model gets it right, and what it mistakes for what." className="h-full"
            action={<Segmented label="Confusion matrix model" options={MODELS} value={model} onChange={setModel} />}>
            <Confusion analysis={analysis} model={model} />
          </Card>
        </Reveal>
      </div>
    </div>
  </section>;
}
