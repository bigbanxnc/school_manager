export type Role = 'admin' | 'teacher' | 'student';

export interface Member {
  id: string; // ID / Mã thành viên (e.g. GV001, HS001, admin1)
  name: string; // Tên đầy đủ
  email: string; // Email / Gmail
  password: string; // Mật khẩu
  role: Role; // Vai trò
  className?: string; // Tên lớp (chỉ dành cho học sinh)
  assignedClasses?: string[]; // Danh sách lớp giảng dạy (chỉ dành cho giáo viên)
  subject?: 'math' | 'literature' | 'english'; // Môn giảng dạy (chỉ dành cho giáo viên)
}

export interface SubjectGrades {
  math: number | null; // Điểm Toán
  literature: number | null; // Điểm Văn
  english: number | null; // Điểm Anh
}

export interface StudentGradeRecord {
  studentId: string;
  studentName: string;
  className: string;
  email: string;
  grades: SubjectGrades;
  gpa: number | null;
}

export interface ClassItem {
  id: string; // Mã lớp, ví dụ: 10A1, 11A2, 12B1
  name: string; // Tên lớp học
}

// Angular-specific file representations for the Code Explorer
export interface CodeFile {
  name: string;
  path: string;
  language: 'typescript' | 'html' | 'scss';
  content: string;
}
