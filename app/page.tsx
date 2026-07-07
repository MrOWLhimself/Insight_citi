import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSlot } from "@/components/AdSlot";
import {
  LeadArticleCard,
  TextArticleCard,
  CompactArticleCard,
  OpinionArticleCard,
  GridArticleCard
} from "@/components/ArticleCard";
import { getPublishedArticles, getFeaturedArticles, getActiveAds, getAllCategories } from "@/lib/queries";
import { NewsletterForm } from "@/components/NewsletterForm";

export const revalidate = 300; // refresh homepage content every 5 minutes

export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

export default async function HomePage() {
  const [articles, featured, ads, categories] = await Promise.all([
    getPublishedArticles(16),
    getFeaturedArticles(4),
    getActiveAds(),
    getAllCategories()
  ]);

  const [hero, ...rest] = articles;
  const [secondary1, secondary2, secondary3, secondary4, ...more] = rest;
  const opinionPicks = more.slice(0, 3);
  const morePosts = more.slice(3, 9);
  const featuredPicks = featured.length ? featured : rest.slice(9, 13);

  return (
    <>
      <SiteHeader />
      <main id="main">
        {hero && (
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span>Cover story</span>
                <span>{hero.categories?.name || "Insight"}</span>
              </div>
              <h1 id="hero-title">{hero.title}</h1>
              <p className="hero-deck">{hero.excerpt}</p>
              <div className="hero-actions">
                <Link className="button button-ink" href={`/${hero.slug}`}>
                  Read cover story <span>↗</span>
                </Link>
                <div className="story-meta hero-meta">
                  <div className="avatar avatar-light">
                    {(hero.profiles?.full_name || "IN").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{hero.profiles?.full_name || "Insight desk"}</strong>
                    <span>{hero.read_time || 6} min read</span>
                  </div>
                </div>
              </div>
            </div>
            {hero.cover_image_url && (
              <div className="hero-visual">
                <Image src={hero.cover_image_url} alt={hero.title} width={1536} height={1024} priority />
                <span className="hero-caption">{hero.categories?.name || "Insight"}</span>
                <Link className="hero-orbit" href={`/${hero.slug}`} aria-label="Read the cover story">
                  <span>Read</span>
                  <span>the issue</span>
                  <b>↗</b>
                </Link>
              </div>
            )}
          </section>
        )}

        <AdSlot slotKey="home_leaderboard_1" ads={ads} variant="leaderboard" />
        <AdSlot
          slotKey="home_auto_top"
          ads={ads}
          variant="leaderboard"
          fallbackLabel="Automatic ad"
          fallbackHeadline="Programmatic-ready premium inventory."
        />

        <section id="top-stories" className="section newsroom-section">
          <div className="newsroom-heading">
            <div>
              <p className="eyebrow">The Insight desk</p>
              <h2>Top stories</h2>
            </div>
            <p>Reporting, analysis and ideas selected by our newsroom.</p>
            <Link href="/#latest">All stories ↗</Link>
          </div>

          <div className="newsroom-grid">
            <div className="news-column news-column-left">
              {secondary1 && <TextArticleCard article={secondary1} />}
              {secondary2 && <TextArticleCard article={secondary2} />}
            </div>

            <div className="news-column news-column-lead">
              {secondary3 && <LeadArticleCard article={secondary3} />}
              <div className="lead-news-subgrid">
                {secondary4 && <CompactArticleCard article={secondary4} />}
              </div>
            </div>

            <aside className="news-column news-column-opinion">
              <div className="opinion-banner">
                <span>INSIGHT</span>
                <strong>POINT OF VIEW</strong>
                <small>Argument · Context · Clarity</small>
              </div>
              <h3 className="opinion-title">Opinion</h3>
              {opinionPicks.map((article) => (
                <OpinionArticleCard key={article.id} article={article} />
              ))}
              <AdSlot slotKey="home_top_right" ads={ads} variant="rectangle" fallbackHeadline="Your brand, in good company." />
            </aside>
          </div>
        </section>

        <AdSlot
          slotKey="home_billboard_1"
          ads={ads}
          variant="billboard"
          fallbackHeadline="Ideas move people. Put your brand beside the right ones."
        />

        {featuredPicks.length > 0 && (
          <section id="featured" className="section premium-featured-section">
            <div className="premium-section-heading">
              <p className="eyebrow">Exclusive &amp; featured</p>
            </div>
            <div className="premium-feature-grid">
              {featuredPicks.map((article) => (
                <GridArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {morePosts.length > 0 && (
          <section id="more-posts" className="section post-river-section">
            <div className="premium-section-heading compact">
              <p className="eyebrow">More from Insight</p>
            </div>
            <div className="post-river-grid">
              {morePosts.map((article) => (
                <CompactArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        <AdSlot
          slotKey="home_auto_mid"
          ads={ads}
          variant="billboard"
          fallbackLabel="Automatic ad"
          fallbackHeadline="Auto-filled sponsor space for high-traffic sections."
        />

        <section id="categories" className="section category-showcase-section">
          <div className="premium-section-heading">
            <p className="eyebrow">Explore selected categories</p>
          </div>
          <div className="category-showcase-grid compact-category-grid">
            {categories.slice(0, 9).map((category) => (
              <Link key={category.id} href={`/topics/${category.slug}`}>
                <b>{category.name}</b>
              </Link>
            ))}
          </div>
        </section>

        <section id="newsletter" className="newsletter">
          <div>
            <p className="eyebrow">The daily insight</p>
            <h2>
              One thoughtful story,
              <br />
              every morning.
            </h2>
          </div>
          <NewsletterForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
