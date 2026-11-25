export interface User { id: number; name: string; email: string; role: 'admin' | 'viewer'; }
export interface Student {
  id: number; fullName: string; rollNumber: string; email: string; mobileNumber: string;
  department: string; course: string; academicYear: string; semester: number | null;
  section: string; batch: string; status: 'Active' | 'Inactive'; createdAt: string; updatedAt: string;
}
export type StudentForm = Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'semester'> & { semester: string };
export interface Pagination { page: number; limit: number; total: number; totalPages: number; }
export interface DistItem { label: string; count: number; }
export interface Stats {
  totalStudents: number; totalDepartments: number; activeStudents: number; inactiveStudents: number;
  departmentDistribution: DistItem[]; yearDistribution: DistItem[];
}
export interface Meta { departments: string[]; academicYears: string[]; semesters: number[]; sections: string[]; }
