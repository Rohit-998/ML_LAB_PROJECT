"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Wheat } from "lucide-react";
import type { Analysis } from "@/types";
import { getAnalysis } from "@/lib/api";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { PredictSection } from "@/components/predict-section";
import { ModelsSection } from "@/components/models-section";
import { FeaturesSection } from "@/components/features-section";
import { PcaSection } from "@/components/pca-section";
import { Credits } from "@/components/credits";

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    getAnalysis().then(setAnalysis).catch(err => setError(err instanceof Error ? err.message : "Could not load the analysis."));
  }, []);
  useEffect(load, [load]);

  return <>
    <Header online={analysis ? true : error ? false : null} />
    <main>
      <Hero analysis={analysis} />
      <PredictSection />
      {analysis ? <>
        <ModelsSection analysis={analysis} />
        <FeaturesSection analysis={analysis} />
        <PcaSection analysis={analysis} />
      </> : <section id="models" className="px-3 py-24 md:px-8">
        <div className="glass mx-auto flex max-w-[720px] flex-col items-center gap-4 rounded-[24px] px-6 py-14 text-center">
          {error ? <>
            <Wheat size={32} strokeWidth={1.3} className="text-wheat" />
            <h2 className="font-display text-[26px] font-normal tracking-[-1px]">The field is quiet for now.</h2>
            <p className="max-w-sm text-[13px] leading-6 text-ink-3" role="alert">{error}</p>
            <button className="button secondary" onClick={load}>Try again</button>
          </> : <><LoaderCircle className="spin text-wheat" size={26} /><p className="text-[13px] text-ink-3">Gathering the season&apos;s numbers...</p></>}
        </div>
      </section>}
      <Credits />
    </main>
    <footer className="px-3 pb-8 md:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 border-t hairline pt-6 text-[11px] text-[#b3c5b0]">
        <span className="inline-flex items-center gap-2"><Wheat size={13} /> Grown from data. Tended by hand.</span>
        <span>ML Lab Project · Crop_recommendation dataset</span>
      </div>
    </footer>
  </>;
}
