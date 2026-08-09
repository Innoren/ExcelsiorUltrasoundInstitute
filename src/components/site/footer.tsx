import Link from "next/link";
import { navLinks, school } from "@/lib/school";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--eui-border)] bg-[var(--eui-ink)] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
            {school.name}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
            Orlando-area ultrasound education with clinical depth across six
            specialties — preparing students for ARDMS pathways and patient care.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--eui-teal-glow)]">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--eui-teal-glow)]">
            Visit
          </p>
          <address className="mt-4 space-y-2 text-sm not-italic text-white/75">
            <p>
              {school.address.line1}
              <br />
              {school.address.city}, {school.address.state} {school.address.zip}
            </p>
            <p>
              <a href={`tel:+14072714486`} className="hover:text-white">
                {school.phone}
              </a>
            </p>
            <p>Fax: {school.fax}</p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/45 md:px-6">
        © {new Date().getFullYear()} {school.name}. All rights reserved.
      </div>
    </footer>
  );
}
