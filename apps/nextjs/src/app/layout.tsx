import { Nav } from "@/components/nav";
import { SessionProvider } from "@/components/session-provider";
import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Self-hosted at build time by next/font: no layout shift, no runtime request.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "BusyHour × Next.js",
  description: "Chat, an activity feed and a notification inbox on BusyHour.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <SessionProvider>
          <div className="shell">
            <Nav />
            <main>{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
