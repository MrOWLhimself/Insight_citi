import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";
import { readTimeMinutes } from "@/lib/format";

function byline(article: Article): string {
  const name = article.profiles?.full_name || "Insight contributor";
  const minutes = article.read_time || readTimeMinutes(article.body || "");
  return `${name} · ${minutes} min read`;
}

export function LeadArticleCard({ article }: { article: Article }) {
  return (
    <article className="lead-news-card">
      <Link className="lead-news-image" href={`/${article.slug}`}>
        {article.cover_image_url && (
          <Image src={article.cover_image_url} alt={article.title} width={1200} height={800} priority />
        )}
        <span>Insight exclusive</span>
      </Link>
      <p className="story-label">{article.categories?.name || "Insight"}</p>
      <h3>
        <Link href={`/${article.slug}`}>{article.title}</Link>
      </h3>
      <p>{article.excerpt}</p>
      <span className="news-byline">{byline(article)}</span>
    </article>
  );
}

export function TextArticleCard({ article }: { article: Article }) {
  return (
    <article className="news-card news-card-text">
      <p className="story-label">{article.categories?.name || "Insight"}</p>
      <h3>
        <Link href={`/${article.slug}`}>{article.title}</Link>
      </h3>
      <p>{article.excerpt}</p>
      <span className="news-byline">{byline(article)}</span>
    </article>
  );
}

export function CompactArticleCard({ article }: { article: Article }) {
  return (
    <article>
      <p className="story-label">{article.categories?.name || "Insight"}</p>
      <h4>
        <Link href={`/${article.slug}`}>{article.title}</Link>
      </h4>
    </article>
  );
}

export function OpinionArticleCard({ article }: { article: Article }) {
  return (
    <article>
      <p className="story-label">{article.categories?.name || "Opinion"}</p>
      <h4>
        <Link href={`/${article.slug}`}>{article.title}</Link>
      </h4>
      <span>{article.profiles?.full_name || "Insight contributor"}</span>
    </article>
  );
}

export function GridArticleCard({ article }: { article: Article }) {
  return (
    <article className="category-story-card">
      {article.cover_image_url && (
        <Link href={`/${article.slug}`} className="category-story-image">
          <Image src={article.cover_image_url} alt={article.title} width={600} height={400} />
        </Link>
      )}
      <span>{article.categories?.name || "Insight"}</span>
      <h3>
        <Link href={`/${article.slug}`}>{article.title}</Link>
      </h3>
      <p>{article.excerpt}</p>
    </article>
  );
}
