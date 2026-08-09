import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { getUnreadMessageCount } from "@/app/actions/messages";
import { PortalShell } from "@/components/portal/portal-shell";
import { ThemeProvider } from "@/components/portal/theme-provider";
import { displayName, getCurrentUser } from "@/lib/portal/auth";
import { school } from "@/lib/school";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: school.name,
    template: `%s · ${school.name}`,
  },
  description:
    "Excelsior Ultrasound Institute learning portal — courses, grades, and messaging for Diagnostic Medical Sonography students and staff.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
      suppressHydrationWarning
      data-color-theme="teal"
    >
      <body className="min-h-full font-sans">
        <ThemeProvider>
          {user ? (
            <PortalShell
              user={{
                role: user.role,
                name: displayName(user),
                unreadCount: await getUnreadMessageCount(user.id),
              }}
            >
              {children}
            </PortalShell>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
