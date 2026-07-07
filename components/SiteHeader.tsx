"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/#top-stories", label: "Front page" },
  { href: "/topics/news", label: "News" },
  { href: "/topics/technology", label: "Technology" },
  { href: "/topics/culture", label: "Culture" },
  { href: "/topics/business", label: "Business" },
  { href: "/topics/science", label: "Science" },
  { href: "/topics/world", label: "World" },
  { href: "/topics/ideas", label: "Ideas" }
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="edition-bar">
        <p>
          <span className="live-dot" aria-hidden="true"></span> Live edition{" "}
          <b>
            {new Intl.DateTimeFormat("en", { month: "long", day: "2-digit", year: "numeric" }).format(new Date())}
          </b>
        </p>
        <p className="edition-note">Independent journalism for an intelligent world</p>
        <div className="utility-links">
          <Link href="/#newsletter">Newsletters</Link>
          <Link href="/#membership">Membership</Link>
        </div>
      </div>

      <div className="masthead">
        <button
          className="icon-button menu-button"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span></span>
          <span></span>
        </button>
        <div className="masthead-edition">
          No. 042
          <br />
          <span>Global edition</span>
        </div>
        <Link className="brand" href="/" aria-label="Insight home">
          <span className="brand-word">Insight</span>
          <span className="brand-dot">C</span>
        </Link>
        <div className="header-actions">
          <Link className="text-button sign-in-button" href="/dashboard">
            Sign in
          </Link>
          <Link className="button button-signal join-button" href="/dashboard">
            Subscribe
          </Link>
        </div>
      </div>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link className="write-link" href="/dashboard">
          Writer dashboard <span>↗</span>
        </Link>
      </nav>

      <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation" hidden={!menuOpen}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
          Writer dashboard ↗
        </Link>
      </nav>
    </header>
  );
}
