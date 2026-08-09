import {
  listMailbox,
  listStaffRecipients,
} from "@/app/actions/messages";
import { InboxPanel } from "@/components/portal/inbox-panel";
import { PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { requireUser } from "@/lib/portal/auth";

export default async function TeachInboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    error?: string;
    replyTo?: string;
    subject?: string;
  }>;
}) {
  const user = await requireUser(["instructor", "owner", "dean"]);
  const params = await searchParams;
  const [messages, recipients] = await Promise.all([
    listMailbox(user.id),
    listStaffRecipients(user.id),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Inbox"
        title="Student messages"
        description="Read and reply to student messages on the school portal. All delivery stays user-to-user inside Excelsior."
      />
      <Section className="bg-[var(--eui-surface)]">
        <InboxPanel
          userId={user.id}
          messages={messages}
          recipients={recipients}
          returnTo="/teach/inbox"
          composeHint="Message a student or another staff member on the portal. Replies stay in this Inbox — no email is used."
          status={{
            sent: params.sent === "1",
            error: params.error,
          }}
          replyTo={params.replyTo}
          defaultSubject={params.subject}
        />
      </Section>
    </>
  );
}
