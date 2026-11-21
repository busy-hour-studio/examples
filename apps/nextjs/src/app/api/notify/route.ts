import { AppErrorCode } from "@/lib/constants";
import { busyhourServer, errorResponse, requireCaller } from "@/lib/server";
import { BusyHourError, NotificationAudience } from "@examples/api";

interface NotifyBody {
  /** Who to notify. Omit it to notify yourself (the inbox's test button). */
  userId?: string;
  title?: string;
  body?: string;
}

/**
 * Send a notification to one user. Notifications are sent with the API key,
 * so they go through your backend. Here the caller is verified first, so a
 * browser can't send notifications as someone else.
 */
export async function POST(request: Request) {
  try {
    const caller = await requireCaller(request);
    const input = (await request.json().catch(() => ({}))) as NotifyBody;
    if (!input.title) {
      throw new BusyHourError(
        400,
        AppErrorCode.INVALID_REQUEST,
        "title is required"
      );
    }

    const sent = await busyhourServer().sendNotification({
      audience: NotificationAudience.USERS,
      userIds: [input.userId ?? caller.id],
      title: input.title,
      body: input.body,
      data: { fromUserId: caller.id },
    });
    return Response.json(sent);
  } catch (error) {
    return errorResponse(error);
  }
}
