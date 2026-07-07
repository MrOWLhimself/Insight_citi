import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import {
  getPostBySlug,
  getAllPublishedSlugs,
  getActiveAds,
  getCategoryMap,
  resolveCategoryName,
  resolveCoverImage
} from "@/lib/queries";
import { readTimeMinutes, formatDate, siteUrl } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";

export const revalidate = 300;

// Every published slug is pre-rendered at build time, and Next.js falls
// back to on-demand rendering (then caches it) for anything published
// afterward — so a brand-new post is indexable immediately, not just
// after the next full deploy.
export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Story not found",
      robots: { index: false, follow: true }
    };
  }

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || `Read ${post.title} on Insight by CitiPlug.`;
  const canonical = post.canonical_url || `/${post.slug}`;
  const image = resolveCoverImage(post) || "/assets/editorial-hero.png";

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
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined
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
  const [post, ads, categoryMap] = await Promise.all([getPostBySlug(slug), getActiveAds(), getCategoryMap()]);

  if (!post) notFound();

  const minutes = readTimeMinutes(post.content);
  const isRichHtml = /<[a-z][\s\S]*>/i.test(post.content);
  const paragraphs = isRichHtml ? [] : post.content.split(/\n{2,}/).filter(Boolean);
  const sanitizedBody = isRichHtml ? sanitizeArticleHtml(post.content) : "";
  const canonical = siteUrl(post.canonical_url || `/${post.slug}`);
  const coverImage = resolveCoverImage(post);
  const image = coverImage || siteUrl("/assets/editorial-hero.png");
  const categoryName = resolveCategoryName(post, categoryMap);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    headline: post.title,
    description: post.seo_description || post.excerpt || undefined,
    image: [image],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    articleSection: categoryName,
    author: { "@type": "Person", name: post.profiles?.full_name || "Insight Desk" },
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
        <article className="article-page">
          <header className="article-hero">
            <p className="article-category">{categoryName}</p>
            <h1>{post.title}</h1>
            <p className="article-excerpt">{post.excerpt}</p>
            <div className="article-byline">
              <span className="author-avatar">{(post.profiles?.full_name || "IN").slice(0, 2).toUpperCase()}</span>
              <div>
                <b>{post.profiles?.full_name || "Insight contributor"}</b>
                <span>
                  {formatDate(post.published_at)} · {minutes} min read
                </span>
              </div>
            </div>
          </header>

          {coverImage && (
            <figure className="article-cover">
              <Image src={coverImage} alt={post.title} width={1536} height={1024} priority />
              <figcaption>Insight / {categoryName}</figcaption>
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
              <AdSlot
                slotKey="article_sidebar_2"
                ads={ads}
                variant="rectangle"
                fallbackLabel="Automatic ad"
                fallbackHeadline="Programmatic-ready premium inventory."
              />
              <AdSlot
                slotKey="article_sidebar_3"
                ads={ads}
                variant="rectangle"
                fallbackHeadline="Reach readers who shape what happens next."
              />
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
