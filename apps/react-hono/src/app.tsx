import { Nav } from "./components/nav";
import { SessionProvider } from "./components/session-provider";
import { AppRoute } from "./lib/constants";
import { usePathname } from "./lib/router";
import { ChatPage } from "./pages/chat";
import { FeedPage } from "./pages/feed";
import { InboxPage } from "./pages/inbox";
import { SignInPage } from "./pages/sign-in";

const PAGES = {
  [AppRoute.CHAT]: ChatPage,
  [AppRoute.FEED]: FeedPage,
  [AppRoute.INBOX]: InboxPage,
} as const;

function isPage(path: string): path is keyof typeof PAGES {
  return path in PAGES;
}

export function App() {
  const pathname = usePathname();
  const Page = isPage(pathname) ? PAGES[pathname] : SignInPage;

  return (
    <SessionProvider>
      <div className="shell">
        <Nav />
        <main>
          <Page />
        </main>
      </div>
    </SessionProvider>
  );
}
