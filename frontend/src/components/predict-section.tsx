"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CloudSun, LoaderCircle, RotateCcw, Sprout } from "lucide-react";
import clsx from "clsx";
import type { FeatureKey, FieldInput, ModelName, Prediction } from "@/types";
import { CROPS, DEFAULT_INPUT, FEATURES, MODEL_BLURB, MODELS, PRESETS, cropName, type FeatureMeta } from "@/lib/crops";
import { predict } from "@/lib/api";
import { pct } from "@/lib/format";
import { CropIcon } from "@/components/crop-icon";
import { Reveal, SectionHead, Segmented } from "@/components/ui";

function Reading({ meta, value, onChange }: { meta: FeatureMeta; value: number; onChange: (value: number) => void }) {
  const fill = `${((value - meta.min) / (meta.max - meta.min)) * 100}%`;
  const id = `field-${meta.key}`;
  return <div className="py-3">
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-[12px] font-medium text-ink">{meta.label}{meta.unit && <span className="ml-1.5 text-ink-3">{meta.unit}</span>}</label>
      <input className="num-input" type="number" aria-label={`${meta.label} value`} min={meta.min} max={meta.max} step={meta.step} value={value}
        onChange={event => { const next = event.target.valueAsNumber; if (!Number.isNaN(next)) onChange(next); }} />
    </div>
    <input id={id} className="range" type="range" min={meta.min} max={meta.max} step={meta.step} value={value} style={{ "--fill": fill } as React.CSSProperties}
      onChange={event => onChange(event.target.valueAsNumber)} />
  </div>;
}

function Result({ result, busy }: { result: Prediction | null; busy: boolean }) {
  if (!result) return <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
    <span className="mb-6 text-wheat">{busy ? <LoaderCircle className="spin" size={36} strokeWidth={1.4} /> : <Sprout size={40} strokeWidth={1.2} />}</span>
    <span className="eyebrow">{busy ? "Reading the field" : "Waiting for your field"}</span>
    <h3 className="mt-5 font-display text-[clamp(30px,3.4vw,46px)] leading-[1.08] font-normal tracking-[-2px]">A good season<br /><span className="muted-2">starts in the soil.</span></h3>
    <p className="mt-5 max-w-xs text-[12px] leading-[1.8] text-ink-3">Adjust the readings or pick a sample field, then ask for a recommendation.</p>
  </div>;

  const info = CROPS[result.crop];
  const top = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);
  const agree = Object.values(result.all_model_predictions).filter(crop => crop === result.crop).length;
  const total = Object.keys(result.all_model_predictions).length;

  return <motion.div key={result.crop + result.model_used} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: [.22, 1, .36, 1] }} className="p-6 md:p-8" aria-live="polite">
    <span className="eyebrow">Best fit for this field</span>
    <div className="mt-5 flex items-center gap-5">
      <span className="grid size-[72px] shrink-0 place-items-center rounded-[20px] border border-[#f1dcb04d] bg-[#f1bd7b1f] text-wheat"><CropIcon crop={result.crop} size={34} strokeWidth={1.6} /></span>
      <div className="min-w-0">
        <h3 className="font-display text-[clamp(38px,4vw,56px)] leading-none font-medium tracking-[-2px]">{cropName(result.crop)}</h3>
        {info && <p className="mt-2 text-[12px] text-ink-3">{info.kind} · {info.season}</p>}
      </div>
    </div>
    {info && <p className="mt-5 text-[13px] leading-[1.8] text-ink-2">{info.note}</p>}

    <div className={clsx("mt-5 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px]", agree === total ? "border-[#b9d3a433] bg-[#b9d3a414] text-[#d4e8c4]" : "border-[#f1bd7b33] bg-[#f1bd7b12] text-[#f3dbb5]")}>
      {agree === total ? <Check size={14} /> : <CloudSun size={14} />}
      {agree === total ? `All ${total} models agree` : `${agree} of ${total} models agree`}
    </div>

    {top.length > 0 && <div className="mt-7">
      <h4 className="mb-3 text-[11px] font-semibold tracking-[1.4px] text-ink-3 uppercase">How sure is {result.model_used}?</h4>
      <ul className="space-y-2.5">
        {top.map(([crop, p], i) => <li key={crop} className="grid grid-cols-[92px_1fr_48px] items-center gap-3 text-[12px]">
          <span className={clsx("truncate", i === 0 ? "text-ink" : "text-ink-2")}>{cropName(crop)}</span>
          <span className="h-[6px] overflow-hidden rounded-full bg-[#dcebd614]">
            <motion.span className="block h-full rounded-full" style={{ background: i === 0 ? "var(--wheat)" : "#c9d8c26b" }}
              initial={{ width: 0 }} animate={{ width: `${Math.max(p * 100, p > 0 ? 1.5 : 0)}%` }} transition={{ duration: .9, delay: .1 + i * .06, ease: [.22, 1, .36, 1] }} />
          </span>
          <span className="text-right tabular-nums text-ink-2">{pct(p)}</span>
        </li>)}
      </ul>
    </div>}

    <div className="mt-7 border-t hairline pt-5">
      <h4 className="mb-3 text-[11px] font-semibold tracking-[1.4px] text-ink-3 uppercase">Second opinions</h4>
      <ul className="grid gap-2 sm:grid-cols-3">
        {Object.entries(result.all_model_predictions).map(([model, crop]) => <li key={model} className="rounded-xl border hairline bg-[#dcebd608] px-3 py-2.5">
          <span className="block text-[10px] text-ink-3">{model}</span>
          <span className="mt-1 flex items-center gap-1.5 text-[13px] font-medium">{cropName(crop)}{crop === result.crop && <Check size={13} className="text-leaf" aria-label="matches" />}</span>
        </li>)}
      </ul>
    </div>
  </motion.div>;
}

export function PredictSection() {
  const [input, setInput] = useState<FieldInput>(DEFAULT_INPUT);
  const [model, setModel] = useState<ModelName>("Naive Bayes");
  const [preset, setPreset] = useState<string | null>(PRESETS[0].name);
  const [result, setResult] = useState<Prediction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (key: FeatureKey, value: number) => { setInput(current => ({ ...current, [key]: value })); setPreset(null); };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try { setResult(await predict(input, model)); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  const groups = [
    { id: "soil", title: "In the soil", features: FEATURES.filter(f => f.group === "soil") },
    { id: "climate", title: "In the sky", features: FEATURES.filter(f => f.group === "climate") },
  ];

  return <section id="predict" className="px-3 py-20 md:px-8 md:py-28" aria-labelledby="predict-title">
    <div className="mx-auto max-w-[1440px]">
      <SectionHead id="predict" eyebrow="Crop recommendation" title="Tell us about" accent="your field.">
        Seven readings are all it takes. Start from a sample field or dial in your own soil test, then let a model make the call.
      </SectionHead>

      <Reveal>
        <div className="glass grid overflow-hidden rounded-[28px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <form onSubmit={submit} className="border-b hairline bg-[linear-gradient(170deg,#dcebd610,#13302420)] p-6 md:p-8 lg:border-r lg:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow">Sample fields</span>
              <button type="button" className="quiet-link text-ink-3" onClick={() => { setInput(DEFAULT_INPUT); setPreset(PRESETS[0].name); setResult(null); }}><RotateCcw size={13} /> Reset</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Sample fields">
              {PRESETS.map(p => <button key={p.name} type="button" className="chip" aria-pressed={preset === p.name} onClick={() => { setInput(p.values); setPreset(p.name); }}>{p.name}</button>)}
            </div>

            <div className="mt-6 grid gap-x-8 md:grid-cols-2">
              {groups.map(group => <fieldset key={group.id} className="m-0 min-w-0 border-0 p-0">
                <legend className="mb-1 font-display text-[14px] font-semibold tracking-[-.3px]">{group.title}</legend>
                {group.features.map(meta => <Reading key={meta.key} meta={meta} value={input[meta.key]} onChange={value => update(meta.key, value)} />)}
              </fieldset>)}
            </div>

            <div className="mt-6 border-t hairline pt-6">
              <span className="eyebrow">Choose a model</span>
              <div className="mt-3"><Segmented label="Model" options={MODELS} value={model} onChange={setModel} /></div>
              <p className="mt-3 min-h-10 text-[12px] leading-5 text-ink-3">{MODEL_BLURB[model]}</p>
            </div>

            {error && <p className="inline-error mt-4" role="alert">{error}</p>}
            <button type="submit" className="button primary mt-5 w-full" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={18} /> : <>Recommend a crop <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="relative min-w-0 bg-[linear-gradient(145deg,#12302327,#08201558)]">
            <AnimatePresence mode="wait"><Result result={result} busy={busy} /></AnimatePresence>
          </div>
        </div>
      </Reveal>
    </div>
  </section>;
}
