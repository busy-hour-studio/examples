import {
  busyhourServer,
  errorResponse,
  externalIdFor,
  readName,
} from "@/lib/server";

/**
 * Sign in: mint a BusyHour session token for the user.
 *
 * This demo signs you in by name. In a real app, this route would sit behind
 * your own auth and use the signed-in user's id as `externalId`. BusyHour
 * creates the user on first sign-in, so there's no separate sign-up call.
 */
export async function POST(request: Request) {
  try {
    const name = await readName(request);
    const session = await busyhourServer().createSession({
      externalId: externalIdFor(name),
      displayName: name,
    });
    return Response.json(session);
  } catch (error) {
    return errorResponse(error);
  }
}
