import type { Metadata } from "next";
import { Archivo, Cormorant_Garamond, DM_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// One superfamily at two widths. The `wdth` axis is what makes the display
// voice possible — see `.record-heading` in globals.css.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

// Everything TUKLAS measured. Not variable; 400 reads, 500 emphasises.
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

// The wordmark and the landing's headings — see components/brand/logo.tsx
// and .lp-display in globals.css.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "TUKLAS",
  description:
    "Lead intelligence for freelancers selling web services to local Philippine businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${dmMono.variable} ${cormorant.variable} antialiased`}
    >
      <body className="min-h-dvh">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
