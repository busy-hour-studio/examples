"use client";

import { Avatar } from "@/components/avatar";
import { ChatIcon, PlusIcon, SendIcon } from "@/components/icons";
import { RequireSession } from "@/components/require-session";
import { ApiRoute } from "@/lib/constants";
import { postJson } from "@/lib/fetch-json";
import { clockTime, displayNameOf, relativeTime } from "@/lib/format";
import {
  connectConversation,
  type Conversation,
  ConversationEventName,
  type ConversationListItem,
  type Message,
  type Session,
  type UserClient,
} from "@examples/api";
import {
  type SubmitEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const baseUrl = process.env.NEXT_PUBLIC_BUSYHOUR_API_URL;

export default function ChatPage() {
  return (
    <RequireSession>
      {(session, client) => <Chat session={session} client={client} />}
    </RequireSession>
  );
}

function Chat({ session, client }: { session: Session; client: UserClient }) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const page = await client.chat.list({ limit: 50 });
    setConversations(page.data);
  }, [client]);

  useEffect(() => {
    load().catch((err: unknown) => {
      setError(String(err));
    });
  }, [load]);

  // Stable, so the thread's mark-read effect doesn't re-run (and re-mark,
  // and re-load) on every render.
  const refresh = useCallback(() => {
    void load();
  }, [load]);

  /** Start a DM by name: our backend resolves the name to a BusyHour user,
   *  then the caller creates the conversation with them as a member. */
  async function startDm(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const other = await postJson<{ id: string; displayName: string | null }>(
        ApiRoute.USERS,
        { name },
        session.token
      );
      const me = session.user.displayName ?? "Me";
      const them = other.displayName ?? name;
      const { conversation } = await client.chat.create({
        name: `${me} & ${them}`,
        memberUserIds: [other.id],
      });
      setName("");
      await load();
      setSelectedId(conversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const selected = conversations.find(
    (item) => item.conversation.id === selectedId
  );

  return (
    <div className="chat">
      <aside className="chat-list">
        <div className="chat-list-head">
          <h2>Messages</h2>
          <form className="field-row" onSubmit={(e) => void startDm(e)}>
            <input
              placeholder="DM someone by name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
            <button
              className="btn"
              disabled={!name.trim()}
              title="Start a DM"
              aria-label="Start a DM"
            >
              <PlusIcon />
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
        <ul className="conversations reveal">
          {conversations.map(({ conversation, unreadCount }) => (
            <li key={conversation.id}>
              <button
                type="button"
                className={
                  conversation.id === selectedId
                    ? "conversation selected"
                    : "conversation"
                }
                onClick={() => {
                  setSelectedId(conversation.id);
                }}
              >
                <Avatar
                  id={conversation.id}
                  name={conversation.name ?? "Chat"}
                  size={40}
                />
                <span className="text">
                  <div className="title">
                    {conversation.name ?? "Conversation"}
                  </div>
                  <div className="preview">
                    {conversation.lastMessage?.body ?? "No messages yet"}
                  </div>
                </span>
                <span style={{ display: "grid", justifyItems: "end", gap: 4 }}>
                  {conversation.lastMessageAt && (
                    <span className="meta">
                      {relativeTime(conversation.lastMessageAt)}
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <span className="pill">{unreadCount}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {conversations.length === 0 && (
          <p className="muted" style={{ padding: "0 18px" }}>
            No conversations yet. Type a name above to start one.
          </p>
        )}
      </aside>

      {selected ? (
        <Thread
          key={selected.conversation.id}
          conversation={selected.conversation}
          session={session}
          client={client}
          onRead={refresh}
        />
      ) : (
        <div className="thread">
          <div className="empty">
            <span className="empty-mark">
              <ChatIcon />
            </span>
            <h3>Pick a conversation</h3>
            <p style={{ margin: 0 }}>
              Or start a DM with anyone by name. They don&apos;t need to have
              signed in yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Thread({
  conversation,
  session,
  client,
  onRead,
}: {
  conversation: Conversation;
  session: Session;
  client: UserClient;
  onRead: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  /** Add or replace messages by id. Replay after a reconnect may repeat a
   *  message, and our own sends also arrive over the socket. */
  const upsert = useCallback((incoming: Message[]) => {
    setMessages((current) => {
      const byId = new Map(current.map((m) => [m.id, m]));
      for (const message of incoming) byId.set(message.id, message);
      return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
    });
  }, []);

  // History first, then live events over the conversation's WebSocket.
  useEffect(() => {
    let socket: WebSocket | undefined;
    let cancelled = false;

    void client.chat.messages(conversation.id, { limit: 50 }).then((page) => {
      if (cancelled) return;
      upsert(page.data);
      socket = connectConversation({
        token: session.token,
        conversationId: conversation.id,
        baseUrl,
        // Replay anything sent between loading history and connecting.
        since: page.data[0]?.sequence,
        onEvent: (event) => {
          switch (event.event) {
            case ConversationEventName.MESSAGE_CREATED:
            case ConversationEventName.MESSAGE_UPDATED:
            case ConversationEventName.MESSAGE_DELETED:
              upsert([event.payload.message]);
              break;
            default:
              break;
          }
        },
      });
      socket.addEventListener("open", () => {
        setLive(true);
      });
      socket.addEventListener("close", () => {
        setLive(false);
      });
    });

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [client, conversation.id, session.token, upsert]);

  // Everything on screen is read: move the read cursor to the newest message,
  // and keep the newest message in view.
  const newest = messages.at(-1)?.sequence;
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
    if (newest === undefined) return;
    void client.chat.markRead(conversation.id, newest).then(onRead);
  }, [client, conversation.id, newest, onRead]);

  async function send(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    upsert([await client.chat.send(conversation.id, { body })]);
  }

  // Every message embeds its sender's profile (`null` for system messages,
  // which have no sender, and for deleted users).
  const nameOf = (message: Message) => {
    if (message.senderId === session.user.id) return "You";
    if (!message.senderId) return "BusyHour";
    return displayNameOf(message.sender);
  };

  return (
    <section className="thread">
      <header className="thread-head">
        <Avatar
          id={conversation.id}
          name={conversation.name ?? "Chat"}
          size={36}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{conversation.name ?? "Conversation"}</h3>
          <span className="meta">{conversation.memberCount} members</span>
        </div>
        <span className={live ? "meta live on" : "meta live"}>
          {live ? "live" : "connecting"}
        </span>
      </header>

      <div className="messages">
        {messages.map((message, index) => {
          const mine = message.senderId === session.user.id;
          // Consecutive messages from one sender share a single name and time.
          const grouped = messages[index - 1]?.senderId === message.senderId;
          return (
            <div
              key={message.id}
              className={["message", mine && "mine", grouped && "grouped"]
                .filter(Boolean)
                .join(" ")}
            >
              {!mine && !grouped && message.senderId && (
                <Avatar
                  id={message.senderId}
                  name={nameOf(message)}
                  size={32}
                />
              )}
              <div>
                {!grouped && (
                  <div className="bubble-meta">
                    <span className="bubble-name">{nameOf(message)}</span>
                    <span className="meta">{clockTime(message.createdAt)}</span>
                  </div>
                )}
                <div className="bubble">
                  {message.deletedAt ? <em>deleted</em> : message.body}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="empty">
            <h3>Say hi 👋</h3>
            <p style={{ margin: 0 }}>
              Messages arrive live for everyone in this conversation.
            </p>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <form className="composer" onSubmit={(e) => void send(e)}>
        <input
          placeholder={`Message ${conversation.name ?? ""}`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
        />
        <button className="btn btn-primary" disabled={!draft.trim()}>
          <SendIcon /> Send
        </button>
      </form>
    </section>
  );
}
