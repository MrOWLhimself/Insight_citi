"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Article, AdSlot } from "@/lib/types";

export function AdminPanel() {
  const [session, setSession] = useState<any>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [connection, setConnection] = useState<{ text: string; state: string }>({ text: "", state: "" });
  const [hasAccess, setHasAccess] = useState(false);

  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | Article["status"]>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"stories" | "ads">("stories");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    const [{ data: articleRows }, { data: adRows }] = await Promise.all([
      supabaseBrowser.from("articles").select("*,profiles(full_name),categories(name,slug)").order("updated_at", { ascending: false }),
      supabaseBrowser.from("ad_slots").select("*").order("slot_key", { ascending: true })
    ]);
    setArticles((articleRows as unknown as Article[]) || []);
    setAds((adRows as AdSlot[]) || []);
  }, []);

  const openAdmin = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const activeSession = data.session;
    setSession(activeSession);
    if (!activeSession) return;

    const { data: profile } = await supabaseBrowser
      .from("profiles")
      .select("role")
      .eq("id", activeSession.user.id)
      .maybeSingle();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
      setConnection({ text: "Access required", state: "error" });
      setAuthMessage("This account does not have newsroom access. Ask an admin to promote it, or sign in with a different account.");
      setAuthError(true);
      setHasAccess(false);
      return;
    }

    setHasAccess(true);
    setAuthMessage("");
    setAuthError(false);
    setConnection({ text: "Connected", state: "connected" });
    await loadData();
  }, [loadData]);

  useEffect(() => {
    openAdmin();
  }, [openAdmin]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthPending(true);
    setAuthError(false);
    setAuthMessage("Signing in…");
    const data = new FormData(event.currentTarget);
    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email: String(data.get("email")).trim(),
      password: String(data.get("password"))
    });
    setAuthPending(false);
    if (error) {
      setAuthError(true);
      setAuthMessage(error.message.toLowerCase().includes("invalid") ? "Incorrect email or password." : error.message);
    } else {
      await openAdmin();
    }
  };

  const updateArticle = async (id: string, changes: Partial<Article>) => {
    setMessage("Updating story…");
    const { error } = await supabaseBrowser.from("articles").update(changes).eq("id", id);
    setMessage(error ? error.message : "Story updated.");
    await loadData();
  };

  const signOut = async () => {
    await supabaseBrowser.auth.signOut();
    setSession(null);
    setHasAccess(false);
    setAuthMessage("");
    setAuthError(false);
  };

  if (!session) {
    return (
      <main className="admin-shell">
        <div className="admin-login">
          <p className="eyebrow">Insight newsroom</p>
          <h1>Editor &amp; admin access</h1>
          <form onSubmit={handleSignIn}>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <div className="password-field">
                <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <button type="submit" disabled={authPending}>
              {authPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <span role="status" className={authError ? "form-message is-error" : "form-message"}>
            {authMessage}
          </span>
        </div>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="admin-shell">
        <div className="admin-login">
          <p className="eyebrow">Insight newsroom</p>
          <h1>Access required</h1>
          <p className="section-intro">{authMessage}</p>
          <p className="section-intro">Signed in as {session.user.email}.</p>
          <button type="button" onClick={signOut}>
            Sign in with a different account
          </button>
        </div>
      </main>
    );
  }

  const visibleArticles = articles.filter(
    (article) =>
      (statusFilter === "all" || article.status === statusFilter) &&
      article.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-shell" data-admin-workspace>
      <header className="admin-header">
        <div>
          <p className="eyebrow">Newsroom admin</p>
          <h1>Insight editorial control</h1>
        </div>
        <div>
          <span className={`connection-state ${connection.state}`}>{connection.text}</span>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-stats">
        <div>
          <b>{articles.length}</b>
          <span>Total stories</span>
        </div>
        <div>
          <b>{articles.filter((a) => a.status === "review").length}</b>
          <span>Awaiting review</span>
        </div>
        <div>
          <b>{articles.filter((a) => a.status === "published").length}</b>
          <span>Published</span>
        </div>
        <div>
          <b>{new Set(articles.map((a) => a.author_id)).size}</b>
          <span>Contributors</span>
        </div>
      </div>

      <nav className="admin-view-tabs">
        <button type="button" className={view === "stories" ? "active" : ""} onClick={() => setView("stories")}>
          Stories
        </button>
        <button type="button" className={view === "ads" ? "active" : ""} onClick={() => setView("ads")}>
          Ad campaigns
        </button>
        <button type="button" onClick={loadData}>
          Refresh
        </button>
      </nav>

      {view === "stories" ? (
        <section>
          <div className="admin-filters">
            <input
              placeholder="Search stories…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {(["all", "draft", "review", "published", "rejected", "archived"] as const).map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? "active" : ""}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="admin-story-list">
            {visibleArticles.map((article) => (
              <article className="admin-story-card" key={article.id}>
                <div>
                  <p className="kicker">{article.categories?.name || "Uncategorised"}</p>
                  <h3>{article.title}</h3>
                  <p className="meta">
                    {article.profiles?.full_name || "Contributor"} · Updated {formatDate(article.updated_at)}
                  </p>
                </div>
                <span className={`status-pill status-${article.status}`}>{article.status}</span>
                <div className="admin-actions">
                  {article.status !== "published" && (
                    <button
                      type="button"
                      onClick={() =>
                        updateArticle(article.id, { status: "published", published_at: new Date().toISOString() })
                      }
                    >
                      Publish
                    </button>
                  )}
                  {article.status !== "review" && (
                    <button type="button" onClick={() => updateArticle(article.id, { status: "review" })}>
                      Review
                    </button>
                  )}
                  {article.status !== "rejected" && (
                    <button type="button" onClick={() => updateArticle(article.id, { status: "rejected" })}>
                      Reject
                    </button>
                  )}
                  <button type="button" onClick={() => updateArticle(article.id, { featured: !article.featured })}>
                    {article.featured ? "Unfeature" : "Feature"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <span role="status">{message}</span>
        </section>
      ) : (
        <section className="admin-ad-list">
          {ads.map((ad) => (
            <article className={`ad-admin-card ${ad.active ? "" : "inactive"}`} key={ad.id}>
              <div>
                <small>
                  {ad.active ? "Active" : "Inactive"} · {ad.ad_mode} · {ad.slot_key}
                </small>
                <h3>{ad.headline || ad.label || "House advertisement"}</h3>
                <p>{ad.sponsor_name || "Insight Ads"}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
