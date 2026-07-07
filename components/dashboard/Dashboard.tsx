"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { slugify, formatDate } from "@/lib/format";
import { CoverImageUploader } from "@/components/dashboard/CoverImageUploader";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import type { Article, Category, ArticleTemplate } from "@/lib/types";

type ViewName = "stories" | "editor";

const EMPTY_FORM = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image_url: "",
  category_id: "",
  template: "classic" as ArticleTemplate
};

export function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [connection, setConnection] = useState<{ text: string; state: string }>({ text: "", state: "" });

  const [profileName, setProfileName] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<ViewName>("stories");
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editorMessage, setEditorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadWorkspace = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const activeSession = data.session;
    setSession(activeSession);
    if (!activeSession) return;

    try {
      const [{ data: profile }, { data: categoryRows }, { data: articleRows, error }] = await Promise.all([
        supabaseBrowser.from("profiles").select("*").eq("id", activeSession.user.id).maybeSingle(),
        supabaseBrowser.from("categories").select("*").order("name", { ascending: true }),
        supabaseBrowser
          .from("articles")
          .select("*,categories(name,slug)")
          .eq("author_id", activeSession.user.id)
          .order("updated_at", { ascending: false })
      ]);
      if (error) throw error;
      setProfileName(profile?.full_name || activeSession.user.email?.split("@")[0] || "Your desk");
      setCategories(categoryRows || []);
      setArticles((articleRows as unknown as Article[]) || []);
      setConnection({ text: "Connected", state: "connected" });
    } catch (error: any) {
      setConnection({ text: "Setup required", state: "error" });
      setAuthMessage(error.message);
      setAuthError(true);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(() => loadWorkspace());
    return () => listener.subscription.unsubscribe();
  }, [loadWorkspace]);

  const switchAuthTab = (tab: "signin" | "signup") => {
    setAuthTab(tab);
    setAuthMessage("");
    setAuthError(false);
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthPending(true);
    setAuthError(false);
    setAuthMessage("Signing you in…");
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
      setAuthMessage("");
    }
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthPending(true);
    setAuthError(false);
    setAuthMessage("Creating your account…");
    const data = new FormData(event.currentTarget);
    const { data: result, error } = await supabaseBrowser.auth.signUp({
      email: String(data.get("email")).trim(),
      password: String(data.get("password")),
      options: { data: { full_name: String(data.get("full_name")).trim() } }
    });
    setAuthPending(false);
    if (error) {
      setAuthError(true);
      setAuthMessage(error.message);
    } else if (result.session) {
      setAuthMessage("");
      await loadWorkspace();
    } else {
      setAuthError(false);
      setAuthMessage("Account created. Check your email to confirm, then sign in.");
    }
  };

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut();
    setSession(null);
    setArticles([]);
  };

  const openEditor = (article: Article | null = null) => {
    setForm(
      article
        ? {
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || "",
            body: article.body,
            cover_image_url: article.cover_image_url || "",
            category_id: article.category_id || "",
            template: article.template
          }
        : EMPTY_FORM
    );
    setSlugTouched(Boolean(article));
    setEditorMessage("");
    setView("editor");
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({ ...prev, title: value, slug: slugTouched ? prev.slug : slugify(value) }));
  };

  const saveArticle = async (status: "draft" | "review") => {
    if (!session) return;
    setSaving(true);
    setEditorMessage(status === "review" ? "Submitting to the newsroom…" : "Saving draft…");
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      body: form.body,
      cover_image_url: form.cover_image_url || null,
      category_id: form.category_id || null,
      template: form.template,
      status,
      author_id: session.user.id
    };

    const query = form.id
      ? supabaseBrowser.from("articles").update(payload).eq("id", form.id)
      : supabaseBrowser.from("articles").insert(payload);

    const { error } = await query;
    setSaving(false);
    if (error) {
      setEditorMessage(error.message);
      return;
    }
    setEditorMessage(status === "review" ? "Submitted for editorial review." : "Draft saved.");
    await loadWorkspace();
    setView("stories");
  };

  const deleteArticle = async (article: Article) => {
    if (article.status !== "draft") {
      setAuthMessage("Only draft articles can be deleted.");
      return;
    }
    if (!window.confirm(`Delete "${article.title || "this draft"}"? This can't be undone.`)) return;
    await supabaseBrowser.from("articles").delete().eq("id", article.id);
    await loadWorkspace();
  };

  if (!session) {
    return (
      <main className="dashboard-shell" data-auth-screen>
        <div className="auth-panel">
          <p className="eyebrow">Insight writer access</p>
          <h1>Write, edit and publish for Insight.</h1>
          <div className="auth-tabs">
            <button type="button" className={authTab === "signin" ? "active" : ""} onClick={() => switchAuthTab("signin")}>
              Sign in
            </button>
            <button type="button" className={authTab === "signup" ? "active" : ""} onClick={() => switchAuthTab("signup")}>
              Create account
            </button>
          </div>

          {authTab === "signin" ? (
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
          ) : (
            <form onSubmit={handleSignUp}>
              <label>
                Full name
                <input name="full_name" type="text" autoComplete="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Password
                <div className="password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <small>At least 6 characters.</small>
              </label>
              <button type="submit" disabled={authPending}>
                {authPending ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
          <span role="status" className={authError ? "form-message is-error" : "form-message"}>
            {authMessage}
          </span>
          <Link href="/">← Back to Insight</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell" data-workspace>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Writer dashboard</p>
          <h1>{profileName}</h1>
          <span>{session.user.email}</span>
        </div>
        <div className="dashboard-header-actions">
          <span className={`connection-state ${connection.state}`}>{connection.text}</span>
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button type="button" className={view === "stories" ? "active" : ""} onClick={() => setView("stories")}>
          My stories
        </button>
        <button type="button" className={view === "editor" ? "active" : ""} onClick={() => openEditor()}>
          New story
        </button>
      </nav>

      {view === "stories" ? (
        <section>
          <div className="dashboard-stats">
            <div>
              <b>{articles.length}</b>
              <span>Total</span>
            </div>
            <div>
              <b>{articles.filter((a) => a.status === "draft").length}</b>
              <span>Drafts</span>
            </div>
            <div>
              <b>{articles.filter((a) => a.status === "review").length}</b>
              <span>In review</span>
            </div>
            <div>
              <b>{articles.filter((a) => a.status === "published").length}</b>
              <span>Published</span>
            </div>
          </div>

          {articles.length === 0 ? (
            <div className="empty-state">
              <p>No stories yet. Your first draft starts here.</p>
              <button type="button" onClick={() => openEditor()}>
                Write your first story
              </button>
            </div>
          ) : (
            <div className="story-grid">
              {articles.map((article) => (
                <article className="story-card" key={article.id}>
                  {article.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="story-card-thumb" src={article.cover_image_url} alt="" />
                  )}
                  <div className="story-card-top">
                    <span className={`status-pill status-${article.status}`}>{article.status}</span>
                    <small>{article.template} template</small>
                  </div>
                  <h3>{article.title || "Untitled draft"}</h3>
                  <p>{article.excerpt || "No standfirst yet. Add a sharp summary before submitting."}</p>
                  <div className="story-card-meta">
                    <span>{article.categories?.name || "Uncategorised"}</span>
                    <span>Edited {formatDate(article.updated_at)}</span>
                  </div>
                  <div className="table-actions">
                    <a href={`/${article.slug}`} target="_blank" rel="noopener noreferrer">
                      Preview
                    </a>
                    <button type="button" onClick={() => openEditor(article)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteArticle(article)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <span role="status">{authMessage}</span>
        </section>
      ) : (
        <section className="story-editor">
          <button type="button" onClick={() => setView("stories")}>
            ← Back to stories
          </button>
          <h2>{form.id ? "Edit story" : "New story"}</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
              saveArticle(submitter?.value === "review" ? "review" : "draft");
            }}
          >
            <label>
              Title
              <input value={form.title} onChange={(event) => handleTitleChange(event.target.value)} required />
            </label>
            <label>
              Slug
              <input
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: event.target.value }));
                }}
                required
              />
            </label>
            <label>
              Standfirst / excerpt
              <textarea
                value={form.excerpt}
                onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
              />
            </label>
            <label>
              Cover image
              <CoverImageUploader
                value={form.cover_image_url}
                onChange={(url) => setForm((prev) => ({ ...prev, cover_image_url: url }))}
              />
            </label>
            <label>
              Category
              <select
                value={form.category_id}
                onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Template
              <select
                value={form.template}
                onChange={(event) => setForm((prev) => ({ ...prev, template: event.target.value as ArticleTemplate }))}
              >
                <option value="classic">Classic</option>
                <option value="cover">Cover</option>
                <option value="split">Split</option>
                <option value="analysis">Analysis</option>
                <option value="essay">Essay</option>
                <option value="visual">Visual</option>
              </select>
            </label>
            <label>
              Body
              <RichTextEditor value={form.body} onChange={(html) => setForm((prev) => ({ ...prev, body: html }))} />
            </label>
            <div className="editor-actions">
              <button type="submit" value="draft" disabled={saving}>
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button type="submit" value="review" className="button-accent" disabled={saving}>
                {saving ? "Submitting…" : "Submit for review"}
              </button>
            </div>
            <span role="status">{editorMessage}</span>
          </form>
        </section>
      )}
    </main>
  );
}
