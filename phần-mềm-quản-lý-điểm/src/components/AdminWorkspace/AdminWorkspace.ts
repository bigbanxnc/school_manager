import React, { useState, useEffect, useRef } from 'react';
import { Member, SubjectGrades, StudentGradeRecord, ClassItem } from '../../types';
import { calculateGpa, handleExportCsv } from '../../utils';

interface AdminWorkspaceProps {
  currentUser: Member;
  classes: ClassItem[];
  setClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  gradesMap: { [studentId: string]: SubjectGrades };
  setGradesMap: React.Dispatch<React.SetStateAction<{ [studentId: string]: SubjectGrades }>>;
}

const h = React.createElement;

export default function AdminWorkspace({
  currentUser,
  classes,
  setClasses,
  members,
  setMembers,
  gradesMap,
  setGradesMap
}: AdminWorkspaceProps) {
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'teachers' | 'students_grades' | 'classes' | 'members'>('members');
  const [adminSearchInput, setAdminSearchInput] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);

  const [teachersPage, setTeachersPage] = useState(1);
  const [studentsGradesPage, setStudentsGradesPage] = useState(1);
  const [membersPage, setMembersPage] = useState(1);
  const [classDetailsPage, setClassDetailsPage] = useState(1);

  const [paginatedTeachers, setPaginatedTeachers] = useState<Member[]>([]);
  const [totalTeachers, setTotalTeachers] = useState(0);

  const [paginatedMembers, setPaginatedMembers] = useState<Member[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);

  const [paginatedStudentGrades, setPaginatedStudentGrades] = useState<StudentGradeRecord[]>([]);
  const [totalStudentsGrades, setTotalStudentsGrades] = useState(0);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setTeachersPage(1);
    setStudentsGradesPage(1);
    setMembersPage(1);
    setClassDetailsPage(1);
  }, [adminSearchQuery, adminActiveSubTab, viewingClassId]);

  useEffect(() => {
    async function loadAllInitialData() {
      try {
        console.log('[API Network Load] Admin khởi tạo: Đang tải danh sách đầy đủ tất cả thành viên và lớp học để tính toán thống kê...');
        const [resClasses, resMembers] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/members')
        ]);
        if (resClasses.ok) {
          const classesData = await resClasses.json();
          setClasses(classesData);
        }
        if (resMembers.ok) {
          const membersData = await resMembers.json();
          if (Array.isArray(membersData)) {
            setMembers(membersData);
            console.log('[API Network Success] Tải đầy đủ danh sách thành viên và lớp học thành công.');
          }
        }
      } catch (err) {
        console.warn('[API Network Error] Lỗi tải dữ liệu khởi tạo:', err);
      }
    }
    loadAllInitialData();
  }, [refreshTrigger, setClasses, setMembers]);

  const isFirstMount = useRef(true);

  useEffect(() => {
    async function refreshSubTabData() {
      try {
        const PAGE_SIZE = 10;
        if (adminActiveSubTab === 'teachers') {
          console.log(`[API Network Load] Admin truy cập tab Quản Lý Giáo Viên. Đang tải lại danh sách giáo viên từ server (Trang ${teachersPage}, từ khóa: "${adminSearchQuery}")...`);
          const res = await fetch(`/api/teachers?page=${teachersPage}&size=${PAGE_SIZE}&search=${encodeURIComponent(adminSearchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setPaginatedTeachers(data.content || []);
            setTotalTeachers(data.totalElements || 0);
            
            setMembers(prev => {
              const incoming = data.content || [];
              const incomingIds = new Set(incoming.map((m: any) => m.id));
              return [
                ...prev.filter(m => !incomingIds.has(m.id)),
                ...incoming
              ];
            });
            console.log('[API Network Success] Tải danh sách giáo viên thành công.');
          }
        } else if (adminActiveSubTab === 'members') {
          console.log(`[API Network Load] Admin truy cập tab Tất Cả Thành Viên. Đang tải lại danh sách tất cả thành viên từ server (Trang ${membersPage}, từ khóa: "${adminSearchQuery}")...`);
          const res = await fetch(`/api/members?page=${membersPage}&size=${PAGE_SIZE}&search=${encodeURIComponent(adminSearchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setPaginatedMembers(data.content || []);
            setTotalMembers(data.totalElements || 0);
            
            setMembers(prev => {
              const incoming = data.content || [];
              const incomingIds = new Set(incoming.map((m: any) => m.id));
              return [
                ...prev.filter(m => !incomingIds.has(m.id)),
                ...incoming
              ];
            });
            console.log('[API Network Success] Tải danh sách tất cả thành viên thành công.');
          }
        } else if (adminActiveSubTab === 'students_grades') {
          console.log(`[API Network Load] Admin truy cập tab Điểm số. Đang tải lại điểm số (Trang ${studentsGradesPage}, từ khóa: "${adminSearchQuery}")...`);
          const resGrades = await fetch(`/api/grades?page=${studentsGradesPage}&size=${PAGE_SIZE}&search=${encodeURIComponent(adminSearchQuery)}`);
          if (resGrades.ok) {
            const data = await resGrades.json();
            const records: StudentGradeRecord[] = (data.content || []).map((r: any) => ({
              studentId: r.studentId,
              studentName: r.studentName,
              className: r.className,
              email: r.email,
              grades: {
                math: r.math,
                literature: r.literature,
                english: r.english
              },
              gpa: r.gpa
            }));
            
            setPaginatedStudentGrades(records);
            setTotalStudentsGrades(data.totalElements || 0);
            
            const map: { [studentId: string]: SubjectGrades } = {};
            records.forEach(r => {
              map[r.studentId] = r.grades;
            });
            setGradesMap(prev => ({ ...prev, ...map }));
            
            const studentMembers: Member[] = records.map(r => ({
              id: r.studentId,
              name: r.studentName,
              email: r.email,
              password: '123',
              role: 'student',
              className: r.className === 'Chưa xếp lớp' ? '' : r.className
            }));
            setMembers(prev => {
              const incomingIds = new Set(studentMembers.map(m => m.id));
              return [
                ...prev.filter(m => !incomingIds.has(m.id)),
                ...studentMembers
              ];
            });
            console.log('[API Network Success] Tải điểm số thành công.');
          }
        } else if (adminActiveSubTab === 'classes') {
          console.log('[API Network Load] Admin truy cập tab Lớp học. Đang tải lại danh sách lớp...');
          const res = await fetch('/api/classes');
          if (res.ok) {
            const data = await res.json();
            setClasses(data);
            console.log('[API Network Success] Tải danh sách lớp học thành công.');
          }
        }
      } catch (err) {
        console.warn('[API Network Warn] Không thể đồng bộ dữ liệu qua API Network.', err);
      }
    }
    refreshSubTabData();
  }, [adminActiveSubTab, teachersPage, membersPage, studentsGradesPage, adminSearchQuery, refreshTrigger, setMembers, setClasses, setGradesMap]);

  useEffect(() => {
    async function loadClassDetails() {
      if (!viewingClassId) return;
      try {
        console.log(`[API Network Load] Admin truy cập chi tiết lớp ${viewingClassId}. Đang tải lại danh sách thành viên của lớp này từ server...`);
        const res = await fetch(`/api/classes/${viewingClassId}/members`);
        if (res.ok) {
          const classMembers = await res.json();
          setMembers(prev => {
            const incomingIds = new Set(classMembers.map((m: any) => m.id));
            return [
              ...prev.filter(m => !incomingIds.has(m.id)),
              ...classMembers
            ];
          });
          console.log(`[API Network Success] Đã tải danh sách thành viên của lớp ${viewingClassId} thành công từ server.`, classMembers);
        }
      } catch (err) {
        console.warn(`[API Network Warn] Không thể tải chi tiết lớp ${viewingClassId} từ server.`, err);
      }
    }
    loadClassDetails();
  }, [viewingClassId]);

  // Modals state
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Member | null>(null);
  const [teacherForm, setTeacherForm] = useState({ id: '', name: '', email: '', password: '', assignedClasses: [] as string[], subject: 'math' as 'math' | 'literature' | 'english' });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Member | null>(null);
  const [studentForm, setStudentForm] = useState({ id: '', name: '', email: '', password: '', className: '' });

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ studentId: string; studentName: string; grades: SubjectGrades } | null>(null);
  const [gradeForm, setGradeForm] = useState({ math: '' as string | number, literature: '' as string | number, english: '' as string | number });

  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ id: '', name: '' });
  const [classError, setClassError] = useState('');

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<{ type: 'student' | 'teacher'; id: string; name: string } | null>(null);
  const [selectedEnrollClass, setSelectedEnrollClass] = useState('');

  const isQueryMatched = (text: string, q: string) => {
    return text.toLowerCase().includes(q.toLowerCase());
  };

  const matchGradeRecord = (r: StudentGradeRecord, q: string) => {
    const mathStr = r.grades.math !== null ? r.grades.math.toString() : '';
    const litStr = r.grades.literature !== null ? r.grades.literature.toString() : '';
    const engStr = r.grades.english !== null ? r.grades.english.toString() : '';
    const gpaStr = r.gpa !== null ? r.gpa.toString() : '';
    
    return isQueryMatched(r.studentId, q) ||
           isQueryMatched(r.studentName, q) ||
           isQueryMatched(r.email, q) ||
           isQueryMatched(r.className, q) ||
           isQueryMatched(mathStr, q) ||
           isQueryMatched(litStr, q) ||
           isQueryMatched(engStr, q) ||
           isQueryMatched(gpaStr, q);
  };

  const getStudentGradeRecords = (): StudentGradeRecord[] => {
    const students = members.filter(m => m.role === 'student');
    return students.map(s => {
      const grades = gradesMap[s.id] || { math: null, literature: null, english: null };
      return {
        studentId: s.id,
        studentName: s.name,
        className: s.className || 'Chưa xếp lớp',
        email: s.email,
        grades,
        gpa: calculateGpa(grades)
      };
    });
  };

  const PAGE_SIZE = 10;

  const totalTeachersPages = Math.ceil(totalTeachers / PAGE_SIZE) || 1;
  const activeTeachersPage = Math.min(teachersPage, totalTeachersPages);

  const totalStudentsGradesPages = Math.ceil(totalStudentsGrades / PAGE_SIZE) || 1;
  const activeStudentsGradesPage = Math.min(studentsGradesPage, totalStudentsGradesPages);

  const totalMembersPages = Math.ceil(totalMembers / PAGE_SIZE) || 1;
  const activeMembersPage = Math.min(membersPage, totalMembersPages);

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    const buttons = [];
    
    buttons.push(h('button', {
      key: 'prev',
      className: 'btn-pagination prev',
      disabled: currentPage === 1,
      onClick: (e: any) => { e.preventDefault(); onPageChange(currentPage - 1); },
      style: {
        padding: '6px 12px',
        margin: '0 4px',
        borderRadius: '4px',
        border: '1px solid #E5E5DE',
        backgroundColor: currentPage === 1 ? '#F5F5F0' : 'white',
        color: currentPage === 1 ? '#C2C2B8' : '#3D3D38',
        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        fontSize: '0.85rem'
      }
    }, '« Trước'));

    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 7) {
        if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
          if (p === 2 && currentPage > 3) {
            buttons.push(h('span', { key: 'dots-1', style: { margin: '0 4px', color: '#8E8E85' } }, '...'));
          } else if (p === totalPages - 1 && currentPage < totalPages - 2) {
            buttons.push(h('span', { key: 'dots-2', style: { margin: '0 4px', color: '#8E8E85' } }, '...'));
          }
          continue;
        }
      }

      buttons.push(h('button', {
        key: p,
        className: `btn-pagination ${currentPage === p ? 'active' : ''}`,
        onClick: (e: any) => { e.preventDefault(); onPageChange(p); },
        style: {
          padding: '6px 12px',
          margin: '0 4px',
          borderRadius: '4px',
          border: '1px solid #E5E5DE',
          backgroundColor: currentPage === p ? '#5A5A40' : 'white',
          color: currentPage === p ? 'white' : '#3D3D38',
          fontWeight: currentPage === p ? 'bold' : 'normal',
          cursor: 'pointer',
          fontSize: '0.85rem'
        }
      }, p));
    }

    buttons.push(h('button', {
      key: 'next',
      className: 'btn-pagination next',
      disabled: currentPage === totalPages,
      onClick: (e: any) => { e.preventDefault(); onPageChange(currentPage + 1); },
      style: {
        padding: '6px 12px',
        margin: '0 4px',
        borderRadius: '4px',
        border: '1px solid #E5E5DE',
        backgroundColor: currentPage === totalPages ? '#F5F5F0' : 'white',
        color: currentPage === totalPages ? '#C2C2B8' : '#3D3D38',
        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
        fontSize: '0.85rem'
      }
    }, 'Sau »'));

    return h('div', {
      className: 'pagination-controls',
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px 0'
      }
    }, buttons);
  };

  // --- CRUD Actions ---
  const openAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({ id: `GV00${members.filter(m => m.role === 'teacher').length + 1}`, name: '', email: '', password: '123', assignedClasses: [], subject: 'math' });
    setShowTeacherModal(true);
  };

  const openEditTeacher = (t: Member) => {
    setEditingTeacher(t);
    setTeacherForm({ id: t.id, name: t.name, email: t.email, password: t.password, assignedClasses: t.assignedClasses || [], subject: t.subject || 'math' });
    setShowTeacherModal(true);
  };

  const saveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToCheck = teacherForm.email.trim();
    if (!emailToCheck) {
      alert('Vui lòng nhập Email/Gmail!');
      return;
    }
    if (!emailToCheck.toLowerCase().endsWith('edu.com')) {
      alert('Email của giáo viên phải có đuôi edu.com!');
      return;
    }
    const isEmailDuplicate = members.some(m => m.email.toLowerCase() === emailToCheck.toLowerCase() && (!editingTeacher || m.id !== editingTeacher.id));
    if (isEmailDuplicate) {
      alert('Email/Gmail này đã được sử dụng bởi một thành viên khác!');
      return;
    }

    // --- Validation logic: Every class must have at most 1 teacher of each subject ---
    const updatedTeacherObj: Member = { ...teacherForm, role: 'teacher' };
    const hypotheticalMembers = members.map(m => {
      if (editingTeacher && m.id === editingTeacher.id) {
        return updatedTeacherObj;
      }
      return m;
    });
    if (!editingTeacher) {
      hypotheticalMembers.push(updatedTeacherObj);
    }

    const duplicateErrors: string[] = [];
    const teachersList = hypotheticalMembers.filter(m => m.role === 'teacher');
    classes.forEach(c => {
      const classTeachers = teachersList.filter(t => t.assignedClasses?.includes(c.id));
      const mathCount = classTeachers.filter(t => t.subject === 'math').length;
      const litCount = classTeachers.filter(t => t.subject === 'literature').length;
      const engCount = classTeachers.filter(t => t.subject === 'english').length;

      if (mathCount > 1) {
        duplicateErrors.push(`Lớp ${c.id} đã có giáo viên dạy môn Toán!`);
      }
      if (litCount > 1) {
        duplicateErrors.push(`Lớp ${c.id} đã có giáo viên dạy môn Văn!`);
      }
      if (engCount > 1) {
        duplicateErrors.push(`Lớp ${c.id} đã có giáo viên dạy môn Tiếng Anh!`);
      }
    });

    if (duplicateErrors.length > 0) {
      alert('Không thể lưu phân công:\n' + duplicateErrors.join('\n'));
      return;
    }

    const incompleteClasses: string[] = [];
    classes.forEach(c => {
      const classTeachers = teachersList.filter(t => t.assignedClasses?.includes(c.id));
      const mathCount = classTeachers.filter(t => t.subject === 'math').length;
      const litCount = classTeachers.filter(t => t.subject === 'literature').length;
      const engCount = classTeachers.filter(t => t.subject === 'english').length;

      if (mathCount === 0 || litCount === 0 || engCount === 0) {
        incompleteClasses.push(c.id);
      }
    });

    if (incompleteClasses.length > 0) {
      const proceed = window.confirm(
        `Lưu ý: Sau khi phân công, các lớp [${incompleteClasses.join(', ')}] sẽ tạm thời chưa đủ 3 giáo viên bộ môn.\nBạn có chắc chắn muốn tiếp tục lưu không?`
      );
      if (!proceed) return;
    }

    try {
      const endpoint = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';
      console.log(`[API Network Call] ${method} ${endpoint}`, teacherForm);
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm)
      });
      if (res.ok) {
        console.log('[API Network Success] Đã lưu thông tin giáo viên lên hệ thống server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đang chạy offline hoặc lỗi server. Đồng bộ LocalState.', err);
    }

    if (editingTeacher) {
      setMembers(prev => prev.map(m => m.id === editingTeacher.id ? { ...m, ...teacherForm } : m));
    } else {
      if (members.some(m => m.id === teacherForm.id)) {
        alert('Mã giáo viên này đã tồn tại!');
        return;
      }
      const newTeacher: Member = { ...teacherForm, role: 'teacher' };
      setMembers(prev => [...prev, newTeacher]);
    }
    setShowTeacherModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const deleteTeacher = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giáo viên này không?')) {
      try {
        console.log(`[API Network Call] DELETE /api/teachers/${id}`);
        const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
        if (res.ok) {
          console.log('[API Network Success] Đã xóa giáo viên trên server.');
        }
      } catch (err) {
        console.warn('[API Network Simulated fallback] Đồng bộ LocalState sau khi gọi API thất bại.', err);
      }
      setMembers(prev => prev.filter(m => m.id !== id));
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const openAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({ id: `HS00${members.filter(m => m.role === 'student').length + 1}`, name: '', email: '', password: '123', className: classes[0]?.id || '' });
    setShowStudentModal(true);
  };

  const openEditStudent = (s: Member) => {
    setEditingStudent(s);
    setStudentForm({ id: s.id, name: s.name, email: s.email, password: s.password, className: s.className || '' });
    setShowStudentModal(true);
  };

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToCheck = studentForm.email.trim();
    if (!emailToCheck) {
      alert('Vui lòng nhập Email/Gmail!');
      return;
    }
    if (!emailToCheck.toLowerCase().endsWith('@gmail.com')) {
      alert('Email của học sinh phải có đuôi @gmail.com!');
      return;
    }
    const isEmailDuplicate = members.some(m => m.email.toLowerCase() === emailToCheck.toLowerCase() && (!editingStudent || m.id !== editingStudent.id));
    if (isEmailDuplicate) {
      alert('Email/Gmail này đã được sử dụng bởi một thành viên khác!');
      return;
    }

    try {
      const endpoint = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      console.log(`[API Network Call] ${method} ${endpoint}`, studentForm);
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm)
      });
      if (res.ok) {
        console.log('[API Network Success] Đã lưu thông tin học sinh lên hệ thống server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đang chạy offline hoặc lỗi server. Đồng bộ LocalState.', err);
    }

    if (editingStudent) {
      setMembers(prev => prev.map(m => m.id === editingStudent.id ? { ...m, ...studentForm } : m));
    } else {
      if (members.some(m => m.id === studentForm.id)) {
        alert('Mã học sinh này đã tồn tại!');
        return;
      }
      const newStudent: Member = { ...studentForm, role: 'student' };
      setMembers(prev => [...prev, newStudent]);
      setGradesMap(prev => ({ ...prev, [studentForm.id]: { math: null, literature: null, english: null } }));
    }
    setShowStudentModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const deleteStudent = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học sinh này và mọi dữ liệu điểm số liên quan không?')) {
      try {
        console.log(`[API Network Call] DELETE /api/students/${id}`);
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        if (res.ok) {
          console.log('[API Network Success] Đã xóa học sinh trên server.');
        }
      } catch (err) {
        console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
      }
      setMembers(prev => prev.filter(m => m.id !== id));
      setGradesMap(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const openEditGrade = (studentId: string, studentName: string, grades: SubjectGrades) => {
    setEditingGrade({ studentId, studentName, grades });
    setGradeForm({
      math: grades.math !== null ? grades.math : '',
      literature: grades.literature !== null ? grades.literature : '',
      english: grades.english !== null ? grades.english : ''
    });
    setShowGradeModal(true);
  };

  const saveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;
    const mathVal = gradeForm.math === '' ? null : parseFloat(gradeForm.math.toString());
    const litVal = gradeForm.literature === '' ? null : parseFloat(gradeForm.literature.toString());
    const engVal = gradeForm.english === '' ? null : parseFloat(gradeForm.english.toString());

    try {
      console.log(`[API Network Call] PUT /api/grades/${editingGrade.studentId}`, { math: mathVal, literature: litVal, english: engVal });
      const res = await fetch(`/api/grades/${editingGrade.studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ math: mathVal, literature: litVal, english: engVal })
      });
      if (res.ok) {
        console.log('[API Network Success] Đã lưu điểm số học sinh trên server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
    }

    setGradesMap(prev => ({
      ...prev,
      [editingGrade.studentId]: { math: mathVal, literature: litVal, english: engVal }
    }));
    setShowGradeModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const clearGrade = async (studentId: string) => {
    if (window.confirm('Bạn muốn xóa điểm số tất cả môn học của học sinh này về trạng thái "Chưa có"?')) {
      try {
        console.log(`[API Network Call] DELETE /api/grades/${studentId}`);
        const res = await fetch(`/api/grades/${studentId}`, { method: 'DELETE' });
        if (res.ok) {
          console.log('[API Network Success] Đã xóa điểm số học sinh trên server.');
        }
      } catch (err) {
        console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
      }
      setGradesMap(prev => ({
        ...prev,
        [studentId]: { math: null, literature: null, english: null }
      }));
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const saveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError('');
    const formattedId = classForm.id.trim().toUpperCase();
    if (!formattedId || !classForm.name.trim()) {
      setClassError('Vui lòng nhập đầy đủ mã lớp và tên lớp.');
      return;
    }
    if (classes.some(c => c.id === formattedId)) {
      setClassError('Mã lớp này đã tồn tại trong hệ thống.');
      return;
    }

    try {
      console.log(`[API Network Call] POST /api/classes`, { id: formattedId, name: classForm.name.trim() });
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formattedId, name: classForm.name.trim() })
      });
      if (res.ok) {
        console.log('[API Network Success] Đã đăng ký lớp mới thành công trên server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
    }

    setClasses(prev => [...prev, { id: formattedId, name: classForm.name.trim() }]);
    setShowClassModal(false);
    setClassForm({ id: '', name: '' });
  };

  const deleteClass = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa lớp ${id} (${name}) không?\nTất cả học sinh và giáo viên thuộc lớp này sẽ được gỡ khỏi lớp.`)) {
      try {
        console.log(`[API Network Call] DELETE /api/classes/${id}`);
        const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          console.log('[API Network Success] Đã xóa lớp thành công trên server.');
        }
      } catch (err) {
        console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
      }

      setClasses(prev => prev.filter(c => c.id !== id));
      setMembers(prev => prev.map(m => {
        if (m.role === 'student' && m.className === id) {
          return { ...m, className: '' };
        }
        if (m.role === 'teacher' && m.assignedClasses) {
          return { ...m, assignedClasses: m.assignedClasses.filter((c: string) => c !== id) };
        }
        return m;
      }));
    }
  };

  const openEnroll = (type: 'student' | 'teacher', id: string, name: string) => {
    setEnrollTarget({ type, id, name });
    const targetMember = members.find(m => m.id === id);
    setSelectedEnrollClass(type === 'student' ? (targetMember?.className || '') : '');
    setShowEnrollModal(true);
  };

  const saveEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollTarget || !selectedEnrollClass) return;

    if (enrollTarget.type === 'teacher') {
      const teacherObj = members.find(m => m.id === enrollTarget.id);
      if (teacherObj) {
        const subject = teacherObj.subject;
        const currentClassTeachersOfSubject = members.filter(
          m => m.role === 'teacher' && m.subject === subject && m.assignedClasses?.includes(selectedEnrollClass)
        );
        if (currentClassTeachersOfSubject.length > 0) {
          const subjectLabel = subject === 'math' ? 'Toán Học' : subject === 'literature' ? 'Ngữ Văn' : 'Tiếng Anh';
          alert(`Không thể đăng ký: Lớp ${selectedEnrollClass} đã có giáo viên dạy môn ${subjectLabel} (${currentClassTeachersOfSubject[0].name})!`);
          return;
        }
      }
    }

    try {
      const endpoint = `/api/enroll/${enrollTarget.type}`;
      console.log(`[API Network Call] POST ${endpoint}`, { id: enrollTarget.id, className: selectedEnrollClass });
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: enrollTarget.id, className: selectedEnrollClass })
      });
      if (res.ok) {
        console.log('[API Network Success] Đã cập nhật ghi danh lớp học trên server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
    }

    if (enrollTarget.type === 'student') {
      setMembers(prev => prev.map(m => m.id === enrollTarget.id ? { ...m, className: selectedEnrollClass } : m));
    } else {
      setMembers(prev => prev.map(m => {
        if (m.id === enrollTarget.id) {
          const currentAssigned = m.assignedClasses || [];
          if (!currentAssigned.includes(selectedEnrollClass)) {
            return { ...m, assignedClasses: [...currentAssigned, selectedEnrollClass] };
          }
        }
        return m;
      }));
    }
    setShowEnrollModal(false);
    setEnrollTarget(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const unenrollTeacherClass = async (teacherId: string, className: string) => {
    if (window.confirm(`Bạn muốn hủy phụ trách lớp ${className} cho giáo viên này?`)) {
      try {
        console.log(`[API Network Call] POST /api/unenroll/teacher`, { id: teacherId, className });
        const res = await fetch('/api/unenroll/teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: teacherId, className })
        });
        if (res.ok) {
          console.log('[API Network Success] Đã hủy phụ trách lớp trên server.');
        }
      } catch (err) {
        console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
      }
      setMembers(prev => prev.map(m => {
        if (m.id === teacherId) {
          return { ...m, assignedClasses: (m.assignedClasses || []).filter(c => c !== className) };
        }
        return m;
      }));
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Check assignments status for warning banners
  const getAssignmentWarnings = () => {
    const warnings: string[] = [];
    const teachersList = members.filter(m => m.role === 'teacher');
    
    classes.forEach(c => {
      const classTeachers = teachersList.filter(t => t.assignedClasses?.includes(c.id));
      const mathTeachers = classTeachers.filter(t => t.subject === 'math');
      const litTeachers = classTeachers.filter(t => t.subject === 'literature');
      const engTeachers = classTeachers.filter(t => t.subject === 'english');
      
      const missing: string[] = [];
      if (mathTeachers.length === 0) missing.push('Toán');
      if (litTeachers.length === 0) missing.push('Văn');
      if (engTeachers.length === 0) missing.push('Anh');
      
      const duplicates: string[] = [];
      if (mathTeachers.length > 1) duplicates.push(`Toán (${mathTeachers.length} GV)`);
      if (litTeachers.length > 1) duplicates.push(`Văn (${litTeachers.length} GV)`);
      if (engTeachers.length > 1) duplicates.push(`Anh (${engTeachers.length} GV)`);

      if (missing.length > 0 || duplicates.length > 0) {
        let msg = `Lớp ${c.id}: `;
        if (duplicates.length > 0) {
          msg += `Thừa ${duplicates.join(', ')}`;
        }
        if (missing.length > 0) {
          if (duplicates.length > 0) msg += '; ';
          msg += `Thiếu ${missing.join(', ')}`;
        }
        warnings.push(msg);
      }
    });
    return warnings;
  };

  const assignmentWarnings = getAssignmentWarnings();

  return h(React.Fragment, null,
    h('aside', { className: 'dashboard-sidebar', id: 'admin_sidebar_menu' },
      h('div', { className: 'sidebar-section' },
        h('div', { className: 'sidebar-section-title' }, 'Phân hệ Quản trị'),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'members' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('members'),
          id: 'admin_menu_members'
        }, '👥 Tất Cả Thành Viên'),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'classes' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('classes'),
          id: 'admin_menu_classes'
        }, '📚 Quản Lý Lớp Học'),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'teachers' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('teachers'),
          id: 'admin_menu_teachers'
        }, '💼 Quản Lý Giáo Viên'),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'students_grades' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('students_grades'),
          id: 'admin_menu_students_grades'
        }, '📊 Quản Lý Điểm Số')
      ),
      h('div', { className: 'sidebar-section' },
        h('div', { className: 'sidebar-section-title' }, 'Tiện ích'),
        h('button', {
          className: 'sidebar-btn',
          onClick: () => handleExportCsv('bang_diem_toan_truong.csv', getStudentGradeRecords()),
          id: 'admin_menu_export'
        }, '📥 Xuất CSV Bảng Điểm')
      )
    ),

    h('main', { className: 'workspace-content', id: 'admin_workspace_content' },
      h('div', { className: 'workspace-header' },
        h('div', null,
          h('h1', null, 'Hệ Thống Quản Trị Hệ Thống'),
          h('p', { style: { color: '#8E8E85', fontSize: '0.85rem', marginTop: '4px', fontFamily: 'sans-serif' } },
            'Chào mừng, ', h('strong', null, currentUser.name), '. Bạn đang kiểm soát toàn quyền điểm số học sinh, giáo viên và lớp học.'
          )
        ),
        h('div', { className: 'header-actions' },
          adminActiveSubTab === 'teachers' ? h('button', {
            className: 'btn btn-primary',
            onClick: openAddTeacher,
            id: 'admin_btn_add_teacher'
          }, '+ Thêm Giáo Viên Mới') : null,
          adminActiveSubTab === 'students_grades' ? h('button', {
            className: 'btn btn-primary',
            onClick: openAddStudent,
            id: 'admin_btn_add_student'
          }, '+ Thêm Học Sinh Mới') : null,
          adminActiveSubTab === 'classes' ? h('button', {
            className: 'btn btn-primary',
            onClick: () => setShowClassModal(true),
            id: 'admin_btn_add_class'
          }, '+ Đăng Ký Lớp Mới') : null,
          h('button', {
            className: 'btn btn-success',
            onClick: () => handleExportCsv('bang_diem_toan_truong.csv', getStudentGradeRecords()),
            id: 'admin_btn_export_csv'
          }, '📥 Xuất Toàn Bộ Điểm (CSV)')
        )
      ),

      h('div', { className: 'search-filter-strip', style: { display: 'flex', gap: '10px', alignItems: 'center' } },
        h('div', { className: 'search-wrapper', style: { flex: 1 } },
          h('span', { className: 'search-icon' }, '🔍'),
          h('input', {
            type: 'text',
            placeholder: 'Tìm kiếm không dấu/có dấu: mã số, tên, gmail, điểm số...',
            value: adminSearchInput,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAdminSearchInput(e.target.value),
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && adminSearchInput.trim() !== '') {
                setAdminSearchQuery(adminSearchInput.trim());
              }
            },
            id: 'admin_search_input'
          })
        ),
        h('button', {
          className: 'btn btn-primary',
          disabled: adminSearchInput.trim() === '',
          onClick: () => {
            if (adminSearchInput.trim() !== '') {
              setAdminSearchQuery(adminSearchInput.trim());
            }
          },
          style: { opacity: adminSearchInput.trim() === '' ? 0.6 : 1, cursor: adminSearchInput.trim() === '' ? 'not-allowed' : 'pointer' }
        }, 'Tìm kiếm 🔍'),
        adminSearchQuery ? h('button', {
          className: 'btn btn-secondary btn-sm',
          onClick: () => {
            setAdminSearchInput('');
            setAdminSearchQuery('');
          }
        }, 'Xóa lọc ✕') : null
      ),

      adminActiveSubTab === 'teachers' && assignmentWarnings.length > 0 ? h('div', {
        style: {
          backgroundColor: '#FFF5F5',
          border: '1px solid #FFD1D1',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          color: '#C62828',
          fontSize: '0.875rem',
          fontFamily: 'sans-serif',
          lineHeight: '1.5',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }
      },
        h('strong', { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', marginBottom: '8px', color: '#D32F2F' } }, '⚠️ CẢNH BÁO PHÂN CÔNG GIÁO VIÊN CHƯA HỢP LỆ (Yêu cầu đúng 1 Toán, 1 Văn, 1 Anh cho mỗi lớp):'),
        h('ul', { style: { margin: 0, paddingLeft: '20px' } },
          assignmentWarnings.map((w, index) => h('li', { key: index, style: { marginBottom: '4px' } }, w))
        )
      ) : null,

      adminActiveSubTab === 'teachers' ? h('div', { className: 'data-table-container', id: 'admin_table_teachers_container' },
        h('table', { className: 'data-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, 'Mã Giáo Viên'),
              h('th', null, 'Họ và Tên'),
              h('th', null, 'Môn Giảng Dạy'),
              h('th', null, 'Gmail / Email'),
              h('th', null, 'Mật Khẩu'),
              h('th', null, 'Danh Sách Lớp Giảng Dạy'),
              h('th', null, 'Hành Động Phân Lớp'),
              h('th', { style: { textAlign: 'right' } }, 'Thao Tác')
            )
          ),
          h('tbody', null,
            paginatedTeachers.length === 0 ? h('tr', null,
              h('td', { colSpan: 8, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } },
                'Không tìm thấy giáo viên nào trùng khớp từ khóa tìm kiếm.'
              )
            ) : paginatedTeachers.map(t =>
              h('tr', { key: t.id },
                h('td', null, h('span', { className: 'strong-id' }, t.id)),
                h('td', null, h('strong', null, t.name)),
                h('td', null,
                  t.subject === 'math' ? h('span', { style: { fontWeight: '600', color: '#4E6C50' } }, 'Toán Học') :
                  t.subject === 'literature' ? h('span', { style: { fontWeight: '600', color: '#B38B59' } }, 'Ngữ Văn') :
                  t.subject === 'english' ? h('span', { style: { fontWeight: '600', color: '#5B8FB9' } }, 'Tiếng Anh') :
                  h('span', { style: { fontStyle: 'italic', color: '#8E8E85' } }, 'Chưa phân môn')
                ),
                h('td', null, t.email),
                h('td', null, h('code', null, t.password)),
                h('td', null,
                  h('div', { className: 'badge-container' },
                    t.assignedClasses && t.assignedClasses.length > 0 ? t.assignedClasses.map(c =>
                      h('span', { key: c, className: 'badge-class' },
                        c,
                        h('button', {
                          className: 'btn-remove-badge',
                          title: 'Hủy lớp này',
                          onClick: () => unenrollTeacherClass(t.id, c)
                        }, '×')
                      )
                    ) : h('span', { style: { color: '#8E8E85', fontSize: '0.8rem', fontStyle: 'italic' } }, 'Chưa dạy lớp nào')
                  )
                ),
                h('td', null,
                  h('button', {
                    className: 'btn btn-secondary btn-sm',
                    onClick: () => openEnroll('teacher', t.id, t.name)
                  }, '+ Phân lớp dạy')
                ),
                h('td', null,
                  h('div', { className: 'action-btn-group' },
                    h('button', { className: 'icon-action-btn edit', onClick: () => openEditTeacher(t), title: 'Sửa thông tin' }, '✏️'),
                    h('button', { className: 'icon-action-btn delete', onClick: () => deleteTeacher(t.id), title: 'Xóa tài khoản' }, '🗑️')
                  )
                )
              )
            )
          )
        ),
        h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px' } },
          h('div', null, `Hiển thị ${Math.min(totalTeachers, (activeTeachersPage - 1) * PAGE_SIZE + 1)}-${Math.min(totalTeachers, activeTeachersPage * PAGE_SIZE)} trên tổng số ${totalTeachers} giáo viên phù hợp`),
          renderPagination(activeTeachersPage, totalTeachersPages, setTeachersPage)
        )
      ) : null,

      adminActiveSubTab === 'students_grades' ? h('div', { className: 'data-table-container', id: 'admin_table_students_container' },
        h('table', { className: 'data-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, 'Mã Học Sinh'),
              h('th', null, 'Họ và Tên'),
              h('th', null, 'Học Lớp'),
              h('th', null, 'Email / Gmail'),
              h('th', null, 'Điểm Toán'),
              h('th', null, 'Điểm Văn'),
              h('th', null, 'Điểm Anh'),
              h('th', { style: { backgroundColor: '#E5E5DE', textAlign: 'center' } }, 'Trung Bình (GPA)'),
              h('th', { style: { textAlign: 'right' } }, 'Thao Tác')
            )
          ),
          h('tbody', null,
            paginatedStudentGrades.length === 0 ? h('tr', null,
              h('td', { colSpan: 9, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } },
                'Không tìm thấy học sinh hoặc điểm số nào phù hợp từ khóa tìm kiếm.'
              )
            ) : paginatedStudentGrades.map(r =>
              h('tr', { key: r.studentId },
                h('td', null, h('span', { className: 'strong-id' }, r.studentId)),
                h('td', null, h('strong', null, r.studentName)),
                h('td', null,
                  h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, r.className)
                ),
                h('td', null, r.email),
                h('td', { className: r.grades.math === null ? 'not-graded' : '' },
                  r.grades.math !== null ? r.grades.math : 'Chưa nhập'
                ),
                h('td', { className: r.grades.literature === null ? 'not-graded' : '' },
                  r.grades.literature !== null ? r.grades.literature : 'Chưa nhập'
                ),
                h('td', { className: r.grades.english === null ? 'not-graded' : '' },
                  r.grades.english !== null ? r.grades.english : 'Chưa nhập'
                ),
                h('td', { className: 'gpa-cell' },
                  h('strong', { style: { color: r.gpa && r.gpa >= 5 ? '#4E6C50' : '#AA5656' } },
                    r.gpa !== null ? r.gpa : 'N/A'
                  )
                ),
                h('td', null,
                  h('div', { className: 'action-btn-group' },
                    h('button', { className: 'icon-action-btn grade', onClick: () => openEditGrade(r.studentId, r.studentName, r.grades), title: 'Nhập / Sửa Điểm' }, '💯'),
                    h('button', {
                      className: 'icon-action-btn edit',
                      onClick: () => {
                        const s = members.find(m => m.id === r.studentId);
                        if (s) openEditStudent(s);
                      },
                      title: 'Sửa học sinh'
                    }, '✏️'),
                    h('button', { className: 'icon-action-btn delete', onClick: () => deleteStudent(r.studentId), title: 'Xóa học sinh & điểm' }, '🗑️'),
                    h('button', { className: 'icon-action-btn', onClick: () => clearGrade(r.studentId), title: 'Xóa trắng điểm' }, '🔄')
                  )
                )
              )
            )
          )
        ),
        h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px' } },
          h('div', null, `Hiển thị ${Math.min(totalStudentsGrades, (activeStudentsGradesPage - 1) * PAGE_SIZE + 1)}-${Math.min(totalStudentsGrades, activeStudentsGradesPage * PAGE_SIZE)} trên tổng số ${totalStudentsGrades} học sinh phù hợp`),
          renderPagination(activeStudentsGradesPage, totalStudentsGradesPages, setStudentsGradesPage)
        )
      ) : null,

      adminActiveSubTab === 'classes' ? h('div', { className: 'class-grid', id: 'admin_classes_grid' },
        classes.map(c => {
          const studentCount = members.filter(m => m.role === 'student' && m.className === c.id).length;
          const teacherCount = members.filter(m => m.role === 'teacher' && m.assignedClasses?.includes(c.id)).length;
          return h('div', {
            className: 'class-card',
            key: c.id,
            onClick: () => setViewingClassId(c.id),
            style: { cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }
          },
            h('button', {
              className: 'icon-action-btn delete',
              style: {
                position: 'absolute',
                top: '12px',
                right: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '1.1rem',
                opacity: 0.7,
                padding: '4px',
                zIndex: 10
              },
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                deleteClass(c.id, c.name);
              },
              title: 'Xóa lớp học'
            }, '🗑️'),
            h('div', { className: 'class-icon' }, '📚'),
            h('div', { className: 'class-info' },
              h('h4', null, `Lớp ${c.id}`),
              h('p', null, c.name),
              h('p', { style: { marginTop: '4px', fontSize: '0.75rem', color: '#5A5A40' } },
                `👤 ${studentCount} Học sinh | 💼 ${teacherCount} Giáo viên dạy`
              )
            )
          );
        }),
        h('div', {
          className: 'class-card',
          style: { borderStyle: 'dashed', backgroundColor: 'transparent', cursor: 'pointer', justifyContent: 'center' },
          onClick: () => setShowClassModal(true)
        },
          h('div', { style: { textAlign: 'center', padding: '10px' } },
            h('span', { style: { fontSize: '1.5rem', color: '#5A5A40' } }, '+'),
            h('p', { style: { fontWeight: 'bold', color: '#5A5A40' } }, 'Đăng Ký Lớp Mới')
          )
        )
      ) : null,

      adminActiveSubTab === 'members' ? h('div', { className: 'data-table-container', id: 'admin_table_members_container' },
        h('table', { className: 'data-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, 'Mã Thành Viên'),
              h('th', null, 'Họ và Tên'),
              h('th', null, 'Vai Trò Hệ Thống'),
              h('th', null, 'Gmail Đăng Nhập'),
              h('th', null, 'Mật Khẩu Gốc'),
              h('th', null, 'Lớp / Khóa Học')
            )
          ),
          h('tbody', null,
            paginatedMembers.map(m =>
              h('tr', { key: m.id },
                h('td', null, h('span', { className: 'strong-id' }, m.id)),
                h('td', null, h('strong', null, m.name)),
                h('td', null,
                  h('span', { className: `badge-role ${m.role}` },
                    m.role === 'admin' ? 'Quản Trị' : m.role === 'teacher' ? 'Giáo Viên' : 'Học Sinh'
                  )
                ),
                h('td', null, m.email),
                h('td', null, h('code', null, m.password)),
                h('td', null,
                  m.role === 'student' ?
                    h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, m.className || 'Chưa xếp') :
                    m.role === 'teacher' ?
                      h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, (m.assignedClasses || []).join(', ') || 'Chưa xếp') :
                      h('span', { style: { color: '#8E8E85' } }, 'Toàn trường')
                )
              )
            )
          )
        ),
        h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px' } },
          h('div', null, `Hiển thị ${Math.min(totalMembers, (activeMembersPage - 1) * PAGE_SIZE + 1)}-${Math.min(totalMembers, activeMembersPage * PAGE_SIZE)} trên tổng số ${totalMembers} thành viên phù hợp`),
          renderPagination(activeMembersPage, totalMembersPages, setMembersPage)
        )
      ) : null
    ),

    // Modals Viewports
    showTeacherModal ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, editingTeacher ? 'Cập Nhật Tài Khoản Giáo Viên' : 'Đăng Ký Giáo Viên Mới'),
          h('button', { className: 'btn-close-modal', onClick: () => setShowTeacherModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveTeacher },
          h('div', { className: 'modal-body' },
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Mã Giáo Viên (ID)'),
              h('input', {
                type: 'text',
                value: teacherForm.id,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherForm(prev => ({ ...prev, id: e.target.value.toUpperCase() })),
                disabled: !!editingTeacher,
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Họ và Tên Giáo Viên'),
              h('input', {
                type: 'text',
                value: teacherForm.name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherForm(prev => ({ ...prev, name: e.target.value })),
                placeholder: 'Ví dụ: Nguyễn Văn Toán',
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Gmail Đăng Nhập'),
              h('input', {
                type: 'email',
                value: teacherForm.email,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherForm(prev => ({ ...prev, email: e.target.value })),
                placeholder: 'vi_du@gmail.com',
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Mật Khẩu'),
              h('input', {
                type: 'text',
                value: teacherForm.password,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherForm(prev => ({ ...prev, password: e.target.value })),
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Môn Giảng Dạy'),
              h('select', {
                value: teacherForm.subject,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTeacherForm(prev => ({ ...prev, subject: e.target.value as any })),
                required: true
              },
                h('option', { value: 'math' }, 'Môn Toán học'),
                h('option', { value: 'literature' }, 'Môn Ngữ Văn'),
                h('option', { value: 'english' }, 'Tiếng Anh')
              )
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Phân công lớp dạy học'),
              h('div', { className: 'checkbox-grid' },
                classes.map(c => {
                  const isChecked = teacherForm.assignedClasses.includes(c.id);
                  return h('label', { key: c.id },
                    h('input', {
                      type: 'checkbox',
                      checked: isChecked,
                      onChange: () => {
                        const updated = isChecked
                          ? teacherForm.assignedClasses.filter(x => x !== c.id)
                          : [...teacherForm.assignedClasses, c.id];
                        setTeacherForm(prev => ({ ...prev, assignedClasses: updated }));
                      }
                    }),
                    ` Lớp ${c.id} (${c.name})`
                  );
                })
              )
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowTeacherModal(false) }, 'Hủy'),
            h('button', { type: 'submit', className: 'btn btn-primary' }, 'Xác Nhận Lưu')
          )
        )
      )
    ) : null,

    showStudentModal ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, editingStudent ? 'Cập Nhật Tài Khoản Học Sinh' : 'Đăng Ký Học Sinh Mới'),
          h('button', { className: 'btn-close-modal', onClick: () => setShowStudentModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveStudent },
          h('div', { className: 'modal-body' },
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Mã Học Sinh (ID)'),
              h('input', {
                type: 'text',
                value: studentForm.id,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setStudentForm(prev => ({ ...prev, id: e.target.value.toUpperCase() })),
                disabled: !!editingStudent,
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Họ và Tên Học Sinh'),
              h('input', {
                type: 'text',
                value: studentForm.name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setStudentForm(prev => ({ ...prev, name: e.target.value })),
                placeholder: 'Ví dụ: Lê Hoàng Nam',
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Gmail Đăng Nhập'),
              h('input', {
                type: 'email',
                value: studentForm.email,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setStudentForm(prev => ({ ...prev, email: e.target.value })),
                placeholder: 'nam@gmail.com',
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Mật Khẩu'),
              h('input', {
                type: 'text',
                value: studentForm.password,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setStudentForm(prev => ({ ...prev, password: e.target.value })),
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Xếp Vào Lớp'),
              h('select', {
                value: studentForm.className,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setStudentForm(prev => ({ ...prev, className: e.target.value })),
                required: true
              },
                h('option', { value: '' }, '-- Chọn Lớp Học --'),
                classes.map(c => h('option', { key: c.id, value: c.id }, `Lớp ${c.id} (${c.name})`))
              )
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowStudentModal(false) }, 'Hủy'),
            h('button', { type: 'submit', className: 'btn btn-primary' }, 'Xác Nhận Lưu')
          )
        )
      )
    ) : null,

    showGradeModal && editingGrade ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, `Nhập & Sửa Điểm: ${editingGrade.studentName}`),
          h('button', { className: 'btn-close-modal', onClick: () => setShowGradeModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveGrade },
          h('div', { className: 'modal-body' },
            h('p', { style: { fontSize: '0.8rem', color: '#8E8E85', marginBottom: '16px', fontFamily: 'sans-serif' } },
              'Hệ số điểm từ 0.0 đến 10.0. Để trống ô nhập nếu muốn chuyển điểm về trạng thái "Chưa có".'
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Điểm Toán'),
              h('input', {
                type: 'number',
                step: '0.1',
                min: '0',
                max: '10',
                value: gradeForm.math,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math: e.target.value })),
                placeholder: 'Chưa có điểm'
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Điểm Ngữ Văn'),
              h('input', {
                type: 'number',
                step: '0.1',
                min: '0',
                max: '10',
                value: gradeForm.literature,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature: e.target.value })),
                placeholder: 'Chưa có điểm'
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Điểm Tiếng Anh'),
              h('input', {
                type: 'number',
                step: '0.1',
                min: '0',
                max: '10',
                value: gradeForm.english,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english: e.target.value })),
                placeholder: 'Chưa có điểm'
              })
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowGradeModal(false) }, 'Hủy'),
            h('button', { type: 'submit', className: 'btn btn-primary' }, 'Cập Nhật Điểm')
          )
        )
      )
    ) : null,

    showClassModal ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, 'Đăng Ký Thêm Lớp Mới'),
          h('button', { className: 'btn-close-modal', onClick: () => setShowClassModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveClass },
          h('div', { className: 'modal-body' },
            classError ? h('div', { className: 'error-alert' }, classError) : null,
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Mã Lớp Học (Ví dụ: 12A3, 10C5)'),
              h('input', {
                type: 'text',
                value: classForm.id,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setClassForm(prev => ({ ...prev, id: e.target.value })),
                placeholder: 'Mã viết liền không dấu',
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Tên Lớp Học Chi Tiết'),
              h('input', {
                type: 'text',
                value: classForm.name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setClassForm(prev => ({ ...prev, name: e.target.value })),
                placeholder: 'Ví dụ: Lớp chuyên tự nhiên 12A3',
                required: true
              })
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowClassModal(false) }, 'Hủy'),
            h('button', { type: 'submit', className: 'btn btn-primary' }, 'Đăng Ký Lớp')
          )
        )
      )
    ) : null,

    showEnrollModal && enrollTarget ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, 'Ghi Danh Vào Lớp Học'),
          h('button', { className: 'btn-close-modal', onClick: () => setShowEnrollModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveEnroll },
          h('div', { className: 'modal-body' },
            h('p', { style: { marginBottom: '16px', fontSize: '0.9rem' } },
              'Ghi danh cho ', h('strong', null, enrollTarget.name), ` (${enrollTarget.type === 'student' ? 'Học sinh' : 'Giáo viên'}) vào lớp học sau:`
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, 'Lớp học chỉ định'),
              h('select', {
                value: selectedEnrollClass,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEnrollClass(e.target.value),
                required: true
              },
                h('option', { value: '' }, '-- Chọn Lớp Học --'),
                classes.map(c => h('option', { key: c.id, value: c.id }, `Lớp ${c.id} (${c.name})`))
              )
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowEnrollModal(false) }, 'Hủy'),
            h('button', { type: 'submit', className: 'btn btn-primary' }, 'Xác Nhận Ghi Danh')
          )
        )
      )
    ) : null,

    viewingClassId ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card', style: { maxWidth: '750px', width: '90%' } },
        h('div', { className: 'modal-header' },
          h('h3', null, `Chi Tiết Lớp ${viewingClassId}`),
          h('button', { className: 'btn-close-modal', onClick: () => setViewingClassId(null) }, '✕')
        ),
        h('div', { className: 'modal-body', style: { maxHeight: '70vh', overflowY: 'auto' } },
          h('div', { style: { marginBottom: '20px' } },
            h('h4', { style: { color: '#5A5A40', marginBottom: '8px', borderBottom: '2px solid #E5E5DE', paddingBottom: '4px' } }, '💼 Giáo viên giảng dạy'),
            (() => {
              const classTeachers = members.filter(m => m.role === 'teacher' && m.assignedClasses?.includes(viewingClassId));
              if (classTeachers.length === 0) {
                return h('p', { style: { fontStyle: 'italic', color: '#8E8E85', fontSize: '0.9rem', padding: '10px 0' } }, 'Chưa có giáo viên nào phụ trách giảng dạy lớp này.');
              }
              return h('table', { className: 'data-table', style: { fontSize: '0.9rem' } },
                h('thead', null,
                  h('tr', null,
                    h('th', null, 'Họ và Tên'),
                    h('th', null, 'Môn Giảng Dạy'),
                    h('th', null, 'Email / Gmail')
                  )
                ),
                h('tbody', null,
                  classTeachers.map(t =>
                    h('tr', { key: t.id },
                      h('td', null, h('strong', null, t.name)),
                      h('td', null,
                        t.subject === 'math' ? 'Toán Học' :
                        t.subject === 'literature' ? 'Ngữ Văn' :
                        t.subject === 'english' ? 'Tiếng Anh' : 'Chưa phân môn'
                      ),
                      h('td', null, t.email)
                    )
                  )
                )
              );
            })()
          ),
          h('div', null,
            h('h4', { style: { color: '#5A5A40', marginBottom: '8px', borderBottom: '2px solid #E5E5DE', paddingBottom: '4px' } }, '👤 Danh sách học sinh'),
            (() => {
              const classStudents = members.filter(m => m.role === 'student' && m.className === viewingClassId);
              if (classStudents.length === 0) {
                return h('p', { style: { fontStyle: 'italic', color: '#8E8E85', fontSize: '0.9rem', padding: '10px 0' } }, 'Chưa có học sinh nào được xếp vào lớp này.');
              }
              const totalClassStudentsPages = Math.ceil(classStudents.length / PAGE_SIZE) || 1;
              const activeClassStudentsPage = Math.min(classDetailsPage, totalClassStudentsPages);
              const paginatedClassStudents = classStudents.slice((activeClassStudentsPage - 1) * PAGE_SIZE, activeClassStudentsPage * PAGE_SIZE);

              return h(React.Fragment, null,
                h('table', { className: 'data-table', style: { fontSize: '0.9rem' } },
                  h('thead', null,
                    h('tr', null,
                      h('th', null, 'Mã HS'),
                      h('th', null, 'Họ và Tên'),
                      h('th', null, 'Email / Gmail'),
                      h('th', { style: { textAlign: 'center' } }, 'Toán'),
                      h('th', { style: { textAlign: 'center' } }, 'Văn'),
                      h('th', { style: { textAlign: 'center' } }, 'Anh'),
                      h('th', { style: { textAlign: 'center' } }, 'Điểm TB')
                    )
                  ),
                  h('tbody', null,
                    paginatedClassStudents.map(s => {
                      const grades = gradesMap[s.id] || { math: null, literature: null, english: null };
                      const gpa = calculateGpa(grades);
                      return h('tr', { key: s.id },
                        h('td', null, h('span', { className: 'strong-id' }, s.id)),
                        h('td', null, h('strong', null, s.name)),
                        h('td', null, s.email),
                        h('td', { style: { textAlign: 'center' } }, grades.math !== null ? grades.math : '-'),
                        h('td', { style: { textAlign: 'center' } }, grades.literature !== null ? grades.literature : '-'),
                        h('td', { style: { textAlign: 'center' } }, grades.english !== null ? grades.english : '-'),
                        h('td', { style: { textAlign: 'center', fontWeight: 'bold' } }, gpa !== null ? gpa : 'N/A')
                      );
                    })
                  )
                ),
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '12px', fontSize: '0.85rem', color: '#5A5A40' } },
                  h('div', null, `Hiển thị ${Math.min(classStudents.length, (activeClassStudentsPage - 1) * PAGE_SIZE + 1)}-${Math.min(classStudents.length, activeClassStudentsPage * PAGE_SIZE)} trên tổng số ${classStudents.length} học sinh của lớp`),
                  renderPagination(activeClassStudentsPage, totalClassStudentsPages, setClassDetailsPage)
                )
              );
            })()
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setViewingClassId(null) }, 'Đóng')
        )
      )
    ) : null
  );
}
