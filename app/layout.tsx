import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://insight.citiplug.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Insight by CitiPlug — News, Ideas & Stories That Matter",
    template: "%s — Insight by CitiPlug"
  },
  description:
    "Independent journalism, intelligent ideas, and original stories from trusted writers around the world. Read deeply, think freely, and contribute your voice.",
  openGraph: {
    type: "website",
    siteName: "Insight by CitiPlug",
    title: "Insight by CitiPlug — Ideas Worth Your Time",
    description: "Independent journalism and original stories from trusted writers around the world.",
    url: SITE_URL,
    images: [{ url: "/assets/editorial-hero.png" }]
  },
  twitter: {
    card: "summary_large_image"
  },
  robots: {
    index: true,
    follow: true
  },
  icons: {
    icon: "/assets/brand-mark.svg"
  },
  manifest: "/site.webmanifest"
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: "Insight by CitiPlug",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/brand-mark.svg`,
  sameAs: [],
  publishingPrinciples: `${SITE_URL}/standards`,
  ethicsPolicy: `${SITE_URL}/standards`,
  actionableFeedbackPolicy: `${SITE_URL}/contact`
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800;900&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600;6..72,700;6..72,800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
