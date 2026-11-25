export interface StudentInput {
  fullName: string; rollNumber: string; email: string; mobileNumber: string;
  department: string; course: string; academicYear: string;
  semester: number | null; section: string; batch: string; status: 'Active' | 'Inactive';
}
export type Errors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\+?[0-9][0-9\s\-]{6,14}$/;

const s = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());

export function normalizeStudent(b: any): StudentInput {
  const sem = s(b?.semester);
  const status = s(b?.status);
  return {
    fullName: s(b?.fullName), rollNumber: s(b?.rollNumber), email: s(b?.email).toLowerCase(),
    mobileNumber: s(b?.mobileNumber), department: s(b?.department), course: s(b?.course),
    academicYear: s(b?.academicYear), semester: sem === '' ? null : Number(sem),
    section: s(b?.section), batch: s(b?.batch),
    status: (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Active') as any,
  };
}

export function validateStudent(d: StudentInput): Errors {
  const e: Errors = {};
  if (!d.fullName) e.fullName = 'Full name is required';
  else if (d.fullName.length > 120) e.fullName = 'Full name is too long';
  if (!d.rollNumber) e.rollNumber = 'Roll number is required';
  if (!d.email) e.email = 'Email is required';
  else if (!EMAIL_RE.test(d.email)) e.email = 'Enter a valid email address';
  if (!d.mobileNumber) e.mobileNumber = 'Mobile number is required';
  else if (!MOBILE_RE.test(d.mobileNumber)) e.mobileNumber = 'Enter a valid mobile number (7-15 digits)';
  if (!d.department) e.department = 'Department is required';
  if (!d.course) e.course = 'Course/Program is required';
  if (!d.academicYear) e.academicYear = 'Academic year is required';
  if (d.semester !== null && (!Number.isInteger(d.semester) || d.semester < 1 || d.semester > 12))
    e.semester = 'Semester must be a whole number between 1 and 12';
  if (d.status !== 'Active' && d.status !== 'Inactive') e.status = 'Status must be Active or Inactive';
  return e;
}
