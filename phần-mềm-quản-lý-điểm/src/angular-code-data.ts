import { CodeFile } from './types';

export const angularCodeFiles: CodeFile[] = [
  {
    name: 'types.ts',
    path: 'src/app/models/types.ts',
    language: 'typescript',
    content: `export type Role = 'admin' | 'teacher' | 'student';

export interface Member {
  id: string; // Mã thành viên (e.g. GV001, HS001, admin1)
  name: string; // Họ và tên
  email: string; // Email / Gmail
  password: string; // Mật khẩu
  role: Role; // Vai trò
  className?: string; // Tên lớp (học sinh)
  assignedClasses?: string[]; // Các lớp giảng dạy (giáo viên)
}

export interface SubjectGrades {
  math: number | null;
  literature: number | null;
  english: number | null;
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
  id: string;
  name: string;
}`
  },
  {
    name: 'grade.service.ts',
    path: 'src/app/services/grade.service.ts',
    language: 'typescript',
    content: `import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Member, SubjectGrades, StudentGradeRecord, ClassItem } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private classesSubject = new BehaviorSubject<ClassItem[]>([
    { id: '10A1', name: 'Lớp 10A1' },
    { id: '11A2', name: 'Lớp 11A2' },
    { id: '12B1', name: 'Lớp 12B1' }
  ]);

  private membersSubject = new BehaviorSubject<Member[]>([
    { id: 'admin1', name: 'Nguyễn Admin', email: 'admin@gmail.com', password: 'admin', role: 'admin' },
    { id: 'GV001', name: 'Trần Thị Toán', email: 'toan.tran@gmail.com', password: 'teacher1', role: 'teacher', assignedClasses: ['10A1', '11A2'] },
    { id: 'GV002', name: 'Lê Văn Văn', email: 'van.le@gmail.com', password: 'teacher2', role: 'teacher', assignedClasses: ['11A2', '12B1'] },
    { id: 'GV003', name: 'Phạm Anh Anh', email: 'anh.pham@gmail.com', password: 'teacher3', role: 'teacher', assignedClasses: ['10A1', '12B1'] },
    { id: 'HS001', name: 'Nguyễn Văn Nam', email: 'nam.nguyen@gmail.com', password: 'student1', role: 'student', className: '10A1' },
    { id: 'HS002', name: 'Trần Thị Bình', email: 'binh.tran@gmail.com', password: 'student2', role: 'student', className: '10A1' },
    { id: 'HS003', name: 'Lê Hoàng Long', email: 'long.le@gmail.com', password: 'student3', role: 'student', className: '11A2' },
    { id: 'HS004', name: 'Phạm Minh Thư', email: 'thu.pham@gmail.com', password: 'student4', role: 'student', className: '11A2' },
    { id: 'HS005', name: 'Vũ Tiến Đạt', email: 'dat.vu@gmail.com', password: 'student5', role: 'student', className: '12B1' },
    { id: 'HS006', name: 'Ngô Mai Chi', email: 'chi.ngo@gmail.com', password: 'student6', role: 'student', className: '12B1' }
  ]);

  private gradesSubject = new BehaviorSubject<{ [studentId: string]: SubjectGrades }>({
    'HS001': { math: 8.5, literature: 7.0, english: 9.0 },
    'HS002': { math: 9.0, literature: 8.5, english: 8.0 },
    'HS003': { math: 6.5, literature: 8.0, english: 7.5 },
    'HS004': { math: 10.0, literature: 9.0, english: 9.5 },
    'HS005': { math: 5.0, literature: 6.0, english: 5.5 },
    'HS006': { math: 7.5, literature: 7.5, english: 8.0 }
  });

  private currentUserSubject = new BehaviorSubject<Member | null>(null);

  constructor() {
    // Load from LocalStorage if available
    const savedClasses = localStorage.getItem('school_classes');
    const savedMembers = localStorage.getItem('school_members');
    const savedGrades = localStorage.getItem('school_grades');
    if (savedClasses) this.classesSubject.next(JSON.parse(savedClasses));
    if (savedMembers) this.membersSubject.next(JSON.parse(savedMembers));
    if (savedGrades) this.gradesSubject.next(JSON.parse(savedGrades));
  }

  // Save utility
  private saveState() {
    localStorage.setItem('school_classes', JSON.stringify(this.classesSubject.value));
    localStorage.setItem('school_members', JSON.stringify(this.membersSubject.value));
    localStorage.setItem('school_grades', JSON.stringify(this.gradesSubject.value));
  }

  // Getters
  getClasses(): Observable<ClassItem[]> { return this.classesSubject.asObservable(); }
  getMembers(): Observable<Member[]> { return this.membersSubject.asObservable(); }
  getGrades(): Observable<{ [studentId: string]: SubjectGrades }> { return this.gradesSubject.asObservable(); }
  getCurrentUser(): Observable<Member | null> { return this.currentUserSubject.asObservable(); }

  login(email: string, password: string): boolean {
    const user = this.membersSubject.value.find(m => m.email.toLowerCase() === email.toLowerCase() && m.password === password);
    if (user) {
      this.currentUserSubject.next(user);
      return true;
    }
    return false;
  }

  logout() {
    this.currentUserSubject.next(null);
  }

  // Admin: Teacher management
  addTeacher(teacher: Omit<Member, 'role'>): void {
    const newTeacher: Member = { ...teacher, role: 'teacher', assignedClasses: teacher.assignedClasses || [] };
    this.membersSubject.next([...this.membersSubject.value, newTeacher]);
    this.saveState();
  }

  updateTeacher(updated: Member): void {
    const list = this.membersSubject.value.map(m => m.id === updated.id ? updated : m);
    this.membersSubject.next(list);
    this.saveState();
  }

  deleteTeacher(id: string): void {
    const list = this.membersSubject.value.filter(m => m.id !== id);
    this.membersSubject.next(list);
    this.saveState();
  }

  // Admin: Class management
  addClass(classId: string, className: string): boolean {
    const exists = this.classesSubject.value.some(c => c.id.toUpperCase() === classId.toUpperCase());
    if (exists) return false;
    const newClass: ClassItem = { id: classId.toUpperCase(), name: className };
    this.classesSubject.next([...this.classesSubject.value, newClass]);
    this.saveState();
    return true;
  }

  // Admin/Teacher: Grade management
  updateStudentGrade(studentId: string, grades: SubjectGrades): void {
    const current = this.gradesSubject.value;
    current[studentId] = grades;
    this.gradesSubject.next({ ...current });
    this.saveState();
  }

  deleteStudentGrades(studentId: string): void {
    const current = this.gradesSubject.value;
    current[studentId] = { math: null, literature: null, english: null };
    this.gradesSubject.next({ ...current });
    this.saveState();
  }

  // Enroll Student to Class
  enrollStudentToClass(studentId: string, className: string): void {
    const list = this.membersSubject.value.map(m => {
      if (m.id === studentId && m.role === 'student') {
        return { ...m, className };
      }
      return m;
    });
    this.membersSubject.next(list);
    this.saveState();
  }

  // Enroll Teacher to Class
  enrollTeacherToClass(teacherId: string, className: string): void {
    const list = this.membersSubject.value.map(m => {
      if (m.id === teacherId && m.role === 'teacher') {
        const classes = m.assignedClasses || [];
        if (!classes.includes(className)) {
          return { ...m, assignedClasses: [...classes, className] };
        }
      }
      return m;
    });
    this.membersSubject.next(list);
    this.saveState();
  }

  // Remove Class from Teacher
  removeTeacherFromClass(teacherId: string, className: string): void {
    const list = this.membersSubject.value.map(m => {
      if (m.id === teacherId && m.role === 'teacher') {
        const classes = (m.assignedClasses || []).filter(c => c !== className);
        return { ...m, assignedClasses: classes };
      }
      return m;
    });
    this.membersSubject.next(list);
    this.saveState();
  }

  // Create Student
  addStudent(student: Omit<Member, 'role'>): void {
    const newStudent: Member = { ...student, role: 'student' };
    this.membersSubject.next([...this.membersSubject.value, newStudent]);
    
    // Initialize grades
    const currentGrades = this.gradesSubject.value;
    currentGrades[student.id] = { math: null, literature: null, english: null };
    this.gradesSubject.next({ ...currentGrades });

    this.saveState();
  }

  updateStudent(updated: Member): void {
    const list = this.membersSubject.value.map(m => m.id === updated.id ? updated : m);
    this.membersSubject.next(list);
    this.saveState();
  }

  deleteStudent(id: string): void {
    const list = this.membersSubject.value.filter(m => m.id !== id);
    this.membersSubject.next(list);

    const currentGrades = this.gradesSubject.value;
    delete currentGrades[id];
    this.gradesSubject.next({ ...currentGrades });

    this.saveState();
  }

  // Helper calculation
  calculateGpa(grades: SubjectGrades): number | null {
    const values = [grades.math, grades.literature, grades.english].filter(v => v !== null) as number[];
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  // Export to CSV helper
  exportToCsv(filename: string, data: StudentGradeRecord[]): void {
    let csvContent = 'data:text/csv;charset=utf-8,\\ufeff';
    csvContent += 'Mã Học Sinh,Tên Học Sinh,Lớp,Email,Điểm Toán,Điểm Văn,Điểm Anh,Điểm Trung Bình\\r\\n';

    data.forEach(row => {
      const mathStr = row.grades.math !== null ? row.grades.math.toString() : 'Chưa có';
      const litStr = row.grades.literature !== null ? row.grades.literature.toString() : 'Chưa có';
      const engStr = row.grades.english !== null ? row.grades.english.toString() : 'Chưa có';
      const gpaStr = row.gpa !== null ? row.gpa.toString() : 'Chưa có';

      const line = \`"\${row.studentId}","\${row.studentName}","\${row.className}","\${row.email}",\${mathStr},\${litStr},\${engStr},\${gpaStr}\`;
      csvContent += line + '\\r\\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}`
  },
  {
    name: 'login.component.ts',
    path: 'src/app/components/login/login.component.ts',
    language: 'typescript',
    content: `import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GradeService } from '../../services/grade.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private gradeService: GradeService, private router: Router) {}

  onSubmit() {
    this.errorMessage = '';
    const success = this.gradeService.login(this.email, this.password);
    if (success) {
      this.gradeService.getCurrentUser().subscribe(user => {
        if (user) {
          if (user.role === 'admin') this.router.navigate(['/admin']);
          else if (user.role === 'teacher') this.router.navigate(['/teacher']);
          else if (user.role === 'student') this.router.navigate(['/student']);
        }
      });
    } else {
      this.errorMessage = 'Email hoặc mật khẩu không hợp lệ. Vui lòng kiểm tra lại.';
    }
  }
}`
  },
  {
    name: 'login.component.html',
    path: 'src/app/components/login/login.component.html',
    language: 'html',
    content: `<div class="login-container">
  <div class="login-card">
    <div class="header">
      <div class="logo">🏫</div>
      <h2>Hệ Thống Quản Lý Điểm</h2>
      <p>Vui lòng đăng nhập vào tài khoản của bạn</p>
    </div>

    <form (submit)="onSubmit()">
      <div class="form-group">
        <label for="email">Tài khoản (Gmail)</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          [(ngModel)]="email" 
          placeholder="example@gmail.com" 
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Mật khẩu</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          [(ngModel)]="password" 
          placeholder="••••••••" 
          required
        />
      </div>

      <div *ngIf="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>

      <button type="submit" class="btn-login">Đăng Nhập</button>
    </form>

    <div class="credentials-helper">
      <p>💡 Tài khoản thử nghiệm nhanh:</p>
      <ul>
        <li><strong>Admin:</strong> admin@gmail.com / admin</li>
        <li><strong>Giáo viên:</strong> toan.tran@gmail.com / teacher1</li>
        <li><strong>Học sinh:</strong> nam.nguyen@gmail.com / student1</li>
      </ul>
    </div>
  </div>
</div>`
  },
  {
    name: 'login.component.scss',
    path: 'src/app/components/login/login.component.scss',
    language: 'scss',
    content: `.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;

  .login-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 440px;
    padding: 40px;
    box-sizing: border-box;

    .header {
      text-align: center;
      margin-bottom: 30px;

      .logo {
        font-size: 3rem;
        margin-bottom: 10px;
      }

      h2 {
        margin: 0;
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 600;
      }

      p {
        margin: 8px 0 0;
        color: #64748b;
        font-size: 0.875rem;
      }
    }

    .form-group {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;

      label {
        color: #475569;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 6px;
      }

      input {
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.95rem;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      }
    }

    .error-alert {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 0.85rem;
      margin-bottom: 20px;
    }

    .btn-login {
      background: #2563eb;
      color: #ffffff;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      padding: 12px;
      width: 100%;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;

      &:hover {
        background: #1d4ed8;
      }
    }

    .credentials-helper {
      margin-top: 25px;
      background: #f8fafc;
      border-radius: 6px;
      padding: 14px;
      font-size: 0.8rem;
      border: 1px dashed #e2e8f0;

      p {
        margin: 0 0 8px;
        font-weight: 600;
        color: #475569;
      }

      ul {
        margin: 0;
        padding-left: 18px;
        color: #64748b;

        li {
          margin-bottom: 4px;
        }
      }
    }
  }
}`
  },
  {
    name: 'admin.component.ts',
    path: 'src/app/components/admin/admin.component.ts',
    language: 'typescript',
    content: `import { Component, OnInit } from '@angular/core';
import { GradeService } from '../../services/grade.service';
import { Member, StudentGradeRecord, ClassItem, SubjectGrades } from '../../models/types';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  activeTab: 'teachers' | 'grades' | 'classes' | 'members' = 'teachers';
  searchText = '';

  // Data arrays
  teachers: Member[] = [];
  students: Member[] = [];
  classes: ClassItem[] = [];
  members: Member[] = [];
  gradesMap: { [studentId: string]: SubjectGrades } = {};

  // Modals / Form inputs
  showTeacherModal = false;
  editingTeacher: Member | null = null;
  teacherForm = { id: '', name: '', email: '', password: '', assignedClasses: [] as string[] };

  showGradeModal = false;
  editingGradeRecord: StudentGradeRecord | null = null;
  gradeForm = { math: null as number | null, literature: null as number | null, english: null as number | null };

  showClassModal = false;
  classForm = { id: '', name: '' };
  classError = '';

  showEnrollModal = false;
  enrollTarget: { type: 'student' | 'teacher'; id: string; name: string } | null = null;
  selectedEnrollClass = '';

  showStudentModal = false;
  editingStudent: Member | null = null;
  studentForm = { id: '', name: '', email: '', password: '', className: '' };

  constructor(public gradeService: GradeService) {}

  ngOnInit() {
    this.gradeService.getClasses().subscribe(c => this.classes = c);
    this.gradeService.getMembers().subscribe(m => {
      this.members = m;
      this.teachers = m.filter(x => x.role === 'teacher');
      this.students = m.filter(x => x.role === 'student');
    });
    this.gradeService.getGrades().subscribe(g => this.gradesMap = g);
  }

  // Get full list of calculated student grades
  getStudentGradeRecords(): StudentGradeRecord[] {
    return this.students.map(s => {
      const grades = this.gradesMap[s.id] || { math: null, literature: null, english: null };
      return {
        studentId: s.id,
        studentName: s.name,
        className: s.className || 'Chưa xếp lớp',
        email: s.email,
        grades,
        gpa: this.gradeService.calculateGpa(grades)
      };
    });
  }

  // Filtered lists based on search criteria (case-insensitive)
  getFilteredTeachers(): Member[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.teachers;
    return this.teachers.filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  }

  getFilteredGrades(): StudentGradeRecord[] {
    const records = this.getStudentGradeRecords();
    const q = this.searchText.trim().toLowerCase();
    if (!q) return records;
    return records.filter(r => 
      r.studentId.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.className.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.grades.math !== null && r.grades.math.toString().includes(q)) ||
      (r.grades.literature !== null && r.grades.literature.toString().includes(q)) ||
      (r.grades.english !== null && r.grades.english.toString().includes(q)) ||
      (r.gpa !== null && r.gpa.toString().includes(q))
    );
  }

  getFilteredMembers(): Member[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.members;
    return this.members.filter(m => 
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  }

  // Teacher CRUD operations
  openAddTeacher() {
    this.editingTeacher = null;
    this.teacherForm = { id: '', name: '', email: '', password: '', assignedClasses: [] };
    this.showTeacherModal = true;
  }

  openEditTeacher(teacher: Member) {
    this.editingTeacher = teacher;
    this.teacherForm = {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      password: teacher.password,
      assignedClasses: [...(teacher.assignedClasses || [])]
    };
    this.showTeacherModal = true;
  }

  saveTeacher() {
    if (this.editingTeacher) {
      // Edit
      this.gradeService.updateTeacher({
        ...this.editingTeacher,
        name: this.teacherForm.name,
        email: this.teacherForm.email,
        password: this.teacherForm.password,
        assignedClasses: this.teacherForm.assignedClasses
      });
    } else {
      // Create
      this.gradeService.addTeacher({
        id: this.teacherForm.id,
        name: this.teacherForm.name,
        email: this.teacherForm.email,
        password: this.teacherForm.password,
        assignedClasses: this.teacherForm.assignedClasses
      });
    }
    this.showTeacherModal = false;
  }

  deleteTeacher(id: string) {
    if (confirm('Bạn chắc chắn muốn xóa giáo viên này?')) {
      this.gradeService.deleteTeacher(id);
    }
  }

  toggleTeacherClass(classId: string) {
    const index = this.teacherForm.assignedClasses.indexOf(classId);
    if (index > -1) {
      this.teacherForm.assignedClasses.splice(index, 1);
    } else {
      this.teacherForm.assignedClasses.push(classId);
    }
  }

  // Student CRUD operations
  openAddStudent() {
    this.editingStudent = null;
    this.studentForm = { id: '', name: '', email: '', password: '', className: '' };
    this.showStudentModal = true;
  }

  openEditStudent(student: Member) {
    this.editingStudent = student;
    this.studentForm = {
      id: student.id,
      name: student.name,
      email: student.email,
      password: student.password,
      className: student.className || ''
    };
    this.showStudentModal = true;
  }

  saveStudent() {
    if (this.editingStudent) {
      this.gradeService.updateStudent({
        ...this.editingStudent,
        name: this.studentForm.name,
        email: this.studentForm.email,
        password: this.studentForm.password,
        className: this.studentForm.className
      });
    } else {
      this.gradeService.addStudent({
        id: this.studentForm.id,
        name: this.studentForm.name,
        email: this.studentForm.email,
        password: this.studentForm.password,
        className: this.studentForm.className
      });
    }
    this.showStudentModal = false;
  }

  deleteStudent(id: string) {
    if (confirm('Bạn chắc chắn muốn xóa học sinh này và mọi điểm số liên quan?')) {
      this.gradeService.deleteStudent(id);
    }
  }

  // Grade CRUD operations
  openEditGrade(record: StudentGradeRecord) {
    this.editingGradeRecord = record;
    this.gradeForm = {
      math: record.grades.math,
      literature: record.grades.literature,
      english: record.grades.english
    };
    this.showGradeModal = true;
  }

  saveGrade() {
    if (this.editingGradeRecord) {
      this.gradeService.updateStudentGrade(this.editingGradeRecord.studentId, {
        math: this.gradeForm.math,
        literature: this.gradeForm.literature,
        english: this.gradeForm.english
      });
      this.showGradeModal = false;
    }
  }

  clearGrade(studentId: string) {
    if (confirm('Bạn có muốn xóa toàn bộ điểm số của học sinh này?')) {
      this.gradeService.deleteStudentGrades(studentId);
    }
  }

  // Class addition
  openAddClass() {
    this.classForm = { id: '', name: '' };
    this.classError = '';
    this.showClassModal = true;
  }

  saveClass() {
    this.classError = '';
    if (!this.classForm.id || !this.classForm.name) {
      this.classError = 'Vui lòng điền đầy đủ thông tin mã lớp và tên lớp.';
      return;
    }
    const ok = this.gradeService.addClass(this.classForm.id, this.classForm.name);
    if (ok) {
      this.showClassModal = false;
    } else {
      this.classError = 'Mã lớp này đã tồn tại!';
    }
  }

  // Enrollment dialogs
  openEnroll(type: 'student' | 'teacher', id: string, name: string) {
    this.enrollTarget = { type, id, name };
    this.selectedEnrollClass = '';
    this.showEnrollModal = true;
  }

  saveEnroll() {
    if (this.enrollTarget && this.selectedEnrollClass) {
      if (this.enrollTarget.type === 'student') {
        this.gradeService.enrollStudentToClass(this.enrollTarget.id, this.selectedEnrollClass);
      } else {
        this.gradeService.enrollTeacherToClass(this.enrollTarget.id, this.selectedEnrollClass);
      }
      this.showEnrollModal = false;
    }
  }

  unenrollTeacher(teacherId: string, className: string) {
    if (confirm(\`Bạn muốn hủy giảng dạy lớp \${className} cho giáo viên này?\`)) {
      this.gradeService.removeTeacherFromClass(teacherId, className);
    }
  }

  // Exports
  exportGrades() {
    this.gradeService.exportToCsv('bang_diem_he_thong.csv', this.getStudentGradeRecords());
  }
}`
  },
  {
    name: 'admin.component.html',
    path: 'src/app/components/admin/admin.component.html',
    language: 'html',
    content: `<div class="admin-dashboard">
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="logo">🏫 Admin Panel</div>
    <ul class="nav-links">
      <li [class.active]="activeTab === 'teachers'" (click)="activeTab = 'teachers'">💼 Quản Lý Giáo Viên</li>
      <li [class.active]="activeTab === 'grades'" (click)="activeTab = 'grades'">📊 Điểm Số & Học Sinh</li>
      <li [class.active]="activeTab === 'classes'" (click)="activeTab = 'classes'">📚 Quản Lý Lớp Học</li>
      <li [class.active]="activeTab === 'members'" (click)="activeTab = 'members'">👥 Tất Cả Thành Viên</li>
    </ul>
  </div>

  <!-- Content Workspace -->
  <div class="workspace">
    <div class="top-bar">
      <h2>Phân hệ Quản trị hệ thống</h2>
      <div class="search-box">
        <input 
          type="text" 
          placeholder="Tìm kiếm mã, tên, email, điểm số..." 
          [(ngModel)]="searchText"
        />
      </div>
    </div>

    <!-- TAB 1: TEACHER MANAGEMENT -->
    <div *ngIf="activeTab === 'teachers'" class="tab-content">
      <div class="section-header">
        <h3>Danh Sách Tài Khoản Giáo Viên</h3>
        <button class="btn btn-primary" (click)="openAddTeacher()">+ Thêm Giáo Viên</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Mã GV</th>
            <th>Họ và Tên</th>
            <th>Email</th>
            <th>Mật khẩu</th>
            <th>Lớp Giảng Dạy</th>
            <th>Ghi Danh Lớp</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of getFilteredTeachers()">
            <td><strong>{{ t.id }}</strong></td>
            <td>{{ t.name }}</td>
            <td>{{ t.email }}</td>
            <td><code>{{ t.password }}</code></td>
            <td>
              <div class="badge-container">
                <span *ngFor="let c of t.assignedClasses" class="badge">
                  {{ c }}
                  <span class="remove" (click)="unenrollTeacher(t.id, c)">×</span>
                </span>
                <span *ngIf="!t.assignedClasses || t.assignedClasses.length === 0" class="empty-text">Chưa phân lớp</span>
              </div>
            </td>
            <td>
              <button class="btn btn-sm btn-secondary" (click)="openEnroll('teacher', t.id, t.name)">+ Phân lớp</button>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-icon btn-edit" (click)="openEditTeacher(t)">✏️</button>
                <button class="btn btn-icon btn-delete" (click)="deleteTeacher(t.id)">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB 2: GRADES & STUDENT MANAGEMENT -->
    <div *ngIf="activeTab === 'grades'" class="tab-content">
      <div class="section-header">
        <h3>Bảng Điểm Học Sinh</h3>
        <div class="header-actions">
          <button class="btn btn-secondary mr-2" (click)="openAddStudent()">+ Thêm Học Sinh</button>
          <button class="btn btn-success" (click)="exportGrades()">📥 Xuất CSV Bảng Điểm</button>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Mã HS</th>
            <th>Tên Học Sinh</th>
            <th>Lớp</th>
            <th>Email</th>
            <th>Môn Toán</th>
            <th>Môn Văn</th>
            <th>Môn Anh</th>
            <th>ĐTB (GPA)</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of getFilteredGrades()">
            <td><strong>{{ r.studentId }}</strong></td>
            <td>{{ r.studentName }}</td>
            <td>
              <span class="class-label">{{ r.className }}</span>
              <button class="btn-link" (click)="openEnroll('student', r.studentId, r.studentName)">Đổi</button>
            </td>
            <td>{{ r.email }}</td>
            <td [class.not-graded]="r.grades.math === null">{{ r.grades.math !== null ? r.grades.math : 'Chưa có' }}</td>
            <td [class.not-graded]="r.grades.literature === null">{{ r.grades.literature !== null ? r.grades.literature : 'Chưa có' }}</td>
            <td [class.not-graded]="r.grades.english === null">{{ r.grades.english !== null ? r.grades.english : 'Chưa có' }}</td>
            <td>
              <strong [class.pass]="r.gpa && r.gpa >= 5" [class.fail]="r.gpa && r.gpa < 5">
                {{ r.gpa !== null ? r.gpa : 'N/A' }}
              </strong>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-icon btn-grade" title="Sửa Điểm" (click)="openEditGrade(r)">💯</button>
                <button class="btn btn-icon btn-edit" title="Sửa Học Sinh" (click)="openEditStudent(students | filterId: r.studentId)">✏️</button>
                <button class="btn btn-icon btn-delete" title="Xóa" (click)="deleteStudent(r.studentId)">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB 3: CLASS LIST -->
    <div *ngIf="activeTab === 'classes'" class="tab-content">
      <div class="section-header">
        <h3>Danh Sách Lớp Học Hệ Thống</h3>
        <button class="btn btn-primary" (click)="openAddClass()">+ Đăng Ký Lớp Mới</button>
      </div>

      <div class="cards-grid">
        <div *ngFor="let c of classes" class="class-card">
          <div class="icon">📚</div>
          <div class="info">
            <h4>{{ c.name }}</h4>
            <p>Mã lớp: <strong>{{ c.id }}</strong></p>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: MEMBERS LIST -->
    <div *ngIf="activeTab === 'members'" class="tab-content">
      <div class="section-header">
        <h3>Toàn Bộ Thành Viên Trong Trường</h3>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Mã Số</th>
            <th>Họ và Tên</th>
            <th>Vai Trò</th>
            <th>Email</th>
            <th>Mật Khẩu</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of getFilteredMembers()">
            <td><code>{{ m.id }}</code></td>
            <td>{{ m.name }}</td>
            <td>
              <span class="role-badge" [ngClass]="m.role">
                {{ m.role === 'admin' ? 'Quản Trị' : m.role === 'teacher' ? 'Giáo Viên' : 'Học Sinh' }}
              </span>
            </td>
            <td>{{ m.email }}</td>
            <td><code>{{ m.password }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`
  },
  {
    name: 'admin.component.scss',
    path: 'src/app/components/admin/admin.component.scss',
    language: 'scss',
    content: `.admin-dashboard {
  display: flex;
  min-height: 80vh;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;

  .sidebar {
    width: 240px;
    background: #0f172a;
    color: #cbd5e1;
    padding: 24px 0;

    .logo {
      padding: 0 24px 24px;
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      border-bottom: 1px solid #1e293b;
    }

    .nav-links {
      list-style: none;
      padding: 15px 0 0;
      margin: 0;

      li {
        padding: 12px 24px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s, color 0.2s;

        &:hover {
          background: #1e293b;
          color: #ffffff;
        }

        &.active {
          background: #2563eb;
          color: #ffffff;
          font-weight: 600;
        }
      }
    }
  }

  .workspace {
    flex: 1;
    padding: 30px;
    box-sizing: border-box;

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e2e8f0;

      h2 {
        margin: 0;
        color: #1e293b;
        font-size: 1.5rem;
      }

      .search-box input {
        padding: 8px 16px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        width: 280px;
        font-size: 0.9rem;

        &:focus {
          outline: none;
          border-color: #3b82f6;
        }
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        color: #334155;
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);

      th {
        background: #f1f5f9;
        color: #475569;
        text-align: left;
        padding: 14px 18px;
        font-size: 0.85rem;
        font-weight: 600;
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        padding: 14px 18px;
        font-size: 0.9rem;
        color: #334155;
        border-bottom: 1px solid #f1f5f9;

        &.not-graded {
          color: #94a3b8;
          font-style: italic;
        }
      }
    }

    .badge-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .badge {
        background: #eff6ff;
        color: #1d4ed8;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;

        .remove {
          margin-left: 6px;
          cursor: pointer;
          font-weight: bold;
          &:hover { color: #dc2626; }
        }
      }

      .empty-text {
        font-size: 0.8rem;
        color: #94a3b8;
        font-style: italic;
      }
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;

      .class-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: center;

        .icon {
          font-size: 2rem;
          margin-right: 15px;
        }

        h4 {
          margin: 0;
          color: #1e293b;
        }

        p {
          margin: 4px 0 0;
          font-size: 0.85rem;
          color: #64748b;
        }
      }
    }

    .role-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;

      &.admin { background: #fee2e2; color: #991b1b; }
      &.teacher { background: #fef3c7; color: #92400e; }
      &.student { background: #dcfce7; color: #166534; }
    }
  }
}`
  },
  {
    name: 'teacher.component.ts',
    path: 'src/app/components/teacher/teacher.component.ts',
    language: 'typescript',
    content: `import { Component, OnInit } from '@angular/core';
import { GradeService } from '../../services/grade.service';
import { Member, StudentGradeRecord, SubjectGrades } from '../../models/types';

@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss']
})
export class TeacherComponent implements OnInit {
  currentUser: Member | null = null;
  searchText = '';
  
  allMembers: Member[] = [];
  gradesMap: { [studentId: string]: SubjectGrades } = {};

  // Form states
  showGradeModal = false;
  editingRecord: StudentGradeRecord | null = null;
  gradeForm = { math: null as number | null, literature: null as number | null, english: null as number | null };

  constructor(public gradeService: GradeService) {}

  ngOnInit() {
    this.gradeService.getCurrentUser().subscribe(u => this.currentUser = u);
    this.gradeService.getMembers().subscribe(m => this.allMembers = m);
    this.gradeService.getGrades().subscribe(g => this.gradesMap = g);
  }

  // Teacher is restricted to classes listed in assignedClasses
  getMyClasses(): string[] {
    return this.currentUser?.assignedClasses || [];
  }

  // View list of all members that this teacher teaches
  // Includes students in assigned classes, and themselves (other teachers excluded)
  getMyMembers(): Member[] {
    const classes = this.getMyClasses();
    return this.allMembers.filter(m => {
      if (m.id === this.currentUser?.id) return true;
      if (m.role === 'student' && m.className && classes.includes(m.className)) return true;
      return false;
    });
  }

  // Map students to full grade record inside teacher's classes
  getMyClassStudentsGrades(): StudentGradeRecord[] {
    const classes = this.getMyClasses();
    const students = this.allMembers.filter(m => m.role === 'student' && m.className && classes.includes(m.className));
    
    return students.map(s => {
      const grades = this.gradesMap[s.id] || { math: null, literature: null, english: null };
      return {
        studentId: s.id,
        studentName: s.name,
        className: s.className || '',
        email: s.email,
        grades,
        gpa: this.gradeService.calculateGpa(grades)
      };
    });
  }

  // Search case-insensitive within teacher's domain
  getFilteredGrades(): StudentGradeRecord[] {
    const records = this.getMyClassStudentsGrades();
    const q = this.searchText.trim().toLowerCase();
    if (!q) return records;
    return records.filter(r => 
      r.studentId.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.className.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.grades.math !== null && r.grades.math.toString().includes(q)) ||
      (r.grades.literature !== null && r.grades.literature.toString().includes(q)) ||
      (r.grades.english !== null && r.grades.english.toString().includes(q)) ||
      (r.gpa !== null && r.gpa.toString().includes(q))
    );
  }

  getFilteredMembers(): Member[] {
    const records = this.getMyMembers();
    const q = this.searchText.trim().toLowerCase();
    if (!q) return records;
    return records.filter(m => 
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  }

  // Grade action (Sửa/Nhập điểm)
  openEditGrade(record: StudentGradeRecord) {
    this.editingRecord = record;
    this.gradeForm = {
      math: record.grades.math,
      literature: record.grades.literature,
      english: record.grades.english
    };
    this.showGradeModal = true;
  }

  saveGrade() {
    if (this.editingRecord) {
      this.gradeService.updateStudentGrade(this.editingRecord.studentId, {
        math: this.gradeForm.math,
        literature: this.gradeForm.literature,
        english: this.gradeForm.english
      });
      this.showGradeModal = false;
    }
  }

  deleteGrade(studentId: string) {
    if (confirm('Bạn chắc chắn muốn xóa điểm của học sinh này?')) {
      this.gradeService.deleteStudentGrades(studentId);
    }
  }

  exportMyGrades() {
    const myClassesStr = this.getMyClasses().join('_');
    this.gradeService.exportToCsv(\`bang_diem_lop_\${myClassesStr}.csv\`, this.getMyClassStudentsGrades());
  }
}`
  },
  {
    name: 'teacher.component.html',
    path: 'src/app/components/teacher/teacher.component.html',
    language: 'html',
    content: `<div class="teacher-dashboard">
  <!-- Main content area -->
  <div class="header-section">
    <div class="user-info">
      <h2>Chào buổi sáng, Giáo Viên: {{ currentUser?.name }}</h2>
      <p>Lớp đảm nhận: 
        <span *ngFor="let c of getMyClasses()" class="class-badge">{{ c }}</span>
        <span *ngIf="getMyClasses().length === 0" class="empty">Chưa có lớp nào được phân</span>
      </p>
    </div>
    <div class="action-bar">
      <div class="search">
        <input 
          type="text" 
          placeholder="Tìm kiếm mã, tên, email, điểm..." 
          [(ngModel)]="searchText"
        />
      </div>
      <button class="btn btn-success" (click)="exportMyGrades()">📥 Xuất CSV Bảng Điểm</button>
    </div>
  </div>

  <div class="dashboard-grid">
    <!-- Student grades list -->
    <div class="panel">
      <div class="panel-header">
        <h3>Quản Lý Điểm Số Học Sinh (Lớp Của Tôi)</h3>
        <p class="subtitle">Chỉ hiển thị học sinh thuộc lớp bạn phụ trách. Bạn có quyền cập nhật và xóa điểm.</p>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Mã HS</th>
            <th>Tên Học Sinh</th>
            <th>Lớp</th>
            <th>Email</th>
            <th>Toán</th>
            <th>Văn</th>
            <th>Anh</th>
            <th>Điểm TB</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of getFilteredGrades()">
            <td><strong>{{ r.studentId }}</strong></td>
            <td>{{ r.studentName }}</td>
            <td><span class="class-label">{{ r.className }}</span></td>
            <td>{{ r.email }}</td>
            <td [class.not-graded]="r.grades.math === null">{{ r.grades.math !== null ? r.grades.math : 'Chưa có' }}</td>
            <td [class.not-graded]="r.grades.literature === null">{{ r.grades.literature !== null ? r.grades.literature : 'Chưa có' }}</td>
            <td [class.not-graded]="r.grades.english === null">{{ r.grades.english !== null ? r.grades.english : 'Chưa có' }}</td>
            <td>
              <strong [class.pass]="r.gpa && r.gpa >= 5" [class.fail]="r.gpa && r.gpa < 5">
                {{ r.gpa !== null ? r.gpa : 'N/A' }}
              </strong>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-secondary" (click)="openEditGrade(r)">✏️ Sửa điểm</button>
                <button class="btn btn-sm btn-danger-outline" (click)="deleteGrade(r.studentId)">🗑️ Xóa điểm</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Members assigned under this teacher's classes -->
    <div class="panel">
      <div class="panel-header">
        <h3>Danh Sách Thành Viên (Môi Trường Lớp Học)</h3>
        <p class="subtitle">Bao gồm các học sinh do bạn trực tiếp giảng dạy và bản thân bạn. Các giáo viên khác hoàn toàn được bảo mật.</p>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Mã Số</th>
            <th>Tên Thành Viên</th>
            <th>Vai Trò</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of getFilteredMembers()">
            <td><code>{{ m.id }}</code></td>
            <td>
              {{ m.name }}
              <span *ngIf="m.id === currentUser?.id" class="self-tag">(Tôi)</span>
            </td>
            <td>
              <span class="role-badge" [ngClass]="m.role">
                {{ m.role === 'teacher' ? 'Giáo Viên' : 'Học Sinh' }}
              </span>
            </td>
            <td>{{ m.email }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`
  },
  {
    name: 'teacher.component.scss',
    path: 'src/app/components/teacher/teacher.component.scss',
    language: 'scss',
    content: `.teacher-dashboard {
  padding: 10px;

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    padding: 24px;
    border-radius: 8px;
    margin-bottom: 24px;
    border: 1px solid #e2e8f0;

    .user-info {
      h2 { margin: 0; font-size: 1.4rem; color: #0f172a; }
      p { margin: 8px 0 0; color: #475569; font-size: 0.9rem; }
    }

    .class-badge {
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      margin-left: 6px;
      font-size: 0.8rem;
    }

    .action-bar {
      display: flex;
      gap: 12px;

      input {
        padding: 8px 16px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.9rem;
        width: 250px;
      }
    }
  }

  .dashboard-grid {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .panel {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 24px;

    .panel-header {
      margin-bottom: 20px;
      h3 { margin: 0; color: #1e293b; font-size: 1.1rem; }
      .subtitle { margin: 6px 0 0; color: #64748b; font-size: 0.825rem; }
    }
  }

  .self-tag {
    background: #f1f5f9;
    color: #475569;
    padding: 2px 6px;
    font-size: 0.75rem;
    border-radius: 4px;
    font-weight: 500;
    margin-left: 8px;
  }
}`
  },
  {
    name: 'student.component.ts',
    path: 'src/app/components/student/student.component.ts',
    language: 'typescript',
    content: `import { Component, OnInit } from '@angular/core';
import { GradeService } from '../../services/grade.service';
import { Member, SubjectGrades, StudentGradeRecord } from '../../models/types';

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit {
  currentUser: Member | null = null;
  grades: SubjectGrades = { math: null, literature: null, english: null };
  gpa: number | null = null;

  constructor(private gradeService: GradeService) {}

  ngOnInit() {
    this.gradeService.getCurrentUser().subscribe(u => {
      this.currentUser = u;
      if (u) {
        this.gradeService.getGrades().subscribe(allGrades => {
          this.grades = allGrades[u.id] || { math: null, literature: null, english: null };
          this.gpa = this.gradeService.calculateGpa(this.grades);
        });
      }
    });
  }

  exportMyGrades() {
    if (!this.currentUser) return;
    const record: StudentGradeRecord = {
      studentId: this.currentUser.id,
      studentName: this.currentUser.name,
      className: this.currentUser.className || 'Chưa xếp lớp',
      email: this.currentUser.email,
      grades: this.grades,
      gpa: this.gpa
    };
    this.gradeService.exportToCsv(\`bang_diem_ca_nhan_\${this.currentUser.id}.csv\`, [record]);
  }
}`
  },
  {
    name: 'student.component.html',
    path: 'src/app/components/student/student.component.html',
    language: 'html',
    content: `<div class="student-dashboard">
  <div class="welcome-card">
    <div class="user-profile">
      <div class="avatar">🎓</div>
      <div class="info">
        <h2>Xin chào, Học Sinh: {{ currentUser?.name }}</h2>
        <p>Học sinh lớp: <strong>{{ currentUser?.className || 'Chưa xếp lớp' }}</strong> | Mã số: <code>{{ currentUser?.id }}</code></p>
        <p class="email">Liên lạc: {{ currentUser?.email }}</p>
      </div>
    </div>
    <button class="btn btn-success" (click)="exportMyGrades()">📥 Xuất CSV Điểm Cá Nhân</button>
  </div>

  <div class="grades-box">
    <h3>Báo Cáo Kết Quả Học Tập Học Kỳ I</h3>
    <p class="desc">Bảng điểm chính thức được phê duyệt bởi Ban giám hiệu nhà trường.</p>

    <div class="subjects-cards">
      <!-- Toán -->
      <div class="subject-card">
        <span class="icon">📐</span>
        <h4>Toán Học</h4>
        <div class="grade-value" [class.empty]="grades.math === null">
          {{ grades.math !== null ? grades.math : 'Chưa có điểm' }}
        </div>
      </div>

      <!-- Văn -->
      <div class="subject-card">
        <span class="icon">✍️</span>
        <h4>Ngữ Văn</h4>
        <div class="grade-value" [class.empty]="grades.literature === null">
          {{ grades.literature !== null ? grades.literature : 'Chưa có điểm' }}
        </div>
      </div>

      <!-- Anh -->
      <div class="subject-card">
        <span class="icon">🗣️</span>
        <h4>Tiếng Anh</h4>
        <div class="grade-value" [class.empty]="grades.english === null">
          {{ grades.english !== null ? grades.english : 'Chưa có điểm' }}
        </div>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="summary-box">
      <div class="gpa-container">
        <div class="label">Điểm Trung Bình Tất Cả Môn (GPA):</div>
        <div class="value" [class.pass]="gpa && gpa >= 5" [class.fail]="gpa && gpa < 5">
          {{ gpa !== null ? gpa : 'Chưa xếp hạng' }}
        </div>
      </div>
      <div class="academic-evaluation" *ngIf="gpa !== null">
        Xếp loại học lực: 
        <strong *ngIf="gpa >= 8.0" class="excellent">Xuất Sắc/Giỏi</strong>
        <strong *ngIf="gpa >= 6.5 && gpa < 8.0" class="good">Khá</strong>
        <strong *ngIf="gpa >= 5.0 && gpa < 6.5" class="average">Trung Bình</strong>
        <strong *ngIf="gpa < 5.0" class="failed">Cần cố gắng</strong>
      </div>
    </div>
  </div>
</div>`
  },
  {
    name: 'student.component.scss',
    path: 'src/app/components/student/student.component.scss',
    language: 'scss',
    content: `.student-dashboard {
  .welcome-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    border-radius: 8px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    margin-bottom: 24px;

    .user-profile {
      display: flex;
      align-items: center;

      .avatar { font-size: 2.5rem; margin-right: 15px; }

      h2 { margin: 0; font-size: 1.35rem; color: #1e293b; }
      p { margin: 6px 0 0; color: #475569; font-size: 0.9rem; }
      .email { color: #64748b; font-size: 0.8rem; }
    }
  }

  .grades-box {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 30px;

    h3 { margin: 0 0 6px; color: #1e293b; }
    .desc { margin: 0 0 30px; color: #64748b; font-size: 0.85rem; }

    .subjects-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;

      .subject-card {
        background: #f8fafc;
        border-radius: 8px;
        padding: 24px;
        border: 1px solid #cbd5e1;
        text-align: center;

        .icon { font-size: 2rem; display: block; margin-bottom: 10px; }
        h4 { margin: 0 0 10px; color: #334155; font-size: 1rem; }
        .grade-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1e293b;

          &.empty { color: #94a3b8; font-size: 1.1rem; }
        }
      }
    }

    .summary-box {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .gpa-container {
        display: flex;
        align-items: center;
        gap: 12px;

        .label { font-size: 1.05rem; font-weight: 600; color: #334155; }
        .value {
          font-size: 1.5rem;
          font-weight: 700;
          &.pass { color: #16a34a; }
          &.fail { color: #dc2626; }
        }
      }

      .academic-evaluation {
        font-size: 1rem;
        color: #475569;

        strong {
          margin-left: 6px;
          &.excellent { color: #c084fc; }
          &.good { color: #3b82f6; }
          &.average { color: #eab308; }
          &.failed { color: #ef4444; }
        }
      }
    }
  }
}`
  }
];
