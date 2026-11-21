import { useEffect, useState } from "react";
import {
  AppRoute,
  INBOX_CHANGED_EVENT,
  UNREAD_POLL_MS,
} from "../lib/constants";
import { Link, usePathname } from "../lib/router";
import { Avatar } from "./avatar";
import { BellIcon, ChatIcon, FeedIcon, SignOutIcon } from "./icons";
import { useSession } from "./session-provider";

const LINKS = [
  { href: AppRoute.CHAT, label: "Chat", Icon: ChatIcon },
  { href: AppRoute.FEED, label: "Feed", Icon: FeedIcon },
  { href: AppRoute.INBOX, label: "Inbox", Icon: BellIcon },
] as const;

/** The side rail: sections, the unread-notification count, and the user. */
export function Nav() {
  const { session, client, signOut } = useSession();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  // Keep the inbox count fresh. (A production app might trigger this from a
  // push notification instead of polling.)
  useEffect(() => {
    if (!client) return;
    const refresh = () => {
      client.notifications.unreadCount().then(setUnread, () => undefined);
    };
    refresh();
    const timer = setInterval(refresh, UNREAD_POLL_MS);
    window.addEventListener(INBOX_CHANGED_EVENT, refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener(INBOX_CHANGED_EVENT, refresh);
    };
  }, [client, pathname]);

  if (!session) return null;
  const name = session.user.displayName ?? session.user.externalId;

  return (
    <nav className="rail">
      <div className="brand">
        <span className="brand-mark">bh</span>
        BusyHour
      </div>
      {LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          to={href}
          className={pathname === href ? "rail-link active" : "rail-link"}
        >
          <Icon />
          {label}
          {href === AppRoute.INBOX && unread > 0 && (
            <span className="pill">{unread}</span>
          )}
        </Link>
      ))}
      <div className="rail-user">
        <Avatar id={session.user.id} name={name} size={32} />
        <span className="name">{name}</span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <SignOutIcon />
        </button>
      </div>
    </nav>
  );
}
