// @ts-nocheck
import './globals.css'

const SITE_URL = 'https://insight.citiplug.com'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Insight — Read. Think. Be informed.', template: '%s — Insight' },
  description: 'Insight is an open publishing platform for African stories, news, opinion and culture. Write and read stories that matter — free, always.',
  keywords: ['Nigerian writers', 'African stories', 'news Nigeria', 'lifestyle Africa', 'Insight'],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: SITE_URL,
    siteName: 'Insight',
    title: 'Insight — Read. Think. Be informed.',
    description: 'An open publishing platform for African stories, news, opinion and culture.',
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Insight' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insight — Read. Think. Be informed.',
    description: 'An open publishing platform for African stories, news, opinion and culture.',
    images: [`${SITE_URL}/og-default.jpg`],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/feather.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
