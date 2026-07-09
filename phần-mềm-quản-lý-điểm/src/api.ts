import { Member, ClassItem, SubjectGrades } from './types';

export const API_BASE = '/api';

export interface GradeDto {
  studentId: string;
  math: number | null;
  literature: number | null;
  english: number | null;
}

export async function loginApi(email: string, password: string): Promise<Member> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Đăng nhập không thành công.');
  }
  return res.json();
}

export async function fetchMembersApi(): Promise<Member[]> {
  const res = await fetch(`${API_BASE}/members`);
  if (!res.ok) throw new Error('Không thể tải danh sách thành viên.');
  return res.json();
}

export async function fetchClassesApi(): Promise<ClassItem[]> {
  const res = await fetch(`${API_BASE}/classes`);
  if (!res.ok) throw new Error('Không thể tải danh sách lớp học.');
  return res.json();
}

export async function fetchGradesApi(): Promise<{ [studentId: string]: SubjectGrades }> {
  const res = await fetch(`${API_BASE}/grades`);
  if (!res.ok) throw new Error('Không thể tải danh sách điểm số.');
  const data: GradeDto[] = await res.json();
  const map: { [studentId: string]: SubjectGrades } = {};
  data.forEach((g) => {
    map[g.studentId] = {
      math: g.math,
      literature: g.literature,
      english: g.english,
    };
  });
  return map;
}

// Teacher APIs
export async function createTeacherApi(teacher: Member): Promise<Member> {
  const res = await fetch(`${API_BASE}/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacher),
  });
  if (!res.ok) throw new Error('Không thể tạo giáo viên.');
  return res.json();
}

export async function updateTeacherApi(id: string, teacher: Member): Promise<Member> {
  const res = await fetch(`${API_BASE}/teachers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacher),
  });
  if (!res.ok) throw new Error('Không thể cập nhật thông tin giáo viên.');
  return res.json();
}

export async function deleteTeacherApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/teachers/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Không thể xóa giáo viên.');
}

// Student APIs
export async function createStudentApi(student: Member): Promise<Member> {
  const res = await fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error('Không thể tạo học sinh.');
  return res.json();
}

export async function updateStudentApi(id: string, student: Member): Promise<Member> {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
  if (!res.ok) throw new Error('Không thể cập nhật thông tin học sinh.');
  return res.json();
}

export async function deleteStudentApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/students/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Không thể xóa học sinh.');
}

// Classes APIs
export async function createClassApi(classObj: ClassItem): Promise<ClassItem> {
  const res = await fetch(`${API_BASE}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(classObj),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tạo lớp học.');
  }
  return res.json();
}

// Enroll / Unenroll APIs
export async function enrollStudentApi(studentId: string, className: string): Promise<Member> {
  const res = await fetch(`${API_BASE}/enroll/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: studentId, className }),
  });
  if (!res.ok) throw new Error('Không thể phân lớp cho học sinh.');
  return res.json();
}

export async function enrollTeacherApi(teacherId: string, className: string): Promise<Member> {
  const res = await fetch(`${API_BASE}/enroll/teacher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: teacherId, className }),
  });
  if (!res.ok) throw new Error('Không thể phân công lớp cho giáo viên.');
  return res.json();
}

export async function unenrollTeacherApi(teacherId: string, className: string): Promise<Member> {
  const res = await fetch(`${API_BASE}/unenroll/teacher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: teacherId, className }),
  });
  if (!res.ok) throw new Error('Không thể hủy phân công lớp cho giáo viên.');
  return res.json();
}

// Grade APIs
export async function saveGradeApi(studentId: string, grades: SubjectGrades): Promise<GradeDto> {
  const res = await fetch(`${API_BASE}/grades/${studentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId,
      math: grades.math,
      literature: grades.literature,
      english: grades.english,
    }),
  });
  if (!res.ok) throw new Error('Không thể lưu điểm số.');
  return res.json();
}

export async function deleteGradeApi(studentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/grades/${studentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Không thể xóa điểm số.');
}
