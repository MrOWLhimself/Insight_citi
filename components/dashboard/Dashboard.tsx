"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { slugify, formatDate, readTimeMinutes } from "@/lib/format";
import { CoverImageUploader } from "@/components/dashboard/CoverImageUploader";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import type { Post, Category } from "@/lib/types";

type ViewName = "stories" | "editor";

const EMPTY_FORM = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  category: "",
  seo_title: "",
  seo_description: ""
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<ViewName>("stories");
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editorMessage, setEditorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryName = (categoryId: string | null) =>
    categories.find((category) => category.id === categoryId)?.name || "Uncategorised";

  const loadWorkspace = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const activeSession = data.session;
    setSession(activeSession);
    if (!activeSession) return;

    try {
      const [{ data: profile }, { data: categoryRows }, { data: postRows, error }] = await Promise.all([
        supabaseBrowser.from("profiles").select("*").eq("id", activeSession.user.id).maybeSingle(),
        supabaseBrowser.from("insight_categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabaseBrowser
          .from("insight_posts")
          .select("*")
          .eq("author_id", activeSession.user.id)
          .order("updated_at", { ascending: false })
      ]);
      if (error) throw error;
      setProfileName(profile?.full_name || activeSession.user.email?.split("@")[0] || "Your desk");
      setCategories(categoryRows || []);
      setPosts((postRows as unknown as Post[]) || []);
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
    setPosts([]);
  };

  const openEditor = (post: Post | null = null) => {
    setForm(
      post
        ? {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || "",
            content: post.content || "",
            cover_image_url: post.cover_image_url || post.cover_image || "",
            category: post.category || "",
            seo_title: post.seo_title || "",
            seo_description: post.seo_description || ""
          }
        : EMPTY_FORM
    );
    setSlugTouched(Boolean(post));
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
      content: form.content,
      cover_image_url: form.cover_image_url || null,
      category: form.category || null,
      status,
      visibility: "public",
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      author_id: session.user.id
    };

    const query = form.id
      ? supabaseBrowser.from("insight_posts").update(payload).eq("id", form.id)
      : supabaseBrowser.from("insight_posts").insert(payload);

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

  const deletePost = async (post: Post) => {
    if (post.status !== "draft") {
      setAuthMessage("Only draft stories can be deleted.");
      return;
    }
    if (!window.confirm(`Delete "${post.title || "this draft"}"? This can't be undone.`)) return;
    await supabaseBrowser.from("insight_posts").delete().eq("id", post.id);
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
              <b>{posts.length}</b>
              <span>Total</span>
            </div>
            <div>
              <b>{posts.filter((p) => p.status === "draft").length}</b>
              <span>Drafts</span>
            </div>
            <div>
              <b>{posts.filter((p) => p.status === "review").length}</b>
              <span>In review</span>
            </div>
            <div>
              <b>{posts.filter((p) => p.status === "published").length}</b>
              <span>Published</span>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">
              <p>No stories yet. Your first draft starts here.</p>
              <button type="button" onClick={() => openEditor()}>
                Write your first story
              </button>
            </div>
          ) : (
            <div className="story-grid">
              {posts.map((post) => {
                const cover = post.cover_image_url || post.cover_image;
                return (
                  <article className="story-card" key={post.id}>
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="story-card-thumb" src={cover} alt="" />
                    )}
                    <div className="story-card-top">
                      <span className={`status-pill status-${post.status}`}>{post.status}</span>
                      <small>{readTimeMinutes(post.content)} min read</small>
                    </div>
                    <h3>{post.title || "Untitled draft"}</h3>
                    <p>{post.excerpt || "No standfirst yet. Add a sharp summary before submitting."}</p>
                    <div className="story-card-meta">
                      <span>{categoryName(post.category)}</span>
                      <span>Edited {formatDate(post.updated_at)}</span>
                    </div>
                    <div className="table-actions">
                      <a href={`/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        Preview
                      </a>
                      <button type="button" onClick={() => openEditor(post)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => deletePost(post)}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
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
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
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
              Body
              <RichTextEditor value={form.content} onChange={(html) => setForm((prev) => ({ ...prev, content: html }))} />
            </label>

            <div className="seo-panel">
              <p className="seo-panel-title">SEO</p>
              <p className="seo-panel-hint">Controls what shows up in Google results and social link previews. Leave blank to use the title/excerpt above.</p>
              <label>
                SEO title <span className="char-count">{form.seo_title.length}/60</span>
                <input
                  value={form.seo_title}
                  onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value.slice(0, 70) }))}
                  placeholder={form.title || "Defaults to the article title"}
                />
              </label>
              <label>
                SEO description <span className="char-count">{form.seo_description.length}/160</span>
                <textarea
                  rows={2}
                  value={form.seo_description}
                  onChange={(event) => setForm((prev) => ({ ...prev, seo_description: event.target.value.slice(0, 175) }))}
                  placeholder={form.excerpt || "Defaults to the excerpt above"}
                />
              </label>
              <div className="serp-preview">
                <p className="serp-preview-label">Search result preview</p>
                <p className="serp-title">{form.seo_title || form.title || "Article title"}</p>
                <p className="serp-url">insight.citiplug.com/{form.slug || "your-story-slug"}</p>
                <p className="serp-description">
                  {form.seo_description || form.excerpt || "Your article description will appear here."}
                </p>
              </div>
            </div>

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
