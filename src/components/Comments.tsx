import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Reply {
  name: string;
  text: string;
  at: number;
}
interface Comment {
  name: string;
  text: string;
  at: number;
  replies: Reply[];
}

interface CommentsProps {
  alertId: string;
}

export function Comments({ alertId }: CommentsProps) {
  const key = `simontini-comments-${alertId}`;
  // ponytail: localStorage per alert; swap for an API when a backend exists
  const [comments, setComments] = useState<Comment[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? (parsed as Comment[]) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyText, setReplyText] = useState("");

  const persist = (next: Comment[]) => {
    setComments(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    persist([
      ...comments,
      { name: name.trim(), text: text.trim(), at: Date.now(), replies: [] },
    ]);
    setName("");
    setText("");
  };

  const submitReply = (i: number) => (e: FormEvent) => {
    e.preventDefault();
    if (!replyName.trim() || !replyText.trim()) return;
    persist(
      comments.map((c, idx) =>
        idx === i
          ? {
              ...c,
              replies: [
                ...c.replies,
                { name: replyName.trim(), text: replyText.trim(), at: Date.now() },
              ],
            }
          : c,
      ),
    );
    setReplyOpen(null);
    setReplyName("");
    setReplyText("");
  };

  return (
    <section className="discussion mb-7">
      <h2 className="report-h2">Discussion</h2>
      <div className="mb-3">
        {comments.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No comments yet. Add field observations or context below.
          </p>
        ) : (
          comments.map((c, i) => (
            <div
              key={`${c.name}-${c.at}`}
              className="mb-2.5 rounded-md border border-line bg-secondary px-3 py-2.5"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[10px] text-canopy">
                  {c.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(c.at).toLocaleString()}
                </span>
              </div>
              <p className="my-1.5 text-[13px]">{c.text}</p>
              <button
                type="button"
                onClick={() => setReplyOpen(replyOpen === i ? null : i)}
                className="no-print font-mono text-[10px] text-muted-foreground hover:text-canopy"
              >
                ↳ Reply
              </button>
              {c.replies.length > 0 && (
                <div className="ml-4 mt-2.5 space-y-2 border-l-2 border-line pl-3">
                  {c.replies.map((r) => (
                    <div
                      key={`${r.name}-${r.at}`}
                      className="rounded-md border border-line bg-secondary px-3 py-2.5"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[10px] text-canopy">
                          {r.name}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(r.at).toLocaleString()}
                        </span>
                      </div>
                      <p className="my-1.5 text-[13px]">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {replyOpen === i && (
                <form
                  onSubmit={submitReply(i)}
                  className="no-print mt-2.5 flex flex-col gap-2"
                >
                  <Input
                    placeholder="Your name"
                    value={replyName}
                    onChange={(e) => setReplyName(e.target.value)}
                    required
                    maxLength={60}
                  />
                  <Textarea
                    placeholder="Write a reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                    maxLength={2000}
                    className="min-h-[50px]"
                  />
                  <Button type="submit" variant="outline" className="self-start">
                    Post reply
                  </Button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
      <form onSubmit={submit} className="no-print flex flex-col gap-2">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
        />
        <Textarea
          placeholder="Add a comment — field observations, corrections, context…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          maxLength={2000}
          className="min-h-[60px]"
        />
        <Button type="submit" className="self-start">
          Post comment
        </Button>
      </form>
    </section>
  );
}