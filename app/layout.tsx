import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { RunningHead } from "@/components/shell/RunningHead";
import { ClientShell } from "@/components/shell/ClientShell";
import { TweaksPanel } from "@/components/shell/TweaksPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "studiolo.",
  description: "Un'edizione critica del tuo italiano",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "studiolo",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a3050",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="it"
      data-theme="light"
      data-carattere="antica"
      data-severita="sobrio"
      data-errata="lezione"
    >
      <body>
        <a href="#main" className="skip-link">Salta al contenuto</a>
        <ClientShell>
          <div className="app">
            <header className="chrome">
              {/* TODO(ali): refine the wordmark — prototype used `postill·a` (middle-dot stop on 7th char). Period-after is the safe default; happy to swap for `studio·lo` or similar if you have a preference. */}
              <Link href="/" className="wordmark">
                studiolo<span className="stop">.</span>
              </Link>
              <RunningHead />
              <div className="header-actions" aria-hidden>
                {/* Reserved for export/import affordances in M10. Theme/voice/severità live in the Aspetto panel (bottom-right). */}
              </div>
            </header>
            <main id="main">{children}</main>
          </div>
          <TweaksPanel />
        </ClientShell>
      </body>
    </html>
  );
}
