import {
  listMailbox,
  listMessageableStaff,
} from "@/app/actions/messages";
import { InboxPanel } from "@/components/portal/inbox-panel";
import { PageHeader } from "@/components/portal/page-header";
import { requireUser } from "@/lib/portal/auth";

export default async function LearnInboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    error?: string;
    replyTo?: string;
    subject?: string;
  }>;
}) {
  const user = await requireUser(["student", "owner", "dean", "instructor"]);
  const params = await searchParams;
  const [messages, staff] = await Promise.all([
    listMailbox(user.id),
    listMessageableStaff(),
  ]);

  const recipients = staff.filter((person) => person.id !== user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        title="Inbox"
        description="Message instructors and staff on the portal — user-to-user inside Excelsior, not email."
      />
      <InboxPanel
        userId={user.id}
        messages={messages}
        recipients={recipients}
        returnTo="/learn/inbox"
        composeHint="Pick a portal instructor, dean, or owner. They will see your message in their portal Inbox and can reply here."
        status={{
          sent: params.sent === "1",
          error: params.error,
        }}
        replyTo={params.replyTo}
        defaultSubject={params.subject}
      />
    </div>
  );
}
