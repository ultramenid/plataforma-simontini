import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
  name: string;
  text: string;
  at: number;
  replies: Comment[];
}

interface CommentsProps {
  alertId: string;
}

// Schema version tag persisted alongside comments so future format changes can
// be distinguished from legacy data and migrated (CLAUDE.md data-integrity rule).
const COMMENTS_SCHEMA_VERSION = 1;

interface StoredComments {
  v: number;
  comments: Comment[];
}

// Accepts legacy stored comments whose replies lacked a `replies` array.
// Logs a warning when legacy (unversioned) data is detected and upgraded.
function normalize(rawComments: unknown): Comment[] {
  if (!Array.isArray(rawComments)) return [];
  return rawComments
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry) => ({
      name: String(entry.name ?? ""),
      text: String(entry.text ?? ""),
      at: Number(entry.at) || 0,
      replies: normalize(entry.replies),
    }));
}

/** Parse persisted storage, handling both the versioned schema and legacy
 *  unversioned comment arrays. Returns normalized comments. */
function parseStored(raw: string | null): Comment[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    // Versioned envelope: { v, comments }
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      typeof (parsed as Record<string, unknown>).v === "number"
    ) {
      const envelope = parsed as StoredComments;
      return normalize(envelope.comments);
    }
    // Legacy unversioned: a bare Comment[] — upgrade in place and warn once.
    if (Array.isArray(parsed)) {
      if (parsed.length > 0) {
        console.warn(
          "[simontini-comments] migrated legacy unversioned comments to schema v1",
        );
      }
      return normalize(parsed);
    }
    return [];
  } catch {
    return [];
  }
}

function addReply(list: Comment[], path: number[], reply: Comment): Comment[] {
  return list.map((comment, i) =>
    i === path[0]
      ? {
          ...comment,
          replies:
            path.length === 1
              ? [...comment.replies, reply]
              : addReply(comment.replies, path.slice(1), reply),
        }
      : comment,
  );
}

function countAll(list: Comment[]): number {
  return list.reduce((total, comment) => total + 1 + countAll(comment.replies), 0);
}

function CommentForm({
  onPost,
  placeholder,
  buttonLabel,
  compact,
}: {
  onPost: (name: string, text: string) => void;
  placeholder: string;
  buttonLabel: string;
  compact?: boolean;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !text.trim()) return;
    onPost(name.trim(), text.trim());
    setName("");
    setText("");
  };

  return (
    <form onSubmit={submit} className="no-print flex flex-col gap-2">
      <Input
        placeholder="Your name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={60}
      />
      <Textarea
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        required
        maxLength={2000}
        className={compact ? "min-h-[50px]" : "min-h-[60px]"}
      />
      <Button
        type="submit"
        variant={compact ? "outline" : "default"}
        className="self-start"
      >
        {buttonLabel}
      </Button>
    </form>
  );
}

function CommentNode({
  comment,
  path,
  depth,
  openPath,
  setOpenPath,
  onReply,
}: {
  comment: Comment;
  path: number[];
  depth: number;
  openPath: string | null;
  setOpenPath: (pathKey: string | null) => void;
  onReply: (path: number[], name: string, text: string) => void;
}) {
  const pathKey = path.join(".");
  const open = openPath === pathKey;
  const replyCount = countAll(comment.replies);
  // ponytail: long threads (>3 nested replies) start collapsed
  const [collapsed, setCollapsed] = useState(replyCount > 3);

  return (
    <div className="rounded-md border border-line bg-secondary px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-canopy/15 font-mono text-[10px] font-semibold uppercase text-canopy">
          {comment.name.charAt(0) || "?"}
        </span>
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-mono text-[10px] text-canopy">
            {comment.name}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {new Date(comment.at).toLocaleString()}
          </span>
        </div>
      </div>
      <p className="my-1.5 text-[13px]">{comment.text}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpenPath(open ? null : pathKey)}
          className="no-print font-mono text-[10px] text-muted-foreground hover:text-canopy"
        >
          {open ? "✕ Cancel" : "↳ Reply"}
        </button>
        {replyCount > 0 && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="font-mono text-[10px] text-muted-foreground hover:text-canopy"
          >
            {collapsed
              ? `▸ Show ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
              : "▾ Hide replies"}
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2.5">
          <CommentForm
            onPost={(name, text) => {
              setCollapsed(false);
              onReply(path, name, text);
            }}
            placeholder={`Reply to ${comment.name}…`}
            buttonLabel="Post reply"
            compact
          />
        </div>
      )}
      {comment.replies.length > 0 && !collapsed && (
        <div
          className={
            // ponytail: indent caps at depth 3 so deep threads stay readable
            depth < 3
              ? "ml-3 mt-2.5 space-y-2 border-l-2 border-line pl-3"
              : "mt-2.5 space-y-2"
          }
        >
          {comment.replies.map((reply, i) => (
            <CommentNode
              key={`${reply.name}-${reply.at}-${i}`}
              comment={reply}
              path={[...path, i]}
              depth={depth + 1}
              openPath={openPath}
              setOpenPath={setOpenPath}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Comments({ alertId }: CommentsProps) {
  const storageKey = `simontini-comments-${alertId}`;
  // ponytail: localStorage per alert; swap for an API when a backend exists
  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      return parseStored(localStorage.getItem(storageKey));
    } catch {
      return [];
    }
  });
  const [openPath, setOpenPath] = useState<string | null>(null);

  const persist = (next: Comment[]) => {
    setComments(next);
    try {
      const envelope: StoredComments = { v: COMMENTS_SCHEMA_VERSION, comments: next };
      localStorage.setItem(storageKey, JSON.stringify(envelope));
    } catch {
      /* storage may be unavailable */
    }
  };

  const post = (name: string, text: string) => {
    persist([...comments, { name, text, at: Date.now(), replies: [] }]);
  };

  const reply = (path: number[], name: string, text: string) => {
    persist(addReply(comments, path, { name, text, at: Date.now(), replies: [] }));
    setOpenPath(null);
  };

  const total = countAll(comments);

  return (
    <section className="discussion mb-7">
      <h2 className="report-h2">
        Discussion{total > 0 && ` · ${total}`}
      </h2>
      <div className="mb-3 space-y-2.5">
        {comments.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No comments yet. Add field observations or context below.
          </p>
        ) : (
          comments.map((comment, i) => (
            <CommentNode
              key={`${comment.name}-${comment.at}-${i}`}
              comment={comment}
              path={[i]}
              depth={0}
              openPath={openPath}
              setOpenPath={setOpenPath}
              onReply={reply}
            />
          ))
        )}
      </div>
      <CommentForm
        onPost={post}
        placeholder="Add a comment — field observations, corrections, context…"
        buttonLabel="Post comment"
      />
    </section>
  );
}
