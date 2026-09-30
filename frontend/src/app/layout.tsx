import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { FieldScene } from "@/components/field-scene";
import "./globals.css";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Manrope({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "CropAI | Read the soil, grow what belongs",
  description: "Crop recommendation from soil nutrients and climate, powered by Naive Bayes, Decision Tree and KNN models.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1a2416" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${body.variable} ${display.variable}`}>
    <body>
      <Providers>
        <FieldScene />
        {children}
      </Providers>
    </body>
  </html>;
}
