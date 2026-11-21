import {
  busyhourServer,
  errorResponse,
  externalIdFor,
  readName,
  requireCaller,
} from "@/lib/server";

/**
 * Find (or create) the user with this name and return their BusyHour id, so
 * the caller can start a DM with them, even if they've never signed in.
 * Only signed-in users may call it.
 */
export async function POST(request: Request) {
  try {
    await requireCaller(request);
    const name = await readName(request);
    const user = await busyhourServer().upsertUser({
      externalId: externalIdFor(name),
      displayName: name,
    });
    return Response.json({ id: user.id, displayName: user.displayName });
  } catch (error) {
    return errorResponse(error);
  }
}
