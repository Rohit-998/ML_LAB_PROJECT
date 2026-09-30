import { GraduationCap, Sprout, UsersRound } from "lucide-react";
import { Reveal } from "@/components/ui";

const MENTORS = ["Dr. Chithraja Rajan", "Prof. Ashwini Agashe"];

const TEAM = [
  { name: "Rohit Agrawal", roll: "A4-B3-46" },
  { name: "Ninad Vande", roll: "A4-B3-40" },
  { name: "Bhuvisha Nagrecha", roll: "A4-B4-61" },
];

const initials = (name: string) => name.split(" ").map(part => part[0]).join("").slice(0, 2);

export function Credits() {
  return <section className="px-3 pt-8 pb-12 md:px-8 md:pb-16" aria-labelledby="credits-title">
    <Reveal className="mx-auto max-w-[1440px]">
      <div className="glass-card overflow-hidden rounded-[28px]">
        <div className="grid gap-10 p-7 md:p-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <span className="eyebrow"><span className="tiny-sun" />Grown with care</span>
            <h2 id="credits-title" className="mt-5 font-display text-[clamp(32px,3.6vw,48px)] leading-[1.05] font-normal tracking-[-2px]">
              ML-LAB-Project<br /><span className="muted-2">Crop recommendation.</span>
            </h2>
            <p className="mt-5 max-w-sm text-[13px] leading-[1.8] text-ink-3">
              A machine learning lab project that turns soil and climate readings into a crop suggestion.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-10">
            <div>
              <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[1.4px] text-ink-3 uppercase"><GraduationCap size={15} className="text-wheat" />Mentors</h3>
              <ul className="mt-4 space-y-2">
                {MENTORS.map(name => <li key={name} className="rounded-xl border hairline bg-[#dcebd608] px-4 py-3 text-[14px] font-medium">{name}</li>)}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[1.4px] text-ink-3 uppercase"><UsersRound size={15} className="text-wheat" />Submitted by</h3>
              <ul className="mt-4 space-y-2">
                {TEAM.map(person => <li key={person.roll} className="flex items-center gap-3 rounded-xl border hairline bg-[#dcebd608] px-3 py-2.5">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-[#f1f2e429] bg-[linear-gradient(145deg,#a7a07a,#5f6b4c)] font-display text-[11px] font-semibold text-[#fbf3e3]">{initials(person.name)}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{person.name}</span>
                  <span className="shrink-0 rounded-md bg-[#f1bd7b1a] px-2 py-1 text-[11px] font-medium tabular-nums text-[#f3d6a8]">{person.roll}</span>
                </li>)}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t hairline px-7 py-4 text-[11px] text-[#b3c5b0] md:px-10">
          <Sprout size={13} className="text-wheat" /> Thank you for walking the field with us.
        </div>
      </div>
    </Reveal>
  </section>;
}
