import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSlot } from "@/components/AdSlot";
import { GridArticleCard } from "@/components/ArticleCard";
import {
  getPostsByCategorySlug,
  getCategoryBySlug,
  getAllCategories,
  getActiveAds,
  getCategoryMap
} from "@/lib/queries";
import { siteUrl } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    return { title: "Category not found", robots: { index: false, follow: true } };
  }

  const description = category.description || `Explore ${category.name} stories on Insight.`;
  const canonical = `/topics/${category.slug}`;

  return {
    title: category.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${category.name} — Insight by CitiPlug`,
      description,
      url: siteUrl(canonical)
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = await params;
  const [category, posts, allCategories, ads, categoryMap] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getPostsByCategorySlug(categorySlug),
    getAllCategories(),
    getActiveAds(),
    getCategoryMap()
  ]);

  if (!category) notFound();

  const description = category.description || `Explore ${category.name} stories on Insight.`;
  const [lead, ...gridPosts] = posts;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} — Insight by CitiPlug`,
    description,
    url: siteUrl(`/topics/${category.slug}`),
    hasPart: posts.slice(0, 12).map((post) => ({
      "@type": "NewsArticle",
      headline: post.title,
      url: siteUrl(`/${post.slug}`)
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main>
        <section className="category-hero">
          <p className="eyebrow">Explore category</p>
          <h1>{category.name}</h1>
          <p>{description}</p>
          <div className="category-actions">
            <Link href="/dashboard">Contribute story ↗</Link>
          </div>
        </section>

        <AdSlot
          slotKey="category_top"
          ads={ads}
          variant="rectangle"
          fallbackLabel="Automatic ad"
          fallbackHeadline="Category sponsorship inventory."
        />

        <section className="category-layout">
          <aside className="category-list" aria-label="All categories">
            {allCategories.map((item) => (
              <Link key={item.id} href={`/topics/${item.slug}`} className={item.slug === category.slug ? "active" : ""}>
                <span>{item.name}</span>
                <b>↗</b>
              </Link>
            ))}
          </aside>

          <section className="category-feed">
            {lead ? (
              <article className="category-lead">
                <span>Featured</span>
                <h2>
                  <Link href={`/${lead.slug}`}>{lead.title}</Link>
                </h2>
                <p>{lead.excerpt}</p>
              </article>
            ) : (
              <article className="category-lead">
                <span>Coming soon</span>
                <h2>No published stories in {category.name} yet</h2>
                <p>Check back soon, or be the first contributor to write for this category.</p>
              </article>
            )}

            <div className="category-story-grid">
              {gridPosts.map((post) => (
                <GridArticleCard key={post.id} post={post} categoryMap={categoryMap} />
              ))}
            </div>

            <AdSlot
              slotKey="category_mid"
              ads={ads}
              variant="rectangle"
              fallbackHeadline="Own this category placement."
            />
          </section>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
