const SITE_URL = 'https://insight.citiplug.com'

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/settings', '/write', '/api/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
