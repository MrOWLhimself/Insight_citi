import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { getArticleBySlug, getAllPublishedSlugs, getActiveAds } from "@/lib/queries";
import { readTimeMinutes, formatDate, siteUrl } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";

export const revalidate = 300;

// Every published slug is pre-rendered at build time, and Next.js falls
// back to on-demand rendering (then caches it) for anything published
// afterward — so a brand-new article is indexable immediately, not just
// after the next full deploy.
export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Story not found",
      robots: { index: false, follow: true }
    };
  }

  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || `Read ${article.title} on Insight by CitiPlug.`;
  const canonical = `/${article.slug}`;
  const image = article.cover_image_url || "/assets/editorial-hero.png";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: siteUrl(canonical),
      images: [{ url: image }],
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? undefined,
      section: article.categories?.name ?? undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, ads] = await Promise.all([getArticleBySlug(slug), getActiveAds()]);

  if (!article) notFound();

  const minutes = article.read_time || readTimeMinutes(article.body);
  const isRichHtml = /<[a-z][\s\S]*>/i.test(article.body);
  const paragraphs = isRichHtml ? [] : article.body.split(/\n{2,}/).filter(Boolean);
  const sanitizedBody = isRichHtml ? sanitizeArticleHtml(article.body) : "";
  const canonical = siteUrl(`/${article.slug}`);
  const image = article.cover_image_url || siteUrl("/assets/editorial-hero.png");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    headline: article.title,
    description: article.seo_description || article.excerpt || undefined,
    image: [image],
    datePublished: article.published_at,
    dateModified: article.updated_at,
    articleSection: article.categories?.name || "Insight",
    author: { "@type": "Person", name: article.profiles?.full_name || "Insight Desk" },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "Insight by CitiPlug",
      logo: { "@type": "ImageObject", url: siteUrl("/assets/brand-mark.svg") }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="article-header">
        <Link className="article-brand" href="/">
          Insight<sup>C</sup>
        </Link>
        <nav>
          <Link href="/#top-stories">Top stories</Link>
          <Link href="/dashboard">Write</Link>
          <Link href="/#membership">Subscribe</Link>
        </nav>
      </header>

      <AdSlot slotKey="article_top" ads={ads} variant="rectangle" fallbackHeadline="Intelligent brands meet intelligent readers." />

      <main>
        <article className="article-page" data-template={article.template}>
          <header className="article-hero">
            <p className="article-category">{article.categories?.name || "Insight"}</p>
            <h1>{article.title}</h1>
            <p className="article-excerpt">{article.excerpt}</p>
            <div className="article-byline">
              <span className="author-avatar">{(article.profiles?.full_name || "IN").slice(0, 2).toUpperCase()}</span>
              <div>
                <b>{article.profiles?.full_name || "Insight contributor"}</b>
                <span>
                  {formatDate(article.published_at)} · {minutes} min read
                </span>
              </div>
            </div>
          </header>

          {article.cover_image_url && (
            <figure className="article-cover">
              <Image src={article.cover_image_url} alt={article.title} width={1536} height={1024} priority />
              <figcaption>
                Insight / {article.categories?.name || "Feature"}
              </figcaption>
            </figure>
          )}

          <div className="article-layout">
            <aside className="share-rail">
              <span>Share</span>
              <button aria-label="Copy article link" type="button">
                ↗
              </button>
              <button aria-label="Save article" type="button">
                ◇
              </button>
            </aside>

            <div className="article-body">
              {isRichHtml ? (
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                />
              ) : (
                paragraphs.map((paragraph, index) => (
                  <p key={index} className={index === 0 ? "dropcap" : undefined}>
                    {paragraph.trim()}
                  </p>
                ))
              )}
            </div>

            <aside className="article-sidebar">
              <AdSlot slotKey="article_sidebar" ads={ads} variant="rectangle" fallbackHeadline="Place your story here." />
              <div className="related">
                <span>Read next</span>
                <Link href="/topics/news">More from Insight</Link>
              </div>
            </aside>
          </div>
        </article>
      </main>
      <footer>
        © {new Date().getFullYear()} Insight by CitiPlug <Link href="/">Back to front page ↗</Link>
      </footer>
    </>
  );
}
