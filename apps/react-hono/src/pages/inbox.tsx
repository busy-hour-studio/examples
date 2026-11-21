import type { Notification, Session, UserClient } from "@examples/api";
import { useCallback, useEffect, useState } from "react";
import { BellIcon } from "../components/icons";
import { RequireSession } from "../components/require-session";
import { backend, read, withToken } from "../lib/backend";
import { INBOX_CHANGED_EVENT } from "../lib/constants";
import { timeAgo } from "../lib/format";

export function InboxPage() {
  return (
    <RequireSession>
      {(session, client) => <Inbox session={session} client={client} />}
    </RequireSession>
  );
}

function Inbox({ session, client }: { session: Session; client: UserClient }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const page = await client.notifications.list({ limit: 50 });
    setNotifications(page.data);
    window.dispatchEvent(new Event(INBOX_CHANGED_EVENT));
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(notification: Notification) {
    if (notification.readAt) return;
    await client.notifications.markRead(notification.id);
    await load();
  }

  async function markAllRead() {
    await client.notifications.markAllRead();
    await load();
  }

  async function dismiss(notificationId: string) {
    await client.notifications.dismiss(notificationId);
    setNotifications((current) =>
      current.filter((n) => n.id !== notificationId)
    );
    window.dispatchEvent(new Event(INBOX_CHANGED_EVENT));
  }

  /** Notifications are sent from your backend with the API key; this asks
   *  our Hono backend (`POST /api/notify`) to send one to you. */
  async function sendTest() {
    setError(null);
    try {
      await read(
        backend.notify.$post(
          {
            json: {
              title: "Hello from BusyHour 👋",
              body: "This notification was sent by the app's backend.",
            },
          },
          withToken(session.token)
        )
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="inbox">
      <header className="page-head">
        <div>
          <span className="kicker">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </span>
          <h1>Inbox</h1>
        </div>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void load()}
        >
          Refresh
        </button>
        <button
          type="button"
          className="btn"
          disabled={unread === 0}
          onClick={() => void markAllRead()}
        >
          Mark all read
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void sendTest()}
        >
          Send me one
        </button>
      </header>
      {error && <p className="error">{error}</p>}

      {notifications.length > 0 ? (
        <div className="card notifications reveal">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={
                notification.readAt ? "notification" : "notification unread"
              }
              onClick={() => void markRead(notification)}
            >
              <span className="dot" />
              <div className="text">
                <div className="title">{notification.title}</div>
                {notification.body && (
                  <div className="muted">{notification.body}</div>
                )}
                <span className="meta">{timeAgo(notification.createdAt)}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  void dismiss(notification.id);
                }}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <span className="empty-mark">
            <BellIcon />
          </span>
          <h3>Nothing yet</h3>
          <p style={{ margin: 0 }}>
            Follow someone or comment on their post and they&apos;ll get a
            notification. Or send yourself one.
          </p>
        </div>
      )}
    </div>
  );
}
