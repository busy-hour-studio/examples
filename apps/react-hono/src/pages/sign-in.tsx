import { type SubmitEvent, useEffect, useState } from "react";
import { useSession } from "../components/session-provider";
import { AppRoute } from "../lib/constants";
import { navigate } from "../lib/router";

const FEATURES = [
  {
    title: "Chat",
    text: "DMs with live delivery over a plain WebSocket.",
  },
  {
    title: "Feed",
    text: "Posts, likes, comments, and a feed of the people you follow.",
  },
  {
    title: "Notifications",
    text: "An inbox your backend fills with one REST call.",
  },
] as const;

/**
 * Sign in by name. Behind the scenes, our Hono backend (`POST /api/session`) mints a BusyHour session
 * token with the API key. In a real app you'd call it after your own login.
 */
export function SignInPage() {
  const { session, signIn } = useSession();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate(AppRoute.CHAT, { replace: true });
  }, [session]);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(name);
      navigate(AppRoute.CHAT);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="signin">
      <section className="signin-hero">
        <span className="kicker" style={{ color: "#5eead4" }}>
          BusyHour × React + Hono
        </span>
        <h1>
          Chat, feeds &amp; notifications. <em>No SDK.</em>
        </h1>
        <div className="signin-features">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <span className="meta" style={{ color: "#5eead4" }}>
                →
              </span>
              <span>
                <strong>{feature.title}.</strong> {feature.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="signin-form">
        <form className="signin-card" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <span className="kicker">Example app</span>
            <h2>Pick a name to sign in</h2>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            No password: this demo signs you in by name. Open a second browser
            (or a private window) as someone else to chat with yourself.
          </p>
          <div className="field-row">
            <input
              placeholder="e.g. Ada Lovelace"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              autoFocus
            />
            <button className="btn btn-primary" disabled={busy || !name.trim()}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <p className="meta" style={{ margin: 0 }}>
            POST /api/session → POST /v1/sessions
          </p>
        </form>
      </section>
    </div>
  );
}
