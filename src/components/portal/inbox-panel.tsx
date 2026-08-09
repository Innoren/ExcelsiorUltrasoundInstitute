import Link from "next/link";
import {
  markMessageRead,
  sendPortalMessage,
  type PortalRecipient,
} from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/db/schema";
import { displayName } from "@/lib/portal/auth";
import { ROLE_LABELS } from "@/lib/portal/rbac";

type MailMessage = {
  id: string;
  subject: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  senderId: string;
  recipientId: string;
  sender: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  };
  recipient: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  };
  course: { id: string; code: string; title: string } | null;
};

const ERROR_COPY: Record<string, string> = {
  missing: "Choose a recipient and enter a subject and message.",
  self: "You cannot message yourself.",
  recipient: "That portal user was not found or is inactive.",
  forbidden: "You can only message other portal users allowed for your role.",
  send: "Could not send the message. Try again.",
};

export function InboxPanel({
  userId,
  messages,
  recipients,
  composeHint,
  returnTo,
  status,
  replyTo,
  defaultSubject,
}: {
  userId: string;
  messages: MailMessage[];
  recipients: PortalRecipient[];
  composeHint: string;
  returnTo: "/learn/inbox" | "/teach/inbox";
  status?: { sent?: boolean; error?: string };
  replyTo?: string;
  defaultSubject?: string;
}) {
  const inbox = messages.filter((m) => m.recipientId === userId);
  const sent = messages.filter((m) => m.senderId === userId);

  // Ensure reply target is selectable even if not in the default directory.
  const recipientOptions = [...recipients];
  if (replyTo && !recipientOptions.some((person) => person.id === replyTo)) {
    const fromThread = messages.find(
      (m) => m.senderId === replyTo || m.recipientId === replyTo,
    );
    const person =
      fromThread?.senderId === replyTo
        ? fromThread.sender
        : fromThread?.recipient;
    if (person) {
      recipientOptions.unshift({
        id: person.id,
        name: displayName(person),
        role: person.role,
      });
    }
  }

  return (
    <div className="space-y-6">
      <p className="rounded-md border border-[var(--eui-border)] bg-[var(--eui-teal-soft)] px-4 py-3 text-sm text-[var(--eui-teal-deep)]">
        Messages stay on the Excelsior portal — delivered user-to-user inside
        this site. Nothing is sent by email or any external channel.
      </p>

      {status?.sent ? (
        <p className="rounded-md border border-[var(--eui-border)] bg-[var(--eui-surface)] px-4 py-3 text-sm text-[var(--eui-ink)]">
          Message sent. It appears in your Sent list and in the recipient’s
          portal Inbox.
        </p>
      ) : null}
      {status?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {ERROR_COPY[status.error] ?? ERROR_COPY.send}
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-lg border border-[var(--eui-border)] bg-[var(--eui-canvas)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
            Compose
          </h2>
          <p className="mt-2 text-sm text-[var(--eui-ink-muted)]">{composeHint}</p>
          {recipientOptions.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--eui-ink-muted)]">
              No portal users are available to message yet. Ask the school owner
              to create instructor or staff accounts.
            </p>
          ) : (
            <form action={sendPortalMessage} className="mt-6 space-y-4">
              <input type="hidden" name="returnTo" value={returnTo} />
              <div>
                <Label htmlFor="recipientId">To (portal user)</Label>
                <select
                  id="recipientId"
                  name="recipientId"
                  required
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-[var(--eui-surface)] px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  defaultValue={replyTo ?? ""}
                >
                  <option value="" disabled>
                    Select a portal user
                  </option>
                  {recipientOptions.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {ROLE_LABELS[person.role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  required
                  className="mt-1 bg-[var(--eui-surface)]"
                  placeholder="Question about lab hours"
                  defaultValue={defaultSubject ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  name="body"
                  required
                  rows={6}
                  className="mt-1 bg-[var(--eui-surface)]"
                  placeholder="Write your message to this portal user…"
                />
              </div>
              <Button
                type="submit"
                className="bg-[var(--eui-teal)] hover:bg-[var(--eui-teal-deep)]"
              >
                Send on portal
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <MessageList
            title="Inbox"
            empty="No portal messages yet."
            messages={inbox}
            userId={userId}
            returnTo={returnTo}
            showMarkRead
          />
          <MessageList
            title="Sent"
            empty="No sent portal messages yet."
            messages={sent}
            userId={userId}
            returnTo={returnTo}
          />
        </div>
      </div>
    </div>
  );
}

function MessageList({
  title,
  empty,
  messages,
  userId,
  returnTo,
  showMarkRead = false,
}: {
  title: string;
  empty: string;
  messages: MailMessage[];
  userId: string;
  returnTo: "/learn/inbox" | "/teach/inbox";
  showMarkRead?: boolean;
}) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--eui-ink)]">
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        {messages.map((message) => {
          const counterpart =
            message.senderId === userId ? message.recipient : message.sender;
          const unread =
            showMarkRead &&
            message.recipientId === userId &&
            message.readAt == null;
          const replySubject = message.subject.startsWith("Re:")
            ? message.subject
            : `Re: ${message.subject}`;
          const replyHref = `${returnTo}?replyTo=${counterpart.id}&subject=${encodeURIComponent(replySubject)}`;

          return (
            <article
              key={message.id}
              className="rounded-lg border border-[var(--eui-border)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--eui-ink)]">
                    {message.subject}
                    {unread ? (
                      <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[var(--eui-teal)]">
                        Unread
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-[var(--eui-ink-muted)]">
                    {message.senderId === userId ? "To" : "From"}{" "}
                    {displayName(counterpart)} · {ROLE_LABELS[counterpart.role]}
                    {" · "}
                    {message.createdAt.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.senderId !== userId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={replyHref}>Reply on portal</Link>
                    </Button>
                  ) : null}
                  {unread ? (
                    <form action={markMessageRead}>
                      <input
                        type="hidden"
                        name="messageId"
                        value={message.id}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        Mark read
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--eui-ink)]">
                {message.body}
              </p>
            </article>
          );
        })}
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--eui-ink-muted)]">{empty}</p>
        ) : null}
      </div>
    </div>
  );
}
