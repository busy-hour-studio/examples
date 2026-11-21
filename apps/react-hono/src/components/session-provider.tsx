import { createUserClient, type Session, type UserClient } from "@examples/api";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { backend, read } from "../lib/backend";
import { API_URL, StorageKey } from "../lib/constants";

interface SessionState {
  /** `null` when signed out. */
  session: Session | null;
  /** BusyHour calls as the signed-in user (null when signed out). */
  client: UserClient | null;
  signIn: (name: string) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(StorageKey.SESSION);
  if (!raw) return null;
  const session = JSON.parse(raw) as Session;
  // Session tokens are short-lived; an expired one means signing in again.
  return Date.parse(session.expiresAt) > Date.now() ? session : null;
}

/** Holds the signed-in user's BusyHour session for the whole app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readStoredSession);

  const signIn = useCallback(async (name: string) => {
    // Our own backend mints the token with the API key (server-side).
    const next = await read(backend.session.$post({ json: { name } }));
    localStorage.setItem(StorageKey.SESSION, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(StorageKey.SESSION);
    setSession(null);
  }, []);

  // The browser talks to BusyHour directly with the user's session token.
  const client = useMemo(
    () =>
      session
        ? createUserClient({ token: session.token, baseUrl: API_URL })
        : null,
    [session]
  );

  const value = useMemo(
    () => ({ session, client, signIn, signOut }),
    [session, client, signIn, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const state = useContext(SessionContext);
  if (!state) throw new Error("useSession must be used inside SessionProvider");
  return state;
}
