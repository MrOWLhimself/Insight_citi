/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://insight.citiplug.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/dashboard', '/settings', '/write', '/api'] },
    ],
  },
  exclude: ['/dashboard', '/settings', '/write/*', '/api/*'],
  changefreq: 'daily',
  priority: 0.7,
}
