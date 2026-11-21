import type { Session, UserClient } from "@examples/api";
import { type ReactNode, useEffect } from "react";
import { AppRoute } from "../lib/constants";
import { navigate } from "../lib/router";
import { useSession } from "./session-provider";

/** Renders `children` with the signed-in session, or sends the visitor to the
 *  sign-in page. */
export function RequireSession({
  children,
}: {
  children: (session: Session, client: UserClient) => ReactNode;
}) {
  const { session, client } = useSession();

  useEffect(() => {
    if (!session) navigate(AppRoute.HOME, { replace: true });
  }, [session]);

  if (!session || !client) return null;
  return <div className="page">{children(session, client)}</div>;
}
