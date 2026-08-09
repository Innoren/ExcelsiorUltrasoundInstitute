import type { Role } from "@/db/schema";

export const portalLinksByRole: Record<
  Role,
  { href: string; label: string }[]
> = {
  student: [
    { href: "/learn", label: "Dashboard" },
    { href: "/learn/courses", label: "Courses" },
    { href: "/learn/calendar", label: "Calendar" },
    { href: "/learn/grades", label: "Grades" },
    { href: "/learn/inbox", label: "Inbox" },
  ],
  instructor: [
    { href: "/teach", label: "Teach" },
    { href: "/teach/courses", label: "Course builder" },
    { href: "/teach/gradebook", label: "Gradebook" },
    { href: "/teach/inbox", label: "Inbox" },
  ],
  dean: [
    { href: "/campus", label: "Campus" },
    { href: "/campus/cohorts", label: "Cohorts" },
    { href: "/campus/enrollments", label: "Enrollments" },
  ],
  owner: [
    { href: "/admin", label: "Admin" },
    { href: "/admin/financials", label: "Financials" },
    { href: "/admin/programs", label: "Programs" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/audit", label: "Audit" },
    { href: "/campus", label: "Campus" },
    { href: "/teach", label: "Teach" },
    { href: "/learn", label: "Student view" },
  ],
};
