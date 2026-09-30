"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Brand } from "@/components/ui";

const LINKS = [
  { id: "predict", label: "Recommend" },
  { id: "models", label: "Models" },
  { id: "features", label: "What matters" },
  { id: "pca", label: "Patterns" },
];

export function Header({ online }: { online: boolean | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  useLenis(({ scroll }) => setScrolled(scroll > 40));

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-45% 0px -50% 0px" });
    for (const id of ["top", ...LINKS.map(link => link.id)]) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}
    className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-8 md:pt-4">
    <div className={clsx("mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 rounded-[20px] border px-4 transition-all duration-500 md:px-6",
      scrolled ? "glass" : "border-transparent")}>
      <a href="#top" aria-label="CropAI home"><Brand /></a>
      <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
        {LINKS.map(link => <a key={link.id} href={`#${link.id}`} className="nav-link" data-active={active === link.id}>{link.label}</a>)}
      </nav>
      <div className="flex items-center gap-2 text-[11px] text-[#dfeadf]">
        <span className={clsx("size-[6px] rounded-full", online ? "bg-[#a4d6b5] shadow-[0_0_7px_#96dcb366]" : online === false ? "bg-[#e2a07a]" : "bg-[#8ea29a]")} />
        <span className="hidden sm:inline">{online ? "Models ready" : online === false ? "Server offline" : "Connecting"}</span>
      </div>
    </div>
  </motion.header>;
}
