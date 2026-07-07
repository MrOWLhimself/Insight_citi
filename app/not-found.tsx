import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found-section">
        <p className="eyebrow">404</p>
        <h1>This story isn&rsquo;t here.</h1>
        <p>The page you&rsquo;re looking for may have been moved, unpublished, or never existed.</p>
        <Link className="button button-ink" href="/">
          Back to the front page ↗
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
