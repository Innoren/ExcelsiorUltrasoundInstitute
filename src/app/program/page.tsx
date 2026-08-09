import { redirectClosedPublicPage } from "@/lib/portal/require-login-page";

export default async function ProgramPage() {
  await redirectClosedPublicPage();
}
