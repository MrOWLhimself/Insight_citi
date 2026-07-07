import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-brand">
        <Link className="brand" href="/">
          <span className="brand-mark">I</span>
          <span>Insight</span>
        </Link>
        <p>
          Stories for people who
          <br />
          still believe in ideas.
        </p>
      </div>
      <div className="footer-links">
        <div>
          <h3>Explore</h3>
          <Link href="/#latest">Latest</Link>
          <Link href="/#top-stories">Top stories</Link>
          <Link href="/topics/news">Categories</Link>
          <Link href="/#newsletter">Newsletters</Link>
        </div>
        <div>
          <h3>Community</h3>
          <Link href="/dashboard">Write for us</Link>
          <Link href="/#membership">Membership</Link>
          <Link href="/guidelines">Guidelines</Link>
          <Link href="/events">Events</Link>
        </div>
        <div>
          <h3>Company</h3>
          <Link href="/about">About</Link>
          <Link href="/standards">Editorial standards</Link>
          <Link href="/advertise">Advertise</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Insight by CitiPlug</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/accessibility">Accessibility</Link>
        </div>
        <div>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer">
            X
          </a>
        </div>
      </div>
    </footer>
  );
}
