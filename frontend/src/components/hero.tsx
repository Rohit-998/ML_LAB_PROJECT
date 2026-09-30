"use client";

import { motion } from "framer-motion";
import { ArrowRight, Droplets, FlaskConical, Thermometer } from "lucide-react";
import type { Analysis } from "@/types";
import { pct } from "@/lib/format";

const rise = (delay: number) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: .8, delay, ease: [.22, 1, .36, 1] as const } });

export function Hero({ analysis }: { analysis: Analysis | null }) {
  const stats = analysis?.dataset_stats;
  const best = analysis ? analysis.model_results[analysis.best_model] : null;
  const figures = [
    { value: stats ? String(stats.n_crops) : "22", label: "crops it knows" },
    { value: stats ? stats.n_samples.toLocaleString() : "2,200", label: "field samples" },
    { value: best ? pct(best.accuracy) : "—", label: "best accuracy" },
  ];

  return <section id="top" className="px-3 pt-24 pb-10 md:px-8 md:pt-28">
    <div className="frame mx-auto flex min-h-[calc(100svh-140px)] max-w-[1440px] flex-col px-6 py-8 md:px-10 md:py-10">
      <div className="grid flex-1 items-center gap-12 py-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <motion.div {...rise(.1)}>
          <span className="eyebrow"><span className="tiny-sun" />Your soil. A little wiser.</span>
          <h1 className="mt-7 -ml-1 font-display text-[clamp(54px,7vw,104px)] leading-[.99] font-normal tracking-[-4px]">
            Less guessing.<br /><span className="muted-2">More</span><br />harvest.
          </h1>
          <p className="mt-10 max-w-md text-[14px] leading-[1.8] text-ink-2">
            Share what is in your soil and what the season looks like.{" "}<br className="hidden md:block" />
            Three trained models suggest the crop that belongs there.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#predict" className="button primary">Find my crop <ArrowRight size={18} /></a>
            <a href="#models" className="button secondary">How the models compare</a>
          </div>
          <div className="mt-14 hidden items-center gap-3 text-[11px] text-[#c3d4c0] md:flex"><span className="note-line" />A calmer way to plan the season.</div>
        </motion.div>

        <motion.aside {...rise(.25)} className="glass-card w-full max-w-[430px] rounded-[23px] p-8 lg:justify-self-end" aria-label="Project at a glance">
          <span className="eyebrow">This season&apos;s almanac</span>
          <h2 className="mt-3 font-display text-[28px] leading-tight font-medium tracking-[-1px]">Seven readings.<br />One good match.</h2>
          <dl className="mt-7 grid grid-cols-3 gap-4 border-y hairline py-6">
            {figures.map(f => <div key={f.label} className="flex flex-col-reverse">
              <dt className="mt-2 text-[11px] leading-4 text-ink-3">{f.label}</dt>
              <dd className="m-0 font-display text-[26px] leading-none font-medium tracking-tight">{f.value}</dd>
            </div>)}
          </dl>
          <ul className="mt-6 space-y-4 text-[13px] leading-6 text-ink-2">
            <li className="flex items-start gap-3"><FlaskConical size={17} className="mt-1 shrink-0 text-wheat" />Nitrogen, phosphorus, potassium and pH from a soil test</li>
            <li className="flex items-start gap-3"><Thermometer size={17} className="mt-1 shrink-0 text-wheat" />Average temperature and humidity through the season</li>
            <li className="flex items-start gap-3"><Droplets size={17} className="mt-1 shrink-0 text-wheat" />Expected rainfall, in millimetres</li>
          </ul>
        </motion.aside>
      </div>
      <footer className="flex justify-between gap-4 text-[11px] text-[#c3d4c0]"><span>Grown from 2,200 real field samples.</span><span className="hidden sm:inline">Naive Bayes · Decision Tree · KNN</span></footer>
    </div>
  </section>;
}
