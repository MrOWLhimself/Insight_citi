"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [status, setStatus] = useState("");

  return (
    <form
      className="newsletter-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        setStatus(`Welcome in — check ${email} to confirm.`);
        form.reset();
      }}
    >
      <label className="sr-only" htmlFor="email">
        Email address
      </label>
      <div>
        <input id="email" name="email" type="email" placeholder="Your email address" autoComplete="email" required />
        <button type="submit" aria-label="Subscribe">
          →
        </button>
      </div>
      <p>
        Free to your inbox. No noise, ever. <span role="status">{status}</span>
      </p>
    </form>
  );
}
