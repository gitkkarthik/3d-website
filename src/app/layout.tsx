import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/instrument-sans/index.css";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Pawsome Memories · Personalised 3D Pet Figurines, Made in India",
    template: "%s · Pawsome Memories",
  },
  description: SITE.description,
  keywords: [
    "custom pet figurine India",
    "personalised dog figurine",
    "custom cat miniature",
    "pet memorial gifts",
    "personalised pet gifts",
    "3D printed pet figurines",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
    title: "Pawsome Memories · Your pet is one of a kind",
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f8f3ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
