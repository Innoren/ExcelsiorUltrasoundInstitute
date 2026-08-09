import type { Role } from "@/db/schema";

export type GlobalNavItem = {
  href: string;
  label: string;
  match?: "exact" | "prefix";
};

export function globalNavForRole(role: Role): GlobalNavItem[] {
  switch (role) {
    case "student":
      return [
        { href: "/learn", label: "Home", match: "exact" },
        { href: "/learn/courses", label: "Courses", match: "prefix" },
        { href: "/learn/calendar", label: "Calendar", match: "prefix" },
        { href: "/learn/grades", label: "Grades", match: "prefix" },
        { href: "/learn/inbox", label: "Inbox", match: "prefix" },
      ];
    case "instructor":
      return [
        { href: "/teach", label: "Home", match: "exact" },
        { href: "/teach/courses", label: "Courses", match: "prefix" },
        { href: "/teach/gradebook", label: "Gradebook", match: "prefix" },
        { href: "/teach/inbox", label: "Inbox", match: "prefix" },
      ];
    case "dean":
      return [
        { href: "/campus", label: "Home", match: "exact" },
        { href: "/campus/cohorts", label: "Cohorts", match: "prefix" },
        { href: "/campus/enrollments", label: "Enrollments", match: "prefix" },
        { href: "/teach", label: "Teach", match: "prefix" },
      ];
    case "owner":
      return [
        { href: "/admin", label: "Home", match: "exact" },
        { href: "/admin/financials", label: "Financials", match: "prefix" },
        { href: "/admin/programs", label: "Programs", match: "prefix" },
        { href: "/admin/users", label: "Users", match: "prefix" },
        { href: "/admin/audit", label: "Audit", match: "prefix" },
        { href: "/campus", label: "Campus", match: "prefix" },
        { href: "/teach", label: "Teach", match: "prefix" },
        { href: "/learn", label: "Student view", match: "prefix" },
      ];
    default:
      return [];
  }
}

export function isGlobalNavActive(pathname: string, item: GlobalNavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
