import { type MouseEvent, type ReactNode, useSyncExternalStore } from "react";
import type { AppRoute } from "./constants";

// Four pages don't need a router library: this is the browser's History API
// and a hook that re-renders when the path changes.

const NAVIGATE_EVENT = "busyhour-example:navigate";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

/** The current path, e.g. "/chat". */
export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

/** Go to a page. `replace` swaps the history entry instead of adding one. */
export function navigate(to: AppRoute, { replace = false } = {}) {
  if (to === window.location.pathname) return;
  if (replace) window.history.replaceState(null, "", to);
  else window.history.pushState(null, "", to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/** An in-app link: a real `<a>`, so open-in-new-tab still works. */
export function Link({
  to,
  className,
  children,
}: {
  to: AppRoute;
  className?: string;
  children: ReactNode;
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
      return;
    event.preventDefault();
    navigate(to);
  }
  return (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
