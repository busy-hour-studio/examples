import {
  type Activity,
  type Comment,
  ReactionTarget,
  type Session,
  type UserClient,
} from "@examples/api";
import { type SubmitEvent, useCallback, useEffect, useState } from "react";
import { Avatar } from "../components/avatar";
import { CommentIcon, FeedIcon, HeartIcon } from "../components/icons";
import { RequireSession } from "../components/require-session";
import { backend, read, withToken } from "../lib/backend";
import { ActivityVerb, FeedTab, ReactionType } from "../lib/constants";
import { displayNameOf, timeAgo } from "../lib/format";

export function FeedPage() {
  return (
    <RequireSession>
      {(session, client) => <Feed session={session} client={client} />}
    </RequireSession>
  );
}

function Feed({ session, client }: { session: Session; client: UserClient }) {
  const [tab, setTab] = useState<FeedTab>(FeedTab.ALL);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [draft, setDraft] = useState("");
  const me = session.user.displayName ?? session.user.externalId;

  const load = useCallback(async () => {
    const page = await client.feeds.list({
      limit: 30,
      following: tab === FeedTab.FOLLOWING,
    });
    setActivities(page.data);
  }, [client, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const activity = await client.feeds.create({
      verb: ActivityVerb.POST,
      body,
    });
    setDraft("");
    setActivities((current) => [activity, ...current]);
  }

  return (
    <div className="column">
      <header className="page-head">
        <div>
          <span className="kicker">Activity feed</span>
          <h1>Feed</h1>
        </div>
        <span className="spacer" />
        <div className="segmented" role="tablist">
          {[
            { value: FeedTab.ALL, label: "Everyone" },
            { value: FeedTab.FOLLOWING, label: "Following" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={tab === option.value}
              className={tab === option.value ? "active" : undefined}
              onClick={() => {
                setTab(option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <form className="card composer-card" onSubmit={(e) => void post(e)}>
        <Avatar id={session.user.id} name={me} size={40} />
        <div className="body">
          <textarea
            placeholder="Share something with everyone…"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
          />
          <div className="actions">
            <span className="meta">POST /v1/activities · verb “post”</span>
            <button className="btn btn-primary" disabled={!draft.trim()}>
              Post
            </button>
          </div>
        </div>
      </form>

      <div className="stack reveal" key={tab}>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            session={session}
            client={client}
          />
        ))}
      </div>
      {activities.length === 0 && (
        <div className="empty">
          <span className="empty-mark">
            <FeedIcon />
          </span>
          <h3>
            {tab === FeedTab.FOLLOWING
              ? "No one to follow yet"
              : "Quiet in here"}
          </h3>
          <p style={{ margin: 0 }}>
            {tab === FeedTab.FOLLOWING
              ? "Follow people from the Everyone tab and their posts show up here."
              : "Write the first post. It shows up for everyone in the project."}
          </p>
        </div>
      )}
    </div>
  );
}

function ActivityCard({
  activity,
  session,
  client,
}: {
  activity: Activity;
  session: Session;
  client: UserClient;
}) {
  const mine = activity.userId === session.user.id;
  const me = session.user.displayName ?? session.user.externalId;
  const [likes, setLikes] = useState(
    activity.reactionCounts[ReactionType.LIKE] ?? 0
  );
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");

  // Every activity and comment embeds its author's profile.
  const authorName = displayNameOf(activity.user);
  const author = mine ? "You" : authorName;

  /** Tell the author something happened, via our backend's `/api/notify`. */
  const notifyAuthor = (title: string, body?: string) =>
    read(
      backend.notify.$post(
        { json: { userId: activity.userId, title, body } },
        withToken(session.token)
      )
    );

  async function toggleLike() {
    const result = liked
      ? await client.feeds.unreact(
          ReactionTarget.ACTIVITY,
          activity.id,
          ReactionType.LIKE
        )
      : await client.feeds.react(
          ReactionTarget.ACTIVITY,
          activity.id,
          ReactionType.LIKE
        );
    setLiked(!liked);
    setLikes(result.counts[ReactionType.LIKE] ?? 0);
  }

  async function follow() {
    await client.users.follow(activity.userId);
    setFollowed(true);
    await notifyAuthor(`${me} followed you`);
  }

  async function toggleComments() {
    if (comments) {
      setComments(null);
      return;
    }
    // The API returns the newest comments first; show them oldest first, so
    // the thread reads top to bottom and a new comment lands by the reply box.
    const page = await client.feeds.comments(activity.id, { limit: 50 });
    setComments([...page.data].reverse());
  }

  async function comment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const created = await client.feeds.comment(activity.id, { body });
    setDraft("");
    setComments((current) => [...(current ?? []), created]);
    if (!mine) await notifyAuthor(`${me} commented on your post`, body);
  }

  return (
    <article className="card post">
      <div className="post-head">
        <Avatar id={activity.userId} name={authorName} size={40} />
        <div className="who">
          <strong>{author}</strong>
          <span className="meta">{timeAgo(activity.createdAt)}</span>
        </div>
        {!mine && (
          <button
            type="button"
            className={followed ? "btn btn-ghost on" : "btn"}
            disabled={followed}
            onClick={() => void follow()}
          >
            {followed ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <p className="post-body">{activity.body}</p>

      <div className="post-actions">
        <button
          type="button"
          className={liked ? "btn btn-ghost on" : "btn btn-ghost"}
          onClick={() => void toggleLike()}
          aria-pressed={liked}
        >
          <HeartIcon filled={liked} /> {likes}
        </button>
        <button
          type="button"
          className={comments ? "btn btn-ghost on" : "btn btn-ghost"}
          onClick={() => void toggleComments()}
        >
          <CommentIcon /> {comments ? "Hide" : "Comments"}
        </button>
      </div>

      {comments && (
        <div className="comments">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <Avatar id={c.userId} name={displayNameOf(c.user)} size={26} />
              <div className="comment-bubble">
                <strong style={{ fontSize: 13 }}>
                  {c.userId === session.user.id ? "You" : displayNameOf(c.user)}
                </strong>{" "}
                {c.body}
              </div>
            </div>
          ))}
          <form className="field-row" onSubmit={(e) => void comment(e)}>
            <input
              placeholder="Write a comment"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
              }}
            />
            <button className="btn" disabled={!draft.trim()}>
              Reply
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
