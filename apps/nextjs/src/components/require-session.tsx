"use client";

import { AppRoute } from "@/lib/constants";
import type { Session, UserClient } from "@examples/api";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useSession } from "./session-provider";

/** Renders `children` with the signed-in session, or sends the visitor to the
 *  sign-in page. */
export function RequireSession({
  children,
}: {
  children: (session: Session, client: UserClient) => ReactNode;
}) {
  const { session, client } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace(AppRoute.HOME);
  }, [session, router]);

  if (!session || !client) return null;
  return <div className="page">{children(session, client)}</div>;
}
