import { redirectClosedPublicPage } from "@/lib/portal/require-login-page";

export default async function AboutPage() {
  await redirectClosedPublicPage();
}
