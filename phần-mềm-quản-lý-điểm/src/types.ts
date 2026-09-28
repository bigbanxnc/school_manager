export type Role = 'admin' | 'teacher' | 'student';

export interface UserPermissions {
  // Class & Enrollment Management
  createClass?: boolean;
  editClass?: boolean;
  deleteClass?: boolean;
  manageMembers?: boolean;
  assignTeachers?: boolean;
  autoAssignTeacher?: boolean;
  enrollStudents?: boolean;
  unenrollStudents?: boolean;

  // Grade & Academic Management
  editMathGrades?: boolean;
  editLiteratureGrades?: boolean;
  editEnglishGrades?: boolean;
  teacherEnterGrades?: boolean;
  teacherClearGrades?: boolean;
  lockGrades?: boolean;
  studentRequestReview?: boolean;

  // Inquiry, Statistics & Reports
  viewAllSchoolGrades?: boolean;
  viewClassGrades?: boolean;
  teacherViewAssignedClassGrades?: boolean;
  teacherViewStudentList?: boolean;
  exportCsvReports?: boolean;
  teacherExportGradesCsv?: boolean;
  studentViewGrades?: boolean;
  studentExportTranscriptCsv?: boolean;

  // Role permissions & System
  teacherAutoClaimClass?: boolean;
  manageRolePermissions?: boolean;
}

export type RolePermissionsMap = {
  admin: UserPermissions;
  teacher: UserPermissions;
  student: UserPermissions;
};

export interface Member {
  id: string;
  code?: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  className?: string;
  assignedClasses?: string[];
  subject?: 'math' | 'literature' | 'english';
  grades?: SubjectGrades;
  permissions?: UserPermissions;
}

export interface SubjectGrades {
  math: number | null; // Điểm Toán
  literature: number | null; // Điểm Văn
  english: number | null; // Điểm Anh

  math_oral?: number | null;
  math_m15?: number | null;
  math_mid?: number | null;
  math_final?: number | null;

  literature_oral?: number | null;
  literature_m15?: number | null;
  literature_mid?: number | null;
  literature_final?: number | null;

  english_oral?: number | null;
  english_m15?: number | null;
  english_mid?: number | null;
  english_final?: number | null;
}

export interface StudentGradeRecord {
  studentId: string;
  studentName: string;
  className: string;
  email: string;
  password?: string;
  grades: SubjectGrades;
  gpa: number | null;
}

export interface ClassItem {
  id: string; // Mã lớp, ví dụ: 10A1, 11A2, 12B1
  code?: string;
  name: string; // Tên lớp học
  studentCount?: number;
  teacherCount?: number;
}

// Angular-specific file representations for the Code Explorer
export interface CodeFile {
  name: string;
  path: string;
  language: 'typescript' | 'html' | 'scss';
  content: string;
}
