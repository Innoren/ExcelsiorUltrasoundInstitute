import type { Role } from "@/db/schema";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  dean: "Dean",
  instructor: "Instructor",
  student: "Student",
};

/** Post-login / portal home for each role. Students land on the courses dashboard. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "owner":
      return "/admin";
    case "dean":
      return "/campus";
    case "instructor":
      return "/teach";
    case "student":
      return "/learn";
    default:
      return "/learn";
  }
}

export const can = {
  manageUsers: (role: Role) => role === "owner" || role === "dean",
  assignRoles: (role: Role) => role === "owner",
  managePrograms: (role: Role) => role === "owner" || role === "dean",
  manageCohorts: (role: Role) => role === "owner" || role === "dean",
  enrollStudents: (role: Role) => role === "owner" || role === "dean",
  editCourses: (role: Role) =>
    role === "owner" || role === "dean" || role === "instructor",
  gradeStudents: (role: Role) =>
    role === "owner" || role === "dean" || role === "instructor",
  unlockExams: (role: Role) => role === "owner" || role === "dean",
  viewAudit: (role: Role) => role === "owner",
  manageFinancials: (role: Role) => role === "owner",
} as const;
