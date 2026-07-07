import Link from "next/link";
import Image from "next/image";
import type { Post, Category } from "@/lib/types";
import { readTimeMinutes } from "@/lib/format";
import { resolveCategoryName, resolveCoverImage } from "@/lib/queries";

function byline(post: Post): string {
  const name = post.profiles?.full_name || "Insight contributor";
  const minutes = readTimeMinutes(post.content || "");
  return `${name} · ${minutes} min read`;
}

export function LeadArticleCard({ post, categoryMap }: { post: Post; categoryMap: Map<string, Category> }) {
  const image = resolveCoverImage(post);
  return (
    <article className="lead-news-card">
      <Link className="lead-news-image" href={`/${post.slug}`}>
        {image && <Image src={image} alt={post.title} width={1200} height={800} priority />}
        <span>Insight exclusive</span>
      </Link>
      <p className="story-label">{resolveCategoryName(post, categoryMap)}</p>
      <h3>
        <Link href={`/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.excerpt}</p>
      <span className="news-byline">{byline(post)}</span>
    </article>
  );
}

export function TextArticleCard({ post, categoryMap }: { post: Post; categoryMap: Map<string, Category> }) {
  return (
    <article className="news-card news-card-text">
      <p className="story-label">{resolveCategoryName(post, categoryMap)}</p>
      <h3>
        <Link href={`/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.excerpt}</p>
      <span className="news-byline">{byline(post)}</span>
    </article>
  );
}

export function CompactArticleCard({ post, categoryMap }: { post: Post; categoryMap: Map<string, Category> }) {
  return (
    <article>
      <p className="story-label">{resolveCategoryName(post, categoryMap)}</p>
      <h4>
        <Link href={`/${post.slug}`}>{post.title}</Link>
      </h4>
    </article>
  );
}

export function OpinionArticleCard({ post, categoryMap }: { post: Post; categoryMap: Map<string, Category> }) {
  return (
    <article>
      <p className="story-label">{resolveCategoryName(post, categoryMap)}</p>
      <h4>
        <Link href={`/${post.slug}`}>{post.title}</Link>
      </h4>
      <span>{post.profiles?.full_name || "Insight contributor"}</span>
    </article>
  );
}

export function GridArticleCard({ post, categoryMap }: { post: Post; categoryMap: Map<string, Category> }) {
  const image = resolveCoverImage(post);
  return (
    <article className="category-story-card">
      {image && (
        <Link href={`/${post.slug}`} className="category-story-image">
          <Image src={image} alt={post.title} width={600} height={400} />
        </Link>
      )}
      <span>{resolveCategoryName(post, categoryMap)}</span>
      <h3>
        <Link href={`/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.excerpt}</p>
    </article>
  );
}
