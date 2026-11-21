"use client";

import { ApiRoute, StorageKey } from "@/lib/constants";
import { postJson } from "@/lib/fetch-json";
import { createUserClient, type Session, type UserClient } from "@examples/api";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface SessionState {
  /** `null` when signed out; `undefined` until the browser storage is read. */
  session: Session | null | undefined;
  /** BusyHour calls as the signed-in user (null when signed out). */
  client: UserClient | null;
  signIn: (name: string) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

/** The browser talks to BusyHour directly with the user's session token. */
const baseUrl = process.env.NEXT_PUBLIC_BUSYHOUR_API_URL;

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(StorageKey.SESSION);
  if (!raw) return null;
  const session = JSON.parse(raw) as Session;
  // Session tokens are short-lived; an expired one means signing in again.
  return Date.parse(session.expiresAt) > Date.now() ? session : null;
}

/** Holds the signed-in user's BusyHour session for the whole app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>();

  useEffect(() => {
    setSession(readStoredSession());
  }, []);

  const signIn = useCallback(async (name: string) => {
    // Our own route handler mints the token with the API key (server-side).
    const next = await postJson<Session>(ApiRoute.SESSION, { name });
    localStorage.setItem(StorageKey.SESSION, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(StorageKey.SESSION);
    setSession(null);
  }, []);

  const client = useMemo(
    () =>
      session ? createUserClient({ token: session.token, baseUrl }) : null,
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
