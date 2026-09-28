import React, { useState, useEffect, useRef } from 'react';
import { Member, SubjectGrades, StudentGradeRecord, ClassItem, UserPermissions, Role, RolePermissionsMap } from '../../types';
import { calculateGpa, handleExportCsv, generateSecureRandomPassword } from '../../utils';
import { t, formatRole, formatSubject, formatClassName, formatUserName, formatPaginationInfo } from '../../i18n';

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

const safeFloat = (v: any): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const num = parseFloat(v);
  return isNaN(num) ? null : num;
};

export interface PermissionMatrixItem {
  key: keyof UserPermissions;
  titleKey: string;
  descKey: string;
  category: 'classes' | 'grades' | 'reports' | 'system';
  lockedRoles?: {
    admin?: boolean;
    teacher?: boolean;
    student?: boolean;
  };
}

export const PERMISSION_MATRIX_ITEMS: PermissionMatrixItem[] = [
  // 1. Cơ Cấu & Quản Lý Lớp Học (classes)
  {
    key: 'createClass',
    titleKey: 'permissions.items.createClassTitle',
    descKey: 'permissions.items.createClassDesc',
    category: 'classes',
    lockedRoles: { teacher: true, student: true }
  },
  {
    key: 'editClass',
    titleKey: 'permissions.items.editClassTitle',
    descKey: 'permissions.items.editClassDesc',
    category: 'classes',
    lockedRoles: { teacher: true, student: true }
  },
  {
    key: 'deleteClass',
    titleKey: 'permissions.items.deleteClassTitle',
    descKey: 'permissions.items.deleteClassDesc',
    category: 'classes',
    lockedRoles: { teacher: true, student: true }
  },
  {
    key: 'enrollStudents',
    titleKey: 'permissions.items.enrollStudentsTitle',
    descKey: 'permissions.items.enrollStudentsDesc',
    category: 'classes',
    lockedRoles: { teacher: true, student: true }
  },
  {
    key: 'unenrollStudents',
    titleKey: 'permissions.items.unenrollStudentsTitle',
    descKey: 'permissions.items.unenrollStudentsDesc',
    category: 'classes',
    lockedRoles: { teacher: true, student: true }
  },
  {
    key: 'assignTeachers',
    titleKey: 'permissions.items.assignTeachersTitle',
    descKey: 'permissions.items.assignTeachersDesc',
    category: 'classes',
    lockedRoles: { teacher: true, student: true }
  },

  // 2. Quản Lý Điểm Số & Học Tập (grades)
  {
    key: 'teacherEnterGrades',
    titleKey: 'permissions.items.teacherEnterGradesTitle',
    descKey: 'permissions.items.teacherEnterGradesDesc',
    category: 'grades',
    lockedRoles: { student: true }
  },
  {
    key: 'teacherClearGrades',
    titleKey: 'permissions.items.teacherClearGradesTitle',
    descKey: 'permissions.items.teacherClearGradesDesc',
    category: 'grades',
    lockedRoles: { teacher: true, student: true }
  },

  // 3. Tra Cứu, Thống Kê & Báo Cáo (reports)
  {
    key: 'viewAllSchoolGrades',
    titleKey: 'permissions.items.viewAllSchoolGradesTitle',
    descKey: 'permissions.items.viewAllSchoolGradesDesc',
    category: 'reports',
    lockedRoles: { teacher: true, student: true }
  },
  {
    key: 'teacherViewAssignedClassGrades',
    titleKey: 'permissions.items.teacherViewAssignedClassGradesTitle',
    descKey: 'permissions.items.teacherViewAssignedClassGradesDesc',
    category: 'reports',
    lockedRoles: { student: true }
  },
  {
    key: 'teacherViewStudentList',
    titleKey: 'permissions.items.teacherViewStudentListTitle',
    descKey: 'permissions.items.teacherViewStudentListDesc',
    category: 'reports',
    lockedRoles: { student: true }
  },
  {
    key: 'studentViewGrades',
    titleKey: 'permissions.items.studentViewGradesTitle',
    descKey: 'permissions.items.studentViewGradesDesc',
    category: 'reports',
    lockedRoles: { teacher: true }
  },
  {
    key: 'exportCsvReports',
    titleKey: 'permissions.items.exportCsvReportsTitle',
    descKey: 'permissions.items.exportCsvReportsDesc',
    category: 'reports',
    lockedRoles: {}
  },

  // 4. Tài Khoản & Quản Trị Hệ Thống (system)
  {
    key: 'manageMembers',
    titleKey: 'permissions.items.manageMembersTitle',
    descKey: 'permissions.items.manageMembersDesc',
    category: 'system',
    lockedRoles: { teacher: true, student: true }
  },
  {
    key: 'manageRolePermissions',
    titleKey: 'permissions.items.manageRolePermissionsTitle',
    descKey: 'permissions.items.manageRolePermissionsDesc',
    category: 'system',
    lockedRoles: { teacher: true, student: true }
  }
];

export default function AdminWorkspace({
  currentUser,
  classes,
  setClasses,
  members,
  setMembers,
  gradesMap,
  setGradesMap
}: AdminWorkspaceProps) {
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'teachers' | 'students_grades' | 'classes' | 'members' | 'permissions'>('members');
  const [adminSearchInput, setAdminSearchInput] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [viewingGradeDetail, setViewingGradeDetail] = useState<StudentGradeRecord | null>(null);

  const [rolePermissionsMatrix, setRolePermissionsMatrix] = useState<RolePermissionsMap>(() => ({
    admin: {
      createClass: true, editClass: true, deleteClass: true, manageMembers: true,
      assignTeachers: true, autoAssignTeacher: true, enrollStudents: true, unenrollStudents: true,
      editMathGrades: true, editLiteratureGrades: true, editEnglishGrades: true,
      viewAllSchoolGrades: true, viewClassGrades: true, exportCsvReports: true, manageRolePermissions: true,
      ...(currentUser.permissions || {})
    },
    teacher: {
      teacherEnterGrades: true, teacherClearGrades: false, teacherAutoClaimClass: true,
      teacherViewAssignedClassGrades: true, teacherViewStudentList: true,
      autoAssignTeacher: true, viewClassGrades: true, exportCsvReports: true,
      editMathGrades: true, editLiteratureGrades: true, editEnglishGrades: true
    },
    student: {
      studentViewGrades: true,
      viewClassGrades: true, exportCsvReports: true
    }
  }));
  const [savedRolePermissionsMatrix, setSavedRolePermissionsMatrix] = useState<RolePermissionsMap>(() => ({
    admin: {
      createClass: true, editClass: true, deleteClass: true, manageMembers: true,
      assignTeachers: true, autoAssignTeacher: true, enrollStudents: true, unenrollStudents: true,
      editMathGrades: true, editLiteratureGrades: true, editEnglishGrades: true,
      viewAllSchoolGrades: true, viewClassGrades: true, exportCsvReports: true, manageRolePermissions: true,
      ...(currentUser.permissions || {})
    },
    teacher: {
      teacherEnterGrades: true, teacherClearGrades: false, teacherAutoClaimClass: true,
      teacherViewAssignedClassGrades: true, teacherViewStudentList: true,
      autoAssignTeacher: true, viewClassGrades: true, exportCsvReports: true,
      editMathGrades: true, editLiteratureGrades: true, editEnglishGrades: true
    },
    student: {
      studentViewGrades: true,
      viewClassGrades: true, exportCsvReports: true
    }
  }));
  const hasUnsavedRolePermissions = JSON.stringify(rolePermissionsMatrix) !== JSON.stringify(savedRolePermissionsMatrix);
  const [isSavingRolePermissions, setIsSavingRolePermissions] = useState(false);
  const [rolePermissionStatus, setRolePermissionStatus] = useState<string | null>(null);

  const adminPermissions = (savedRolePermissionsMatrix?.admin && Object.keys(savedRolePermissionsMatrix.admin).length > 0)
    ? savedRolePermissionsMatrix.admin
    : (currentUser.permissions || {});

  const canExportCsv = adminPermissions.exportCsvReports ?? true;
  const canCreateClass = adminPermissions.createClass ?? true;
  const canEditClass = adminPermissions.editClass ?? true;
  const canDeleteClass = adminPermissions.deleteClass ?? true;
  const canEnrollStudents = adminPermissions.enrollStudents ?? true;
  const canUnenrollStudents = adminPermissions.unenrollStudents ?? true;
  const canAssignTeachers = adminPermissions.assignTeachers ?? true;
  const canEnterGrades = (adminPermissions.teacherEnterGrades ?? adminPermissions.editMathGrades) ?? true;
  const canClearGrades = adminPermissions.teacherClearGrades ?? true;
  const canViewAllSchoolGrades = adminPermissions.viewAllSchoolGrades ?? true;
  const canManageMembers = adminPermissions.manageMembers ?? true;
  const canManageRolePermissions = adminPermissions.manageRolePermissions ?? true;

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
    setAdminSearchInput('');
    setAdminSearchQuery('');
  }, [adminActiveSubTab]);

  const loadClassesOnDemand = async () => {
    try {
      const res = await fetch('/api/classes');
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const rawData = await res.json();
        const classesData = rawData.map((c: any) => ({ ...c, id: c.code || c.id }));
        setClasses(classesData);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách lớp học:", err);
    }
  };

  useEffect(() => {
    if (adminActiveSubTab !== 'teachers') return;
    async function loadTeachers() {
      try {
        const PAGE_SIZE = 10;
        console.log(`[API Network Load] Admin truy cập tab Quản Lý Giáo Viên. Đang tải danh sách giáo viên từ server (Trang ${teachersPage}, từ khóa: "${adminSearchQuery}")...`);
        const res = await fetch(`/api/teachers?page=${teachersPage}&size=${PAGE_SIZE}&search=${encodeURIComponent(adminSearchQuery)}`);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          const teachers = (data.content || []).map((m: any) => ({ ...m, id: m.code || m.id }));
          setPaginatedTeachers(teachers);
          setTotalTeachers(data.totalElements || 0);

          setMembers(prev => {
            const incomingIds = new Set(teachers.map((m: any) => String(m.code || m.id || '').toUpperCase()));
            return [
              ...prev.filter(m => !incomingIds.has(String(m.code || m.id || '').toUpperCase())),
              ...teachers
            ];
          });
          console.log('[API Network Success] Tải danh sách giáo viên thành công.');
        }
      } catch (err) {
        console.warn('[API Network Warn] Không thể đồng bộ dữ liệu qua API Network.', err);
      }
    }
    loadTeachers();
  }, [adminActiveSubTab, teachersPage, adminSearchQuery, refreshTrigger]);

  useEffect(() => {
    if (adminActiveSubTab !== 'members') return;
    async function loadMembers() {
      try {
        const PAGE_SIZE = 10;
        console.log(`[API Network Load] Admin truy cập tab Tất Cả Thành Viên. Đang tải lại danh sách tất cả thành viên từ server (Trang ${membersPage}, từ khóa: "${adminSearchQuery}")...`);
        const res = await fetch(`/api/members?page=${membersPage}&size=${PAGE_SIZE}&search=${encodeURIComponent(adminSearchQuery)}`);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          const incoming = (data.content || []).map((m: any) => ({ ...m, id: m.code || m.id }));
          setPaginatedMembers(incoming);
          setTotalMembers(data.totalElements || 0);
          
          setMembers(prev => {
            const incomingIds = new Set(incoming.map((m: any) => String(m.code || m.id || '').toUpperCase()));
            return [
              ...prev.filter(m => !incomingIds.has(String(m.code || m.id || '').toUpperCase())),
              ...incoming
            ];
          });
          console.log('[API Network Success] Tải danh sách tất cả thành viên thành công.');
        }
      } catch (err) {
        console.warn('[API Network Warn] Không thể đồng bộ dữ liệu qua API Network.', err);
      }
    }
    loadMembers();
  }, [adminActiveSubTab, membersPage, adminSearchQuery, refreshTrigger]);

  useEffect(() => {
    if (adminActiveSubTab !== 'students_grades') return;
    async function loadGrades() {
      try {
        const PAGE_SIZE = 10;
        console.log(`[API Network Load] Admin truy cập tab Điểm số. Đang tải lại điểm số (Trang ${studentsGradesPage}, từ khóa: "${adminSearchQuery}")...`);
        const url = `/api/grades?page=${studentsGradesPage}&size=${PAGE_SIZE}&search=${encodeURIComponent(adminSearchQuery)}`;
        const resGrades = await fetch(url);
        const ct = resGrades.headers.get('content-type') || '';
        if (resGrades.ok && ct.includes('application/json')) {
          const data = await resGrades.json();
          const records: StudentGradeRecord[] = (data.content || []).map((r: any) => ({
            studentId: r.studentCode || r.code || r.studentId,
            studentName: r.studentName,
            className: r.className,
            email: r.email,
            password: r.password || '123',
            grades: {
              math: safeFloat(r.math),
              literature: safeFloat(r.literature),
              english: safeFloat(r.english),
              math_oral: safeFloat(r.math_oral),
              math_m15: safeFloat(r.math_m15),
              math_mid: safeFloat(r.math_mid),
              math_final: safeFloat(r.math_final),
              literature_oral: safeFloat(r.literature_oral),
              literature_m15: safeFloat(r.literature_m15),
              literature_mid: safeFloat(r.literature_mid),
              literature_final: safeFloat(r.literature_final),
              english_oral: safeFloat(r.english_oral),
              english_m15: safeFloat(r.english_m15),
              english_mid: safeFloat(r.english_mid),
              english_final: safeFloat(r.english_final)
            },
            gpa: safeFloat(r.gpa)
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
            password: r.password || '123',
            role: 'student',
            className: r.className === 'Chưa xếp lớp' ? '' : r.className
          }));
          setMembers(prev => {
            const incomingIds = new Set(studentMembers.map(m => String(m.code || m.id || '').toUpperCase()));
            return [
              ...prev.filter(m => !incomingIds.has(String(m.code || m.id || '').toUpperCase())),
              ...studentMembers
            ];
          });
          console.log('[API Network Success] Tải điểm số thành công.');
        }
      } catch (err) {
        console.warn('[API Network Warn] Không thể đồng bộ dữ liệu qua API Network.', err);
      }
    }
    loadGrades();
  }, [adminActiveSubTab, studentsGradesPage, adminSearchQuery, refreshTrigger]);

  useEffect(() => {
    if (adminActiveSubTab !== 'classes') return;
    async function loadClasses() {
      try {
        console.log('[API Network Load] Admin truy cập tab Lớp học. Đang tải lại danh sách lớp...');
        const res = await fetch('/api/classes');
        if (res.ok) {
          const rawData = await res.json();
          const data = rawData.map((c: any) => ({ ...c, id: c.code || c.id }));
          setClasses(data);
          console.log('[API Network Success] Tải danh sách lớp học thành công.');
        }
      } catch (err) {
        console.warn('[API Network Warn] Không thể đồng bộ dữ liệu qua API Network.', err);
      }
    }
    loadClasses();
  }, [adminActiveSubTab, refreshTrigger]);

  useEffect(() => {
    async function loadClassMembers() {
      if (!viewingClassId) return;
      try {
        console.log(`[API Network Load] Admin truy cập chi tiết lớp ${viewingClassId}. Đang tải danh sách giáo viên giảng dạy và học sinh từ server...`);
        const resMembers = await fetch(`/api/classes/${viewingClassId}/members`);
        const ct = resMembers.headers.get('content-type') || '';
        if (resMembers.ok && ct.includes('application/json')) {
          const rawMembers = await resMembers.json();
          const classMembers = rawMembers.map((m: any) => ({ ...m, id: m.code || m.id }));
          setMembers(prev => {
            const incomingIds = new Set(classMembers.map((m: any) => String(m.code || m.id || '').toUpperCase()));
            return [
              ...prev.filter(m => !incomingIds.has(String(m.code || m.id || '').toUpperCase())),
              ...classMembers
            ];
          });
          console.log(`[API Network Success] Đã tải danh sách giáo viên và học sinh của lớp ${viewingClassId} thành công từ server.`, classMembers);
        }
      } catch (err) {
        console.warn(`[API Network Warn] Không thể tải thành viên lớp ${viewingClassId} từ server.`, err);
      }
    }
    loadClassMembers();
  }, [viewingClassId, refreshTrigger]);

  useEffect(() => {
    async function loadClassGrades() {
      if (!viewingClassId) return;
      try {
        console.log(`[API Network Load] Admin tải điểm số lớp ${viewingClassId} (Trang ${classDetailsPage})...`);
        const resGrades = await fetch(`/api/grades?page=${classDetailsPage}&size=10&classes=${encodeURIComponent(viewingClassId)}`);
        if (resGrades.ok) {
          const gradesData = await resGrades.json();
          const records = Array.isArray(gradesData) ? gradesData : (gradesData.content || []);
          const updatedMap: { [studentId: string]: SubjectGrades } = {};
          records.forEach((r: any) => {
            if (r.studentId) {
              updatedMap[r.studentId] = {
                math: safeFloat(r.math),
                literature: safeFloat(r.literature),
                english: safeFloat(r.english),
                math_oral: safeFloat(r.math_oral),
                math_m15: safeFloat(r.math_m15),
                math_mid: safeFloat(r.math_mid),
                math_final: safeFloat(r.math_final),
                literature_oral: safeFloat(r.literature_oral),
                literature_m15: safeFloat(r.literature_m15),
                literature_mid: safeFloat(r.literature_mid),
                literature_final: safeFloat(r.literature_final),
                english_oral: safeFloat(r.english_oral),
                english_m15: safeFloat(r.english_m15),
                english_mid: safeFloat(r.english_mid),
                english_final: safeFloat(r.english_final)
              };
            }
          });
          setGradesMap(prev => ({ ...prev, ...updatedMap }));
          console.log(`[API Network Success] Đã tải điểm số trang ${classDetailsPage} của lớp ${viewingClassId} thành công từ server.`, updatedMap);
        }
      } catch (err) {
        console.warn(`[API Network Warn] Không thể tải điểm số lớp ${viewingClassId} từ server.`, err);
      }
    }
    loadClassGrades();
  }, [viewingClassId, classDetailsPage, refreshTrigger]);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Member | null>(null);
  const [teacherForm, setTeacherForm] = useState({ id: '', name: '', email: '', password: '', assignedClasses: [] as string[], subject: 'math' as 'math' | 'literature' | 'english' });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Member | null>(null);
  const [studentForm, setStudentForm] = useState({ id: '', name: '', email: '', password: '', className: '' });

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ studentId: string; studentName: string; grades: SubjectGrades } | null>(null);
  const [gradeForm, setGradeForm] = useState({
    math_oral: '' as string | number,
    math_m15: '' as string | number,
    math_mid: '' as string | number,
    math_final: '' as string | number,

    literature_oral: '' as string | number,
    literature_m15: '' as string | number,
    literature_mid: '' as string | number,
    literature_final: '' as string | number,

    english_oral: '' as string | number,
    english_m15: '' as string | number,
    english_mid: '' as string | number,
    english_final: '' as string | number
  });

  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ id: '', name: '' });
  const [classError, setClassError] = useState('');

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<{ type: 'student' | 'teacher'; id: string; name: string } | null>(null);
  const [selectedEnrollClass, setSelectedEnrollClass] = useState('');

  const [resetModalData, setResetModalData] = useState<{
    show: boolean;
    user: Member | null;
    rawPassword?: string;
    loading?: boolean;
    copied?: boolean;
  }>({ show: false, user: null });

  const openResetPasswordModal = (user: Member) => {
    setResetModalData({
      show: true,
      user,
      rawPassword: '',
      loading: false,
      copied: false
    });
  };

  const confirmResetPassword = async () => {
    if (!resetModalData.user) return;
    const target = resetModalData.user;
    setResetModalData(prev => ({ ...prev, loading: true }));

    const targetId = target.code || target.id;
    try {
      let res = await fetch(`/api/admin/users/${encodeURIComponent(targetId)}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Current-User-Role': currentUser.role || 'admin',
          'X-Current-User-Id': currentUser.id || ''
        },
        body: JSON.stringify({
          email: target.email,
          id: target.id,
          code: target.code
        })
      });

      if (!res.ok) {
        res = await fetch(`/api/members/${encodeURIComponent(targetId)}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Current-User-Role': currentUser.role || 'admin'
          },
          body: JSON.stringify({
            email: target.email,
            id: target.id,
            code: target.code
          })
        });
      }

      if (res.ok) {
        const data = await res.json();
        const newPassword = data.newPassword || data.password;
        setMembers(prev => prev.map(m => {
          if (m.id === target.id || m.code === target.code || (target.email && m.email === target.email)) {
            return {
              ...m,
              password: newPassword,
              mustChangePassword: true
            };
          }
          return m;
        }));
        setResetModalData(prev => ({
          ...prev,
          loading: false,
          rawPassword: newPassword,
          copied: false
        }));
        return;
      }
    } catch (err) {
      console.warn('[Network fallback] Reset password attempt:', err);
    }

    // Client fallback sử dụng SecureRandom 10 ký tự bảo mật cao
    const fallbackPwd = generateSecureRandomPassword(10);

    try {
      await fetch(`/api/members/${encodeURIComponent(targetId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: fallbackPwd, mustChangePassword: true })
      });
    } catch (_) {}

    setMembers(prev => prev.map(m => {
      if (m.id === target.id || m.code === target.code || (target.email && m.email === target.email)) {
        return {
          ...m,
          password: fallbackPwd,
          mustChangePassword: true
        };
      }
      return m;
    }));
    setResetModalData(prev => ({
      ...prev,
      loading: false,
      rawPassword: fallbackPwd,
      copied: false
    }));
  };

  useEffect(() => {
    async function fetchRolePermissions() {
      try {
        const res = await fetch('/api/role-permissions');
        if (res.ok) {
          const data = await res.json();
          if (data && data.admin && data.teacher && data.student) {
            setSavedRolePermissionsMatrix(data);
            if (adminActiveSubTab === 'permissions') {
              setRolePermissionsMatrix(data);
            } else {
              setRolePermissionsMatrix(prev => {
                const isClean = JSON.stringify(prev) === JSON.stringify(savedRolePermissionsMatrix);
                return isClean ? data : prev;
              });
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching role permissions:', err);
      }
    }
    fetchRolePermissions();
  }, [adminActiveSubTab]);

  const toggleRolePermission = (role: Role, key: keyof UserPermissions) => {
    const item = PERMISSION_MATRIX_ITEMS.find(i => i.key === key);
    if (item?.lockedRoles && item.lockedRoles[role]) {
      return; // Locked for this role
    }

    setRolePermissionsMatrix(prev => {
      const currentRolePerms = prev[role] || {};
      const nextVal = !currentRolePerms[key];
      const updatedRolePerms = { ...currentRolePerms, [key]: nextVal };

      // Sync legacy permissions if applicable
      if (role === 'teacher') {
        if (key === 'teacherEnterGrades') {
          updatedRolePerms.editMathGrades = nextVal;
          updatedRolePerms.editLiteratureGrades = nextVal;
          updatedRolePerms.editEnglishGrades = nextVal;
        } else if (key === 'teacherAutoClaimClass') {
          updatedRolePerms.autoAssignTeacher = nextVal;
        } else if (key === 'teacherViewAssignedClassGrades') {
          updatedRolePerms.viewClassGrades = nextVal;
        }
      } else if (role === 'student') {
        if (key === 'studentViewGrades') {
          updatedRolePerms.viewClassGrades = nextVal;
        }
      }

      return {
        ...prev,
        [role]: updatedRolePerms
      };
    });
  };

  const resetRolePermissionsToDefault = () => {
    const defaultMatrix: RolePermissionsMap = {
      admin: {
        createClass: true, editClass: true, deleteClass: true, manageMembers: true,
        assignTeachers: true, autoAssignTeacher: true, enrollStudents: true, unenrollStudents: true,
        editMathGrades: true, editLiteratureGrades: true, editEnglishGrades: true,
        viewAllSchoolGrades: true, viewClassGrades: true, exportCsvReports: true, manageRolePermissions: true
      },
      teacher: {
        teacherEnterGrades: true, teacherClearGrades: false, teacherAutoClaimClass: true,
        teacherViewAssignedClassGrades: true, teacherViewStudentList: true,
        autoAssignTeacher: true, viewClassGrades: true, exportCsvReports: true,
        editMathGrades: true, editLiteratureGrades: true, editEnglishGrades: true
      },
      student: {
        studentViewGrades: true,
        viewClassGrades: true, exportCsvReports: true,
        createClass: false, editClass: false, deleteClass: false, manageMembers: false
      }
    };
    setRolePermissionsMatrix(defaultMatrix);
    setRolePermissionStatus(t('permissions.statusRestoredDefault'));
    setTimeout(() => setRolePermissionStatus(null), 3500);
  };

  const grantAllAllowedRolePermissions = () => {
    setRolePermissionsMatrix(prev => {
      const nextAdmin = { ...prev.admin };
      const nextTeacher = { ...prev.teacher };
      const nextStudent = { ...prev.student };

      PERMISSION_MATRIX_ITEMS.forEach(item => {
        if (!item.lockedRoles?.admin) nextAdmin[item.key] = true;
        if (!item.lockedRoles?.teacher) nextTeacher[item.key] = true;
        if (!item.lockedRoles?.student) nextStudent[item.key] = true;
      });

      return { admin: nextAdmin, teacher: nextTeacher, student: nextStudent };
    });
    setRolePermissionStatus(t('permissions.statusGrantedAll'));
    setTimeout(() => setRolePermissionStatus(null), 3500);
  };

  const handleSaveRolePermissions = async () => {
    setIsSavingRolePermissions(true);
    const newAdminPerms = rolePermissionsMatrix.admin || {};
    try {
      const res = await fetch('/api/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolePermissions: rolePermissionsMatrix })
      });

      currentUser.permissions = { ...newAdminPerms };
      try {
        localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, permissions: { ...newAdminPerms } }));
      } catch (e) {
        // ignore
      }

      setSavedRolePermissionsMatrix(rolePermissionsMatrix);

      setMembers(prev => prev.map(m => ({
        ...m,
        permissions: { ...(rolePermissionsMatrix[m.role] || {}) }
      })));

      setRolePermissionStatus(t('rbac.saveSuccess'));
      setTimeout(() => setRolePermissionStatus(null), 5000);
    } catch (err) {
      console.error('Error saving role permissions:', err);
      currentUser.permissions = { ...newAdminPerms };
      try {
        localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, permissions: { ...newAdminPerms } }));
      } catch (e) {
        // ignore
      }

      setSavedRolePermissionsMatrix(rolePermissionsMatrix);

      setMembers(prev => prev.map(m => ({
        ...m,
        permissions: { ...(rolePermissionsMatrix[m.role] || {}) }
      })));
      setRolePermissionStatus(t('rbac.saveSuccess'));
      setTimeout(() => setRolePermissionStatus(null), 5000);
    } finally {
      setIsSavingRolePermissions(false);
    }
  };

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
        password: s.password,
        grades,
        gpa: calculateGpa(grades)
      };
    });
  };

  const exportAllGradesCsv = async () => {
    if (!canExportCsv) {
      alert(t('permissions.accessDenied') || 'Bạn không có quyền xuất dữ liệu CSV!');
      return;
    }
    try {
      console.log("[API Network Load] Admin tải toàn bộ điểm để xuất CSV (từ khóa: " + adminSearchQuery + ")...");
      const url = adminSearchQuery 
        ? `/api/grades?page=1&size=9999&search=${encodeURIComponent(adminSearchQuery)}`
        : '/api/grades?all=true';
      const res = await fetch(url);
      if (res.ok) {
        const rawData = await res.json();
        const data = Array.isArray(rawData) ? rawData : (rawData.content || []);
        const records: StudentGradeRecord[] = data.map((r: any) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          className: r.className,
          email: r.email,
          grades: {
            math: r.math === "" || r.math === null ? null : parseFloat(r.math),
            literature: r.literature === "" || r.literature === null ? null : parseFloat(r.literature),
            english: r.english === "" || r.english === null ? null : parseFloat(r.english)
          },
          gpa: r.gpa === "" || r.gpa === null ? null : parseFloat(r.gpa)
        }));
        const filename = adminSearchQuery 
          ? `bang_diem_tim_kiem_${adminSearchQuery.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
          : `bang_diem_all_${currentUser.id}.csv`;
        handleExportCsv(filename, records);
      }
    } catch (err) {
      console.error('Lỗi khi xuất CSV toàn bộ điểm:', err);
    }
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
    }, t('pagination.prev')));

    const PAGE_GROUP_SIZE = 10;
    const startPage = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
    const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);

    if (startPage > 1) {
      buttons.push(h('button', {
        key: 'group-prev',
        className: 'btn-pagination group-nav',
        onClick: (e: any) => { e.preventDefault(); onPageChange(startPage - 1); },
        title: `Về trang ${startPage - 1}`,
        style: {
          padding: '6px 10px',
          margin: '0 4px',
          borderRadius: '4px',
          border: '1px solid #E5E5DE',
          backgroundColor: '#F5F5F0',
          color: '#5A5A40',
          cursor: 'pointer',
          fontSize: '0.85rem'
        }
      }, '«'));
    }

    for (let p = startPage; p <= endPage; p++) {
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

    if (endPage < totalPages) {
      buttons.push(h('button', {
        key: 'group-next',
        className: 'btn-pagination group-nav',
        onClick: (e: any) => { e.preventDefault(); onPageChange(endPage + 1); },
        title: `Đến trang ${endPage + 1}`,
        style: {
          padding: '6px 10px',
          margin: '0 4px',
          borderRadius: '4px',
          border: '1px solid #E5E5DE',
          backgroundColor: '#F5F5F0',
          color: '#5A5A40',
          cursor: 'pointer',
          fontSize: '0.85rem'
        }
      }, '»'));
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
    }, t('pagination.next')));

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

  const openAddTeacher = async () => {
    loadClassesOnDemand();
    setEditingTeacher(null);
    let suggestedId = '';
    try {
      const res = await fetch('/api/next-id?role=teacher');
      if (res.ok) {
        const data = await res.json();
        if (data.nextId) suggestedId = data.nextId;
      }
    } catch (err) {
      console.warn("Lỗi khi lấy ID GV gợi ý:", err);
    }
    if (!suggestedId) {
      const allTeachers = members.filter(m => m.role === 'teacher');
      const nums = allTeachers.map(m => {
        const num = parseInt((m.id || '').replace(/\D/g, ''), 10);
        return isNaN(num) ? 0 : num;
      });
      const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
      suggestedId = `GV${String(maxNum + 1).padStart(2, '0')}`;
    }

    setTeacherForm({ id: suggestedId, name: '', email: suggestedId.toLowerCase(), password: '123', assignedClasses: [], subject: 'math' });
    setShowTeacherModal(true);
  };

  const openEditTeacher = (t: Member) => {
    loadClassesOnDemand();
    setEditingTeacher(t);
    const prefix = t.email ? t.email.split('@')[0] : t.id.toLowerCase();
    setTeacherForm({ id: t.id, name: t.name, email: prefix, password: t.password, assignedClasses: t.assignedClasses || [], subject: t.subject || 'math' });
    setShowTeacherModal(true);
  };

  const saveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    let emailPrefix = teacherForm.email.trim();
    if (emailPrefix.includes('@')) {
      emailPrefix = emailPrefix.split('@')[0].trim();
    }
    if (!emailPrefix) {
      alert(t('admin.alerts.enterTeacherEmail'));
      return;
    }
    const fullTeacherEmail = `${emailPrefix.toLowerCase()}@edu.com`;

    const isEmailDuplicate = members.some(m => m.email.toLowerCase() === fullTeacherEmail.toLowerCase() && (!editingTeacher || m.id !== editingTeacher.id));
    if (isEmailDuplicate) {
      alert(t('admin.alerts.emailDuplicate'));
      return;
    }

    const finalTeacherForm: Member = { ...teacherForm, email: fullTeacherEmail, role: 'teacher' };

    const hypotheticalMembers = members.map(m => {
      if (editingTeacher && m.id === editingTeacher.id) {
        return finalTeacherForm;
      }
      return m;
    });
    if (!editingTeacher) {
      hypotheticalMembers.push(finalTeacherForm);
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
      alert(t('admin.alerts.cannotSaveAssignment') + '\n' + duplicateErrors.join('\n'));
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
      const proceed = window.confirm(t('admin.confirms.incompleteTeacherClasses'));
      if (!proceed) return;
    }

    try {
      const endpoint = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';
      console.log(`[API Network Call] ${method} ${endpoint}`, finalTeacherForm);
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalTeacherForm)
      });
      if (res.ok) {
        console.log('[API Network Success] Đã lưu thông tin giáo viên lên hệ thống server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đang chạy offline hoặc lỗi server. Đồng bộ LocalState.', err);
    }

    if (editingTeacher) {
      setMembers(prev => prev.map(m => m.id === editingTeacher.id ? { ...m, ...finalTeacherForm } : m));
    } else {
      if (members.some(m => m.id === finalTeacherForm.id)) {
        alert(t('admin.alerts.teacherExists'));
        return;
      }
      setMembers(prev => [...prev, finalTeacherForm]);
    }
    setShowTeacherModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const deleteTeacher = async (id: string) => {
    if (window.confirm(t('admin.confirms.deleteTeacher'))) {
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

  const openAddStudent = async () => {
    loadClassesOnDemand();
    setEditingStudent(null);
    let suggestedId = '';
    try {
      const res = await fetch('/api/next-id?role=student');
      if (res.ok) {
        const data = await res.json();
        if (data.nextId) suggestedId = data.nextId;
      }
    } catch (err) {
      console.warn("Lỗi khi lấy ID HS gợi ý:", err);
    }
    if (!suggestedId) {
      const allStudents = members.filter(m => m.role === 'student');
      const nums = allStudents.map(m => {
        const num = parseInt((m.id || '').replace(/\D/g, ''), 10);
        return isNaN(num) ? 0 : num;
      });
      const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
      suggestedId = `HS${String(maxNum + 1).padStart(3, '0')}`;
    }

    setStudentForm({ id: suggestedId, name: '', email: suggestedId.toLowerCase(), password: '123', className: classes[0]?.id || '' });
    setShowStudentModal(true);
  };

  const openEditStudent = (s: Member) => {
    loadClassesOnDemand();
    setEditingStudent(s);
    const prefix = s.email ? s.email.split('@')[0] : s.id.toLowerCase();
    setStudentForm({ id: s.id, name: s.name, email: prefix, password: s.password, className: s.className || '' });
    setShowStudentModal(true);
  };

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    let emailPrefix = studentForm.email.trim();
    if (emailPrefix.includes('@')) {
      emailPrefix = emailPrefix.split('@')[0].trim();
    }
    if (!emailPrefix) {
      alert(t('admin.alerts.enterStudentEmail'));
      return;
    }
    const fullStudentEmail = `${emailPrefix.toLowerCase()}@gmail.com`;

    const isEmailDuplicate = members.some(m => m.email.toLowerCase() === fullStudentEmail.toLowerCase() && (!editingStudent || m.id !== editingStudent.id));
    if (isEmailDuplicate) {
      alert(t('admin.alerts.emailDuplicate'));
      return;
    }

    const finalStudentForm: Member = { ...studentForm, email: fullStudentEmail, role: 'student' };

    try {
      const endpoint = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      console.log(`[API Network Call] ${method} ${endpoint}`, finalStudentForm);
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalStudentForm)
      });
      if (res.ok) {
        console.log('[API Network Success] Đã lưu thông tin học sinh lên hệ thống server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đang chạy offline hoặc lỗi server. Đồng bộ LocalState.', err);
    }

    if (editingStudent) {
      setMembers(prev => prev.map(m => m.id === editingStudent.id ? { ...m, ...finalStudentForm } : m));
      if (!finalStudentForm.className || finalStudentForm.className.trim() === '') {
        setGradesMap(prev => ({
          ...prev,
          [finalStudentForm.id]: { math: null, literature: null, english: null }
        }));
      }
    } else {
      if (members.some(m => m.id === finalStudentForm.id)) {
        alert(t('admin.alerts.studentExists'));
        return;
      }
      setMembers(prev => [...prev, finalStudentForm]);
      setGradesMap(prev => ({ ...prev, [finalStudentForm.id]: { math: null, literature: null, english: null } }));
    }
    setShowStudentModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const deleteStudent = async (id: string) => {
    if (window.confirm(t('admin.confirms.deleteStudent'))) {
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
      math_oral: grades.math_oral !== undefined && grades.math_oral !== null ? grades.math_oral : '',
      math_m15: grades.math_m15 !== undefined && grades.math_m15 !== null ? grades.math_m15 : '',
      math_mid: grades.math_mid !== undefined && grades.math_mid !== null ? grades.math_mid : '',
      math_final: grades.math_final !== undefined && grades.math_final !== null ? grades.math_final : '',

      literature_oral: grades.literature_oral !== undefined && grades.literature_oral !== null ? grades.literature_oral : '',
      literature_m15: grades.literature_m15 !== undefined && grades.literature_m15 !== null ? grades.literature_m15 : '',
      literature_mid: grades.literature_mid !== undefined && grades.literature_mid !== null ? grades.literature_mid : '',
      literature_final: grades.literature_final !== undefined && grades.literature_final !== null ? grades.literature_final : '',

      english_oral: grades.english_oral !== undefined && grades.english_oral !== null ? grades.english_oral : '',
      english_m15: grades.english_m15 !== undefined && grades.english_m15 !== null ? grades.english_m15 : '',
      english_mid: grades.english_mid !== undefined && grades.english_mid !== null ? grades.english_mid : '',
      english_final: grades.english_final !== undefined && grades.english_final !== null ? grades.english_final : ''
    });
    setShowGradeModal(true);
  };

  const calculateSubjectGpa = (oral: number | null, m15: number | null, mid: number | null, finalScore: number | null): number | null => {
    let sum = 0;
    let totalWeight = 0;
    if (oral !== null) { sum += oral; totalWeight += 1; }
    if (m15 !== null) { sum += m15; totalWeight += 1; }
    if (mid !== null) { sum += mid * 2; totalWeight += 2; }
    if (finalScore !== null) { sum += finalScore * 3; totalWeight += 3; }
    if (totalWeight > 0) {
      return Math.round((sum / totalWeight) * 100) / 100;
    }
    return null;
  };

  const saveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;

    const parseVal = (val: string | number) => {
      return val === '' || val === null || val === undefined ? null : parseFloat(val.toString());
    };

    const math_oral = parseVal(gradeForm.math_oral);
    const math_m15 = parseVal(gradeForm.math_m15);
    const math_mid = parseVal(gradeForm.math_mid);
    const math_final = parseVal(gradeForm.math_final);

    const literature_oral = parseVal(gradeForm.literature_oral);
    const literature_m15 = parseVal(gradeForm.literature_m15);
    const literature_mid = parseVal(gradeForm.literature_mid);
    const literature_final = parseVal(gradeForm.literature_final);

    const english_oral = parseVal(gradeForm.english_oral);
    const english_m15 = parseVal(gradeForm.english_m15);
    const english_mid = parseVal(gradeForm.english_mid);
    const english_final = parseVal(gradeForm.english_final);

    const math = calculateSubjectGpa(math_oral, math_m15, math_mid, math_final);
    const literature = calculateSubjectGpa(literature_oral, literature_m15, literature_mid, literature_final);
    const english = calculateSubjectGpa(english_oral, english_m15, english_mid, english_final);

    const bodyData = {
      math, literature, english,
      math_oral, math_m15, math_mid, math_final,
      literature_oral, literature_m15, literature_mid, literature_final,
      english_oral, english_m15, english_mid, english_final
    };

    try {
      console.log(`[API Network Call] PUT /api/grades/${editingGrade.studentId}`, bodyData);
      const res = await fetch(`/api/grades/${editingGrade.studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        console.log('[API Network Success] Đã lưu điểm số học sinh trên server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
    }

    setGradesMap(prev => ({
      ...prev,
      [editingGrade.studentId]: bodyData
    }));
    setShowGradeModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const clearGrade = async (studentId: string) => {
    if (window.confirm(t('admin.confirms.clearGrade'))) {
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

  const handleGlobalAutoAssign = async () => {
    try {
      console.log(`[API Network Call] POST /api/teachers/auto-assign`);
      const res = await fetch('/api/teachers/auto-assign', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.members) {
          setMembers(data.members);
        }
        alert('Đã tự động phân công giáo viên thành công! Lớp nào thiếu môn Toán, Văn, hoặc Anh đã được tự động xếp ngẫu nhiên giáo viên.');
        setRefreshTrigger(prev => prev + 1);
        return;
      }
    } catch (err) {
      console.warn('[API Network Fallback] Tự động phân công client-side.', err);
    }

    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const subjects = ['math', 'literature', 'english'];
    let count = 0;

    const updatedMembers = members.map(m => {
      if (m.role !== 'teacher') return m;
      return { ...m, assignedClasses: Array.isArray(m.assignedClasses) ? [...m.assignedClasses] : [] };
    });

    subjects.forEach(subj => {
      const subjTeachers = updatedMembers.filter(m => m.role === 'teacher' && m.subject === subj);
      if (subjTeachers.length === 0) return;

      const missingClasses = classes.filter(c => {
        return !updatedMembers.some(
          m => m.role === 'teacher' && m.subject === subj && m.assignedClasses?.includes(c.id)
        );
      });

      const shuffledClasses = shuffle(missingClasses);

      shuffledClasses.forEach(c => {
        const hasSubjTeacher = updatedMembers.some(
          m => m.role === 'teacher' && m.subject === subj && m.assignedClasses?.includes(c.id)
        );
        if (hasSubjTeacher) return;

        const availableTeachers = subjTeachers.filter(t => !(t.assignedClasses || []).includes(c.id));
        if (availableTeachers.length === 0) return;

        const underLimitTeachers = availableTeachers.filter(t => (t.assignedClasses || []).length < 2);
        const pool = underLimitTeachers.length > 0 ? underLimitTeachers : availableTeachers;

        const minCount = Math.min(...pool.map(t => (t.assignedClasses || []).length));
        const bestCandidates = pool.filter(t => (t.assignedClasses || []).length === minCount);

        const chosenTeacher = shuffle(bestCandidates)[0];
        if (chosenTeacher) {
          if (!chosenTeacher.assignedClasses) {
            chosenTeacher.assignedClasses = [];
          }
          chosenTeacher.assignedClasses.push(c.id);
          count++;
        }
      });
    });

    setMembers(updatedMembers);
    setRefreshTrigger(prev => prev + 1);
    alert('Đã tự động phân công giáo viên thành công! Lớp nào thiếu môn Toán, Văn, hoặc Anh đã được tự động xếp ngẫu nhiên giáo viên.');
  };

  const handleSingleTeacherAutoAssign = async (teacherId: string) => {
    const teacher = members.find(m => m.id === teacherId && m.role === 'teacher');
    if (!teacher) return;

    if (Array.isArray(teacher.assignedClasses) && teacher.assignedClasses.length >= 2) {
      alert(`Giáo viên ${teacher.name} đã đạt giới hạn tối đa 2 lớp.`);
      return;
    }

    try {
      console.log(`[API Network Call] POST /api/teachers/${teacherId}/auto-assign`);
      const res = await fetch(`/api/teachers/${teacherId}/auto-assign`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.members) {
          setMembers(data.members);
        }
        alert(data.message || 'Đã tự động phân công giáo viên vào các lớp đang thiếu.');
        setRefreshTrigger(prev => prev + 1);
        return;
      }
    } catch (err) {
      console.warn('[API Network Fallback] Single teacher auto assign client-side.', err);
    }

    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const subject = teacher.subject || 'math';
    const allTeachers = members.filter(m => m.role === 'teacher');
    const newlyAssigned: string[] = [];
    const currentAssigned = Array.isArray(teacher.assignedClasses) ? [...teacher.assignedClasses] : [];

    const missingClasses = classes.filter(c => {
      const hasSubjTeacher = allTeachers.some(
        t => t.subject === subject && t.assignedClasses?.includes(c.id)
      );
      return !hasSubjTeacher && !currentAssigned.includes(c.id);
    });

    const shuffledMissing = shuffle(missingClasses);

    const updatedMembers = members.map(m => {
      if (m.id === teacherId) {
        const assigned = [...currentAssigned];
        for (const c of shuffledMissing) {
          if (assigned.length >= 2) break;
          assigned.push(c.id);
          newlyAssigned.push(c.id);
        }
        return { ...m, assignedClasses: assigned };
      }
      return m;
    });

    setMembers(updatedMembers);
    setRefreshTrigger(prev => prev + 1);
    if (newlyAssigned.length > 0) {
      alert(`Đã tự động xếp ngẫu nhiên ${teacher.name} (${formatSubject(subject)}) vào ${newlyAssigned.length} lớp đang thiếu: ${newlyAssigned.join(', ')} (tối đa 2 lớp/giáo viên).`);
    } else if (currentAssigned.length >= 2) {
      alert(`Giáo viên ${teacher.name} đã đạt giới hạn tối đa 2 lớp.`);
    } else {
      alert(`Tất cả các lớp hiện tại đều đã có giáo viên môn ${formatSubject(subject)}.`);
    }
  };

  const saveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError('');
    const formattedId = classForm.id.trim().toUpperCase();
    if (!formattedId || !classForm.name.trim()) {
      setClassError(t('admin.alerts.fillClassInfo'));
      return;
    }
    if (classes.some(c => c.id === formattedId)) {
      setClassError(t('admin.alerts.classExists'));
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
    if (window.confirm(t('admin.confirms.deleteClass'))) {
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
    loadClassesOnDemand();
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
          alert(t('admin.alerts.teacherSubjectAssigned'));
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
    if (window.confirm(t('admin.confirms.unenrollTeacher'))) {
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

  const unenrollStudentClass = async (studentId: string, className: string) => {
    if (window.confirm(t('admin.confirms.unenrollStudent'))) {
      try {
        console.log(`[API Network Call] POST /api/unenroll/student`, { id: studentId });
        const res = await fetch('/api/unenroll/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: studentId })
        });
        if (res.ok) {
          console.log('[API Network Success] Đã xóa học sinh khỏi lớp trên server.');
        }
      } catch (err) {
        console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
      }
      setMembers(prev => prev.map(m => {
        if (m.id === studentId) {
          return { ...m, className: '' };
        }
        return m;
      }));
      setGradesMap(prev => ({
        ...prev,
        [studentId]: { math: null, literature: null, english: null }
      }));
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const getAssignmentWarnings = () => {
    const warnings: string[] = [];
    const teachersList = members.filter(m => m.role === 'teacher');
    
    if (totalTeachers > 0 && teachersList.length < totalTeachers) {
      return [];
    }

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

  const renderMatrixToggle = (role: Role, key: keyof UserPermissions, isChecked: boolean, isLocked: boolean) => {
    if (isLocked) {
      return h('div', {
        className: 'rbac-locked-badge',
        title: role === 'student' ? t('rbac.lockedStudentDesc') : t('rbac.lockedAdminOnlyDesc'),
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '6px',
          backgroundColor: '#F1F5F9',
          border: '1px dashed #CBD5E1',
          color: '#94A3B8',
          fontSize: '0.75rem',
          cursor: 'not-allowed',
          userSelect: 'none'
        }
      },
        h('span', null, '🔒'),
        h('span', null, t('rbac.lockedBadge'))
      );
    }

    return h('div', {
      className: 'rbac-checkbox-wrapper',
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        padding: '4px'
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleRolePermission(role, key);
      }
    },
      h('div', {
        className: `rbac-custom-checkbox ${isChecked ? 'checked' : 'unchecked'}`,
        style: {
          width: '22px',
          height: '22px',
          borderRadius: '5px',
          backgroundColor: isChecked ? '#7C3AED' : '#F5F3FF',
          border: isChecked ? '1.5px solid #6D28D9' : '1.5px solid #C4B5FD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          boxShadow: isChecked ? '0 1px 3px rgba(124, 58, 237, 0.3)' : 'none',
          flexShrink: 0
        }
      },
        isChecked ? h('svg', {
          width: '14',
          height: '14',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: '#FFFFFF',
          strokeWidth: '3.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        },
          h('polyline', { points: '20 6 9 17 4 12' })
        ) : null
      )
    );
  };

  return h(React.Fragment, null,
    h('aside', { className: 'dashboard-sidebar', id: 'admin_sidebar_menu' },
      h('div', { className: 'sidebar-section' },
        h('div', { className: 'sidebar-section-title' }, t('roles.admin')),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'members' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('members'),
          id: 'admin_menu_members'
        }, `👥 ${t('tabs.allMembers')}`),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'classes' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('classes'),
          id: 'admin_menu_classes'
        }, `📚 ${t('tabs.classes')}`),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'teachers' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('teachers'),
          id: 'admin_menu_teachers'
        }, `💼 ${t('tabs.teachers')}`),
        h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'students_grades' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('students_grades'),
          id: 'admin_menu_students_grades'
        }, `📊 ${t('tabs.studentsGrades')}`),
        canManageRolePermissions ? h('button', {
          className: `sidebar-btn ${adminActiveSubTab === 'permissions' ? 'active' : ''}`,
          onClick: () => setAdminActiveSubTab('permissions'),
          id: 'admin_menu_permissions'
        }, t('tabs.permissions')) : null
      ),
      canExportCsv ? h('div', { className: 'sidebar-section' },
        h('button', {
          className: 'sidebar-btn',
          onClick: () => {
            if (!canExportCsv) {
              alert(t('permissions.accessDenied') || 'Bạn không có quyền xuất dữ liệu CSV!');
              return;
            }
            handleExportCsv(`grades_page_${activeStudentsGradesPage}.csv`, paginatedStudentGrades);
          },
          id: 'admin_menu_export_current'
        }, `📥 ${t('exportCsv')} (${activeStudentsGradesPage})`),
        h('button', {
          className: 'sidebar-btn',
          onClick: exportAllGradesCsv,
          id: 'admin_menu_export_all'
        }, `📥 ${t('exportCsv')} (All)`)
      ) : null
    ),

    h('main', { className: 'workspace-content', id: 'admin_workspace_content' },
      h('div', { className: 'workspace-header' },
        h('div', null,
          h('h1', null, adminActiveSubTab === 'permissions' ? t('tabs.permissions') : t('roles.admin')),
          h('p', { style: { color: '#8E8E85', fontSize: '0.85rem', marginTop: '4px', fontFamily: 'sans-serif' } },
            `${t('welcome')}, `, h('strong', null, formatUserName(currentUser))
          )
        ),
        h('div', { className: 'header-actions' },
          adminActiveSubTab === 'teachers' ? h(React.Fragment, null,
            canAssignTeachers ? h('button', {
              className: 'btn btn-secondary',
              onClick: handleGlobalAutoAssign,
              id: 'admin_btn_auto_assign_all',
              style: { marginRight: '8px' }
            }, 'Tự động phân công (Toán, Văn, Anh)') : null,
            canManageMembers ? h('button', {
              className: 'btn btn-primary',
              onClick: openAddTeacher,
              id: 'admin_btn_add_teacher'
            }, `+ ${t('actions.add')} ${t('roles.teacher')}`) : null
          ) : null,
          adminActiveSubTab === 'students_grades' && canManageMembers ? h('button', {
            className: 'btn btn-primary',
            onClick: openAddStudent,
            id: 'admin_btn_add_student'
          }, `+ ${t('actions.add')} ${t('roles.student')}`) : null,
          adminActiveSubTab === 'classes' ? h(React.Fragment, null,
            canAssignTeachers ? h('button', {
              className: 'btn btn-secondary',
              onClick: handleGlobalAutoAssign,
              id: 'admin_btn_auto_assign_classes',
              style: { marginRight: '8px' }
            }, 'Tự động phân công giáo viên') : null,
            canCreateClass ? h('button', {
              className: 'btn btn-primary',
              onClick: () => setShowClassModal(true),
              id: 'admin_btn_add_class'
            }, `+ ${t('actions.add')} ${t('tabs.classes')}`) : null
          ) : null
        )
      ),

      adminActiveSubTab === 'permissions' ? null : (
        h('div', { className: 'search-filter-strip-container', style: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' } },
          h('div', { className: 'search-filter-strip', style: { display: 'flex', gap: '10px', alignItems: 'center' } },
            h('div', { className: 'search-wrapper', style: { flex: 1 } },
              h('span', { className: 'search-icon' }, '🔍'),
              h('input', {
                type: 'text',
                placeholder: t('actions.searchPlaceholder'),
                value: adminSearchInput,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  setAdminSearchInput(val);
                },
                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    setAdminSearchQuery(adminSearchInput.trim());
                  }
                },
                id: 'admin_search_input'
              })
            ),
            h('button', {
              className: 'btn btn-primary',
              onClick: () => {
                setAdminSearchQuery(adminSearchInput.trim());
              },
              id: 'admin_btn_search_submit'
            }, `${t('actions.search')} 🔍`),
            adminSearchQuery ? h('button', {
              className: 'btn btn-secondary btn-sm',
              onClick: () => {
                setAdminSearchInput('');
                setAdminSearchQuery('');
              }
            }, `${t('actions.clearFilter')} ✕`) : null
          )
        )
      ),

      adminActiveSubTab === 'teachers' ? h('div', { className: 'data-table-container', id: 'admin_table_teachers_container' },
        h('table', { className: 'data-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, t('table.id')),
              h('th', null, t('table.name')),
              h('th', null, t('table.subject')),
              h('th', null, t('table.email')),
              h('th', null, t('table.password')),
              h('th', null, t('table.assignedClasses')),
              h('th', null, t('actions.autoAssign')),
              h('th', { style: { textAlign: 'right' } }, t('table.actions'))
            )
          ),
          h('tbody', null,
            paginatedTeachers.length === 0 ? h('tr', null,
              h('td', { colSpan: 8, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } },
                t('admin.noTeachersFound')
              )
            ) : paginatedTeachers.map(teacherItem =>
              h('tr', { key: teacherItem.id },
                h('td', null, h('span', { className: 'strong-id' }, teacherItem.code || teacherItem.id)),
                h('td', null, h('strong', null, teacherItem.name)),
                h('td', null,
                  teacherItem.subject ? h('span', { style: { fontWeight: '600', color: '#4E6C50' } }, formatSubject(teacherItem.subject)) :
                  h('span', { style: { fontStyle: 'italic', color: '#8E8E85' } }, t('admin.unassignedSubject'))
                ),
                h('td', null, teacherItem.email),
                h('td', null, h('code', null, teacherItem.password)),
                h('td', null,
                  h('div', { className: 'badge-container' },
                    teacherItem.assignedClasses && teacherItem.assignedClasses.length > 0 ? teacherItem.assignedClasses.map(c =>
                      h('span', { key: c, className: 'badge-class' },
                        c,
                        h('button', {
                          className: 'btn-remove-badge',
                          title: t('admin.tooltips.removeBadge'),
                          onClick: () => unenrollTeacherClass(teacherItem.id, c)
                        }, '×')
                      )
                    ) : h('span', { style: { color: '#8E8E85', fontSize: '0.8rem', fontStyle: 'italic' } }, t('admin.noClassesAssigned'))
                  )
                ),
                h('td', null,
                  canAssignTeachers ? h('button', {
                    className: 'btn btn-secondary btn-sm',
                    onClick: () => handleSingleTeacherAutoAssign(teacherItem.id),
                    title: 'Tự động xếp giáo viên này vào tất cả các lớp đang thiếu môn này (tối đa 2 lớp)',
                    id: `admin_btn_auto_assign_${teacherItem.id}`
                  }, 'Tự động phân công') : null
                ),
                h('td', null,
                  h('div', { className: 'action-btn-group' },
                    canManageMembers ? h('button', { className: 'icon-action-btn edit', onClick: () => openEditTeacher(teacherItem), title: t('admin.tooltips.editInfo') }, '✏️') : null,
                    canManageMembers ? h('button', { className: 'icon-action-btn edit', onClick: () => openResetPasswordModal(teacherItem), title: 'Reset mật khẩu (ngẫu nhiên 10 ký tự)' }, '🔑') : null,
                    canManageMembers ? h('button', { className: 'icon-action-btn delete', onClick: () => deleteTeacher(teacherItem.id), title: t('admin.tooltips.deleteAccount') }, '🗑️') : null
                  )
                )
              )
            )
          )
        ),
        h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px' } },
          h('div', null, formatPaginationInfo(totalTeachers === 0 ? 0 : (activeTeachersPage - 1) * PAGE_SIZE + 1, Math.min(totalTeachers, activeTeachersPage * PAGE_SIZE), totalTeachers, 'matchingTeachers')),
          renderPagination(activeTeachersPage, totalTeachersPages, setTeachersPage)
        )
      ) : null,

      adminActiveSubTab === 'students_grades' ? h('div', { className: 'data-table-container', id: 'admin_table_students_container' },
        h('table', { className: 'data-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, t('table.id')),
              h('th', null, t('table.name')),
              h('th', null, t('table.className')),
              h('th', null, t('table.email')),
              h('th', null, t('subjects.math')),
              h('th', null, t('subjects.literature')),
              h('th', null, t('subjects.english')),
              h('th', { style: { backgroundColor: '#E5E5DE', textAlign: 'center' } }, t('table.gpa')),
              h('th', { style: { textAlign: 'right' } }, t('table.actions'))
            )
          ),
          h('tbody', null,
            paginatedStudentGrades.length === 0 ? h('tr', null,
              h('td', { colSpan: 9, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } },
                t('admin.noStudentsFound')
              )
            ) : paginatedStudentGrades.map(r =>
              h('tr', { key: r.studentId },
                h('td', null, h('span', { className: 'strong-id' }, r.studentId)),
                h('td', null, h('strong', null, r.studentName)),
                h('td', null,
                  r.className && r.className !== 'Chưa xếp lớp' ?
                    h('span', { className: 'badge-class' }, r.className) :
                    h('span', { style: { color: '#8E8E85', fontSize: '0.85rem', fontStyle: 'italic' } }, t('classStatus.unassigned'))
                ),
                h('td', null, r.email),
                h('td', { className: r.grades.math === null ? 'not-graded' : '' },
                  r.grades.math !== null ? r.grades.math : t('admin.notGraded')
                ),
                h('td', { className: r.grades.literature === null ? 'not-graded' : '' },
                  r.grades.literature !== null ? r.grades.literature : t('admin.notGraded')
                ),
                h('td', { className: r.grades.english === null ? 'not-graded' : '' },
                  r.grades.english !== null ? r.grades.english : t('admin.notGraded')
                ),
                h('td', { className: 'gpa-cell' },
                  h('strong', { style: { color: r.gpa && r.gpa >= 5 ? '#4E6C50' : '#AA5656' } },
                    r.gpa !== null ? r.gpa : t('admin.noGpa')
                  )
                ),
                h('td', null,
                  h('div', { className: 'action-btn-group' },
                    h('button', { className: 'icon-action-btn view', onClick: () => setViewingGradeDetail(r), title: t('admin.tooltips.viewGradeDetail'), style: { padding: '4px 8px', fontSize: '1rem' } }, '👁️'),
                    canEnterGrades ? h('button', { className: 'icon-action-btn grade', onClick: () => openEditGrade(r.studentId, r.studentName, r.grades), title: t('admin.tooltips.editGrades') }, '💯') : null,
                    canManageMembers ? h('button', {
                      className: 'icon-action-btn edit',
                      onClick: () => {
                        const s = members.find(m => m.id === r.studentId);
                        if (s) openEditStudent(s);
                      },
                      title: t('admin.tooltips.editStudent')
                    }, '✏️') : null,
                    canManageMembers ? h('button', {
                      className: 'icon-action-btn edit',
                      onClick: () => {
                        const s = members.find(m => m.id === r.studentId) || ({
                          id: r.studentId,
                          code: r.studentId,
                          name: r.studentName,
                          email: r.email,
                          role: 'student' as Role,
                          className: r.className,
                          password: r.password
                        } as Member);
                        openResetPasswordModal(s);
                      },
                      title: 'Reset mật khẩu (ngẫu nhiên 10 ký tự)'
                    }, '🔑') : null,
                    canManageMembers ? h('button', { className: 'icon-action-btn delete', onClick: () => deleteStudent(r.studentId), title: t('admin.tooltips.deleteStudentAndGrades') }, '🗑️') : null
                  )
                )
              )
            )
          )
        ),
        h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px' } },
          h('div', null, formatPaginationInfo(totalStudentsGrades === 0 ? 0 : (activeStudentsGradesPage - 1) * PAGE_SIZE + 1, Math.min(totalStudentsGrades, activeStudentsGradesPage * PAGE_SIZE), totalStudentsGrades, 'matchingStudents')),
          renderPagination(activeStudentsGradesPage, totalStudentsGradesPages, setStudentsGradesPage)
        )
      ) : null,

      adminActiveSubTab === 'classes' ? h('div', { className: 'class-grid', id: 'admin_classes_grid' },
        classes.map(c => {
          const studentCount = typeof c.studentCount === 'number' ? c.studentCount : members.filter(m => m.role === 'student' && m.className === c.id).length;
          const teacherCount = typeof c.teacherCount === 'number' ? c.teacherCount : members.filter(m => m.role === 'teacher' && m.assignedClasses?.includes(c.id)).length;
          return h('div', {
            className: 'class-card',
            key: c.id,
            onClick: () => {
              setClassDetailsPage(1);
              setViewingClassId(c.id);
            },
            style: { cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }
          },
            canDeleteClass ? h('button', {
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
              title: t('admin.tooltips.deleteClass')
            }, '🗑️') : null,
            h('div', { className: 'class-icon' }, '📚'),
            h('div', { className: 'class-info' },
              h('h4', null, c.name ? (c.name.startsWith('Lớp') ? c.name : `${t('table.className')} ${c.name}`) : `${t('table.className')} ${c.code || c.id}`),
              h('p', null, `${t('table.id')}: ${c.code || c.id}`),
              h('p', { style: { marginTop: '4px', fontSize: '0.75rem', color: '#5A5A40' } },
                `👤 ${studentCount} ${t('roles.student')} | 💼 ${teacherCount} ${t('roles.teacher')}`
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
            h('p', { style: { fontWeight: 'bold', color: '#5A5A40' } }, `+ ${t('actions.addClass')}`)
          )
        )
      ) : null,

      adminActiveSubTab === 'members' ? h('div', { className: 'data-table-container', id: 'admin_table_members_container' },
        h('table', { className: 'data-table' },
          h('thead', null,
            h('tr', null,
              h('th', null, t('table.id')),
              h('th', null, t('table.name')),
              h('th', null, t('table.role')),
              h('th', null, t('table.email')),
              h('th', null, t('table.password')),
              h('th', null, t('table.className')),
              h('th', { style: { textAlign: 'right' } }, t('table.actions'))
            )
          ),
          h('tbody', null,
            paginatedMembers.map(m =>
              h('tr', {
                key: m.id,
                className: 'member-table-row'
              },
                h('td', null, h('span', { className: 'strong-id' }, m.code || m.id)),
                h('td', null, h('strong', null, formatUserName(m))),
                h('td', null,
                  h('span', { className: `badge-role ${m.role}` }, formatRole(m.role))
                ),
                h('td', null, m.email),
                h('td', null, h('code', null, m.password)),
                h('td', null,
                  m.role === 'student' ?
                    (m.className && m.className !== 'Chưa xếp lớp' ?
                      h('span', { className: 'badge-class' }, m.className) :
                      h('span', { style: { color: '#8E8E85', fontSize: '0.85rem', fontStyle: 'italic' } }, t('classStatus.unassigned'))
                    ) :
                    m.role === 'teacher' ?
                      h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, (m.assignedClasses || []).join(', ') || t('classStatus.unassigned')) :
                      h('span', { style: { color: '#8E8E85' } }, t('roles.admin'))
                ),
                h('td', { style: { textAlign: 'right' } },
                  canManageMembers ? h('button', {
                    className: 'icon-action-btn edit',
                    onClick: () => openResetPasswordModal(m),
                    title: 'Reset mật khẩu (ngẫu nhiên 10 ký tự)'
                  }, '🔑') : null
                )
              )
            )
          )
        ),
        h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px' } },
          h('div', null, formatPaginationInfo(totalMembers === 0 ? 0 : (activeMembersPage - 1) * PAGE_SIZE + 1, Math.min(totalMembers, activeMembersPage * PAGE_SIZE), totalMembers, 'matchingMembers')),
          renderPagination(activeMembersPage, totalMembersPages, setMembersPage)
        )
      ) : null,

      adminActiveSubTab === 'permissions' ? h('div', { className: 'rbac-matrix-section', id: 'admin_rbac_matrix_container' },
        rolePermissionStatus ? h('div', {
          className: `rbac-status-alert ${rolePermissionStatus.includes('thất bại') || rolePermissionStatus.includes('Error') ? 'error' : 'success'}`,
          style: {
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: rolePermissionStatus.includes('thất bại') || rolePermissionStatus.includes('Error') ? '#FEF2F2' : '#F0FDF4',
            color: rolePermissionStatus.includes('thất bại') || rolePermissionStatus.includes('Error') ? '#991B1B' : '#166534',
            border: `1px solid ${rolePermissionStatus.includes('thất bại') || rolePermissionStatus.includes('Error') ? '#FECACA' : '#BBF7D0'}`,
            marginBottom: '16px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        }, `🔔 ${rolePermissionStatus}`) : null,

        // Matrix Table
        h('div', { className: 'data-table-container rbac-table-card', style: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } },
          h('table', { className: 'data-table rbac-matrix-table', style: { width: '100%', borderCollapse: 'collapse' } },
            h('thead', null,
              h('tr', { style: { backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' } },
                h('th', { style: { padding: '14px 18px', textAlign: 'left', width: '42%', color: '#334155', fontWeight: 600 } }, t('rbac.columns.permission')),
                h('th', { style: { padding: '14px 18px', textAlign: 'center', width: '19%', color: '#991B1B' } },
                  h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                    h('span', { className: 'badge-role admin' }, t('rbac.columns.admin'))
                  )
                ),
                h('th', { style: { padding: '14px 18px', textAlign: 'center', width: '19%', color: '#92400E' } },
                  h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                    h('span', { className: 'badge-role teacher' }, t('rbac.columns.teacher'))
                  )
                ),
                h('th', { style: { padding: '14px 18px', textAlign: 'center', width: '20%', color: '#166534' } },
                  h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                    h('span', { className: 'badge-role student' }, t('rbac.columns.student'))
                  )
                )
              )
            ),
            h('tbody', null,
              (() => {
                const categories: { key: 'classes' | 'grades' | 'reports' | 'system'; titleKey: string }[] = [
                  { key: 'classes', titleKey: 'permissions.sections.classesTitle' },
                  { key: 'grades', titleKey: 'permissions.sections.gradesTitle' },
                  { key: 'reports', titleKey: 'permissions.sections.reportsTitle' },
                  { key: 'system', titleKey: 'permissions.sections.systemTitle' }
                ];

                return categories.map(cat => {
                  const itemsInCat = PERMISSION_MATRIX_ITEMS.filter(item => item.category === cat.key);
                  if (itemsInCat.length === 0) return null;

                  return h(React.Fragment, { key: cat.key },
                    h('tr', { className: 'rbac-category-row', style: { backgroundColor: '#F1F5F9', borderTop: '1px solid #CBD5E1', borderBottom: '1px solid #CBD5E1' } },
                      h('td', { colSpan: 4, style: { padding: '10px 18px', fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' } },
                        `${t(cat.titleKey)} `,
                        h('span', { style: { fontSize: '0.78rem', color: '#64748B', fontWeight: 'normal', marginLeft: '6px' } },
                          `(${itemsInCat.length} tính năng)`
                        )
                      )
                    ),
                    itemsInCat.map(item => {
                      const itemTitle = t(item.titleKey);
                      const itemDesc = t(item.descKey);

                      return h('tr', {
                        key: item.key,
                        className: 'rbac-matrix-item-row',
                        style: { borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }
                      },
                        h('td', { style: { padding: '12px 18px' } },
                          h('div', { style: { fontWeight: 600, color: '#1E293B', fontSize: '0.88rem', marginBottom: '2px' } }, itemTitle),
                          h('div', { style: { fontSize: '0.78rem', color: '#64748B', lineHeight: '1.35' } }, itemDesc)
                        ),
                        // Admin Cell
                        h('td', { style: { padding: '12px 18px', textAlign: 'center' } },
                          renderMatrixToggle('admin', item.key, !!rolePermissionsMatrix.admin?.[item.key], !!item.lockedRoles?.admin)
                        ),
                        // Teacher Cell
                        h('td', { style: { padding: '12px 18px', textAlign: 'center' } },
                          renderMatrixToggle('teacher', item.key, !!rolePermissionsMatrix.teacher?.[item.key], !!item.lockedRoles?.teacher)
                        ),
                        // Student Cell
                        h('td', { style: { padding: '12px 18px', textAlign: 'center' } },
                          renderMatrixToggle('student', item.key, !!rolePermissionsMatrix.student?.[item.key], !!item.lockedRoles?.student)
                        )
                      );
                    })
                  );
                });
              })()
            )
          )
        ),

        // Bottom Action Bar
        h('div', {
          className: 'rbac-footer-action-bar',
          style: {
            marginTop: '20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }
        },
          h('div', { style: { fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' } },
            t('rbac.globalNotice')
          ),
          h('div', { style: { display: 'flex', gap: '10px' } },
            h('button', {
              type: 'button',
              className: 'btn btn-secondary',
              onClick: resetRolePermissionsToDefault,
              id: 'admin_btn_rbac_bottom_reset'
            }, t('rbac.resetDefaults')),
            h('button', {
              type: 'button',
              className: 'btn btn-secondary',
              disabled: isSavingRolePermissions,
              onClick: handleSaveRolePermissions,
              id: 'admin_btn_rbac_bottom_save'
            }, isSavingRolePermissions ? t('rbac.saving') : t('rbac.saveChanges'))
          )
        )
      ) : null
    ),

    showTeacherModal ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, editingTeacher ? t('admin.editTeacherTitle') : t('admin.addTeacherTitle')),
          h('button', { className: 'btn-close-modal', onClick: () => setShowTeacherModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveTeacher },
          h('div', { className: 'modal-body' },
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.teacherIdLabel')),
              h('input', {
                type: 'text',
                value: teacherForm.id,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherForm(prev => ({ ...prev, id: e.target.value.toUpperCase() })),
                disabled: !!editingTeacher,
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.teacherNameLabel')),
              h('input', {
                type: 'text',
                value: teacherForm.name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherForm(prev => ({ ...prev, name: e.target.value })),
                placeholder: 'Ví dụ: Nguyễn Văn Toán',
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.teacherEmailLabel')),
              h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #E6E6E3',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff'
                }
              },
                h('input', {
                  type: 'text',
                  value: teacherForm.email.includes('@') ? teacherForm.email.split('@')[0] : teacherForm.email,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const cleanVal = e.target.value.replace(/@.*/, '').trim();
                    setTeacherForm(prev => ({ ...prev, email: cleanVal }));
                  },
                  placeholder: 'gv01',
                  required: true,
                  style: {
                    flex: 1,
                    border: 'none',
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }
                }),
                h('span', {
                  style: {
                    backgroundColor: '#F3F3EF',
                    padding: '8px 12px',
                    borderLeft: '1px solid #E6E6E3',
                    fontWeight: '600',
                    color: '#444441',
                    userSelect: 'none',
                    fontSize: '0.85rem'
                  }
                }, '@edu.com')
              )
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('table.password')),
              h('input', {
                type: 'text',
                value: teacherForm.password,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherForm(prev => ({ ...prev, password: e.target.value })),
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('table.subject')),
              h('select', {
                value: teacherForm.subject,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTeacherForm(prev => ({ ...prev, subject: e.target.value as any })),
                required: true
              },
                h('option', { value: 'math' }, t('subjects.math')),
                h('option', { value: 'literature' }, t('subjects.literature')),
                h('option', { value: 'english' }, t('subjects.english'))
              )
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('table.assignedClasses')),
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
                    ` ${t('table.className')} ${c.id} (${c.name})`
                  );
                })
              )
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowTeacherModal(false) }, t('actions.cancel')),
            h('button', { type: 'submit', className: 'btn btn-primary' }, t('admin.saveConfirm'))
          )
        )
      )
    ) : null,

    showStudentModal ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, editingStudent ? t('admin.editStudentTitle') : t('admin.addStudentTitle')),
          h('button', { className: 'btn-close-modal', onClick: () => setShowStudentModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveStudent },
          h('div', { className: 'modal-body' },
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.studentIdLabel')),
              h('input', {
                type: 'text',
                value: studentForm.id,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setStudentForm(prev => ({ ...prev, id: e.target.value.toUpperCase() })),
                disabled: !!editingStudent,
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.studentNameLabel')),
              h('input', {
                type: 'text',
                value: studentForm.name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setStudentForm(prev => ({ ...prev, name: e.target.value })),
                placeholder: 'Ví dụ: Lê Hoàng Nam',
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.studentEmailLabel')),
              h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #E6E6E3',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff'
                }
              },
                h('input', {
                  type: 'text',
                  value: studentForm.email.includes('@') ? studentForm.email.split('@')[0] : studentForm.email,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const cleanVal = e.target.value.replace(/@.*/, '').trim();
                    setStudentForm(prev => ({ ...prev, email: cleanVal }));
                  },
                  placeholder: 'hs001',
                  required: true,
                  style: {
                    flex: 1,
                    border: 'none',
                    padding: '8px 12px',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }
                }),
                h('span', {
                  style: {
                    backgroundColor: '#F3F3EF',
                    padding: '8px 12px',
                    borderLeft: '1px solid #E6E6E3',
                    fontWeight: '600',
                    color: '#444441',
                    userSelect: 'none',
                    fontSize: '0.85rem'
                  }
                }, '@gmail.com')
              )
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('table.password')),
              h('input', {
                type: 'text',
                value: studentForm.password,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setStudentForm(prev => ({ ...prev, password: e.target.value })),
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('table.className')),
              h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                h('select', {
                  value: studentForm.className,
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setStudentForm(prev => ({ ...prev, className: e.target.value })),
                  style: { flex: 1 }
                },
                  h('option', { value: '' }, t('admin.selectClassDefault')),
                  classes.map(c => h('option', { key: c.id, value: c.id }, `${t('table.className')} ${c.id} (${c.name})`))
                ),
                studentForm.className ? h('button', {
                  type: 'button',
                  className: 'btn btn-secondary btn-sm',
                  style: { whiteSpace: 'nowrap', color: '#AA5656', borderColor: '#AA5656', padding: '6px 10px' },
                  onClick: () => setStudentForm(prev => ({ ...prev, className: '' })),
                  title: t('admin.removeFromClass')
                }, `🚫 ${t('admin.removeFromClass')}`) : null
              )
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowStudentModal(false) }, t('actions.cancel')),
            h('button', { type: 'submit', className: 'btn btn-primary' }, t('admin.saveConfirm'))
          )
        )
      )
    ) : null,

    showGradeModal && editingGrade ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card', style: { maxWidth: '750px', width: '90%' } },
        h('div', { className: 'modal-header' },
          h('h3', null, `${t('admin.editGradesTitle')}: ${editingGrade.studentName}`),
          h('button', { className: 'btn-close-modal', onClick: () => setShowGradeModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveGrade },
          h('div', { className: 'modal-body', style: { padding: '20px', maxHeight: '75vh', overflowY: 'auto' } },
            h('p', { style: { fontSize: '0.8rem', color: '#8E8E85', marginBottom: '16px', fontFamily: 'sans-serif' } },
              t('admin.gradeNote')
            ),
            
            h('div', { style: { marginBottom: '20px', border: '1px solid #E6E6E3', borderRadius: '8px', padding: '16px', backgroundColor: '#F9F9F6' } },
              h('h4', { style: { fontWeight: '600', color: '#1C1C1A', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid #E6E6E3', paddingBottom: '6px' } }, t('subjects.math').toUpperCase()),
              h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' } },
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.oral')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.math_oral,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_oral: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.m15')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.math_m15,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_m15: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.mid')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.math_mid,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_mid: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.final')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.math_final,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_final: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                )
              )
            ),

            h('div', { style: { marginBottom: '20px', border: '1px solid #E6E6E3', borderRadius: '8px', padding: '16px', backgroundColor: '#F9F9F6' } },
              h('h4', { style: { fontWeight: '600', color: '#1C1C1A', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid #E6E6E3', paddingBottom: '6px' } }, t('subjects.literature').toUpperCase()),
              h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' } },
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.oral')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.literature_oral,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_oral: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.m15')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.literature_m15,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_m15: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.mid')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.literature_mid,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_mid: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.final')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.literature_final,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_final: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                )
              )
            ),

            h('div', { style: { marginBottom: '10px', border: '1px solid #E6E6E3', borderRadius: '8px', padding: '16px', backgroundColor: '#F9F9F6' } },
              h('h4', { style: { fontWeight: '600', color: '#1C1C1A', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid #E6E6E3', paddingBottom: '6px' } }, t('subjects.english').toUpperCase()),
              h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' } },
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.oral')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.english_oral,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_oral: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.m15')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.english_m15,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_m15: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.mid')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.english_mid,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_mid: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                ),
                h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                  h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.final')),
                  h('input', {
                    type: 'number', step: '0.1', min: '0', max: '10',
                    value: gradeForm.english_final,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_final: e.target.value })),
                    placeholder: t('admin.notGraded')
                  })
                )
              )
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowGradeModal(false) }, t('actions.cancel')),
            h('button', { type: 'submit', className: 'btn btn-primary' }, t('admin.updateGrades'))
          )
        )
      )
    ) : null,

    showClassModal ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, t('admin.addClassTitle')),
          h('button', { className: 'btn-close-modal', onClick: () => setShowClassModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveClass },
          h('div', { className: 'modal-body' },
            classError ? h('div', { className: 'error-alert' }, classError) : null,
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.classIdLabel')),
              h('input', {
                type: 'text',
                value: classForm.id,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setClassForm(prev => ({ ...prev, id: e.target.value })),
                placeholder: t('admin.classIdPlaceholder'),
                required: true
              })
            ),
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.classNameLabel')),
              h('input', {
                type: 'text',
                value: classForm.name,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setClassForm(prev => ({ ...prev, name: e.target.value })),
                placeholder: t('admin.classNamePlaceholder'),
                required: true
              })
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowClassModal(false) }, t('actions.cancel')),
            h('button', { type: 'submit', className: 'btn btn-primary' }, t('admin.registerClass'))
          )
        )
      )
    ) : null,

    showEnrollModal && enrollTarget ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, t('admin.enrollTitle')),
          h('button', { className: 'btn-close-modal', onClick: () => setShowEnrollModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveEnroll },
          h('div', { className: 'modal-body' },
            h('p', { style: { marginBottom: '16px', fontSize: '0.9rem' } },
              t('admin.enrollTextPrefix'), ' ', h('strong', null, enrollTarget.name), ` (${enrollTarget.type === 'student' ? t('roles.student') : t('roles.teacher')}) ${t('admin.enrollTextSuffix')}`
            ),
            enrollTarget.type === 'teacher' ? h('div', { style: { marginBottom: '16px', padding: '10px', backgroundColor: '#F4F4F0', borderRadius: '6px', border: '1px solid #E5E5DE' } },
              h('button', {
                type: 'button',
                className: 'btn btn-secondary btn-sm',
                onClick: () => {
                  setShowEnrollModal(false);
                  handleSingleTeacherAutoAssign(enrollTarget.id);
                },
                style: { width: '100%' }
              }, `Tự động xếp ${enrollTarget.name} vào các lớp đang thiếu môn này`)
            ) : null,
            h('div', { className: 'modal-form-group' },
              h('label', null, t('admin.assignedClassLabel')),
              h('select', {
                value: selectedEnrollClass,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEnrollClass(e.target.value),
                required: true
              },
                h('option', { value: '' }, t('admin.selectClassPrompt')),
                classes.map(c => h('option', { key: c.id, value: c.id }, `${t('table.className')} ${c.id} (${c.name})`))
              )
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowEnrollModal(false) }, t('actions.cancel')),
            h('button', { type: 'submit', className: 'btn btn-primary' }, t('admin.confirmEnroll'))
          )
        )
      )
    ) : null,

    viewingClassId ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card', style: { maxWidth: '750px', width: '90%' } },
        h('div', { className: 'modal-header' },
          h('h3', null, `${t('classDetails.title')}: ${viewingClassId}`),
          h('button', { className: 'btn-close-modal', onClick: () => setViewingClassId(null) }, '✕')
        ),
        h('div', { className: 'modal-body', style: { maxHeight: '70vh', overflowY: 'auto' } },
          h('div', { style: { marginBottom: '20px' } },
            h('h4', { style: { color: '#5A5A40', marginBottom: '8px', borderBottom: '2px solid #E5E5DE', paddingBottom: '4px' } }, `💼 ${t('classDetails.assignedTeachers')}`),
            (() => {
              const classTeachers = members.filter(m => m.role === 'teacher' && m.assignedClasses?.includes(viewingClassId));
              if (classTeachers.length === 0) {
                return h('p', { style: { fontStyle: 'italic', color: '#8E8E85', fontSize: '0.9rem', padding: '10px 0' } }, t('classDetails.noTeachers'));
              }
              return h('table', { className: 'data-table', style: { fontSize: '0.9rem' } },
                h('thead', null,
                  h('tr', null,
                    h('th', null, t('table.name')),
                    h('th', null, t('table.subject')),
                    h('th', null, t('table.email'))
                  )
                ),
                h('tbody', null,
                  classTeachers.map(tItem =>
                    h('tr', { key: tItem.id },
                      h('td', null, h('strong', null, tItem.name)),
                      h('td', null, formatSubject(tItem.subject)),
                      h('td', null, tItem.email)
                    )
                  )
                )
              );
            })()
          ),
          h('div', null,
            h('h4', { style: { color: '#5A5A40', marginBottom: '8px', borderBottom: '2px solid #E5E5DE', paddingBottom: '4px' } }, `👤 ${t('classDetails.studentList')}`),
            (() => {
              const classStudents = members.filter(m => m.role === 'student' && m.className === viewingClassId);
              if (classStudents.length === 0) {
                return h('p', { style: { fontStyle: 'italic', color: '#8E8E85', fontSize: '0.9rem', padding: '10px 0' } }, t('classDetails.noStudents'));
              }
              const totalClassStudentsPages = Math.ceil(classStudents.length / PAGE_SIZE) || 1;
              const activeClassStudentsPage = Math.min(classDetailsPage, totalClassStudentsPages);
              const paginatedClassStudents = classStudents.slice((activeClassStudentsPage - 1) * PAGE_SIZE, activeClassStudentsPage * PAGE_SIZE);

              return h(React.Fragment, null,
                h('table', { className: 'data-table', style: { fontSize: '0.9rem' } },
                  h('thead', null,
                    h('tr', null,
                      h('th', null, t('table.id')),
                      h('th', null, t('table.name')),
                      h('th', null, t('table.email')),
                      h('th', { style: { textAlign: 'center' } }, t('subjects.math')),
                      h('th', { style: { textAlign: 'center' } }, t('subjects.literature')),
                      h('th', { style: { textAlign: 'center' } }, t('subjects.english')),
                      h('th', { style: { textAlign: 'center' } }, t('table.gpa')),
                      h('th', { style: { textAlign: 'center' } }, t('table.actions'))
                    )
                  ),
                  h('tbody', null,
                    paginatedClassStudents.map(s => {
                      const grades = gradesMap[s.id] || { math: null, literature: null, english: null };
                      const gpa = calculateGpa(grades);
                      const studentRecord: StudentGradeRecord = {
                        studentId: s.id,
                        studentName: s.name,
                        className: s.className || viewingClassId,
                        email: s.email,
                        password: s.password || '123',
                        grades,
                        gpa
                      };
                      return h('tr', { key: s.id },
                        h('td', null, h('span', { className: 'strong-id' }, s.code || s.id)),
                        h('td', null, h('strong', null, s.name)),
                        h('td', null, s.email),
                        h('td', { style: { textAlign: 'center' }, className: grades.math === null ? 'not-graded' : '' }, grades.math !== null ? grades.math : t('admin.notGraded')),
                        h('td', { style: { textAlign: 'center' }, className: grades.literature === null ? 'not-graded' : '' }, grades.literature !== null ? grades.literature : t('admin.notGraded')),
                        h('td', { style: { textAlign: 'center' }, className: grades.english === null ? 'not-graded' : '' }, grades.english !== null ? grades.english : t('admin.notGraded')),
                        h('td', { style: { textAlign: 'center', fontWeight: 'bold' } }, gpa !== null ? gpa : t('admin.noGpa')),
                        h('td', { style: { textAlign: 'center' } },
                          h('div', { className: 'action-btn-group', style: { justifyContent: 'center' } },
                            h('button', { className: 'icon-action-btn view', onClick: () => setViewingGradeDetail(studentRecord), title: t('admin.tooltips.viewGradeDetail'), style: { padding: '2px 6px', fontSize: '0.9rem' } }, '👁️'),
                            canUnenrollStudents ? h('button', {
                              className: 'icon-action-btn delete',
                              onClick: () => unenrollStudentClass(s.id, viewingClassId),
                              title: t('admin.tooltips.withdrawStudent'),
                              style: { padding: '2px 6px', fontSize: '0.9rem' }
                            }, '🚫') : null
                          )
                        )
                      );
                    })
                  )
                ),
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '12px', fontSize: '0.85rem', color: '#5A5A40' } },
                  h('div', null, formatPaginationInfo(classStudents.length === 0 ? 0 : (activeClassStudentsPage - 1) * PAGE_SIZE + 1, Math.min(classStudents.length, activeClassStudentsPage * PAGE_SIZE), classStudents.length, 'classStudents')),
                  renderPagination(activeClassStudentsPage, totalClassStudentsPages, setClassDetailsPage)
                )
              );
            })()
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setViewingClassId(null) }, t('classDetails.close'))
        )
      )
    ) : null,

    viewingGradeDetail ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card', style: { maxWidth: '700px', width: '90%' } },
        h('div', { className: 'modal-header' },
          h('h3', null, `👁️ ${t('gradeDetail.modalTitle')}: ${viewingGradeDetail.studentName}`),
          h('button', { className: 'btn-close-modal', onClick: () => setViewingGradeDetail(null) }, '✕')
        ),
        h('div', { className: 'modal-body', style: { padding: '20px' } },
          h('div', { style: { marginBottom: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap', backgroundColor: '#F8F9FA', padding: '12px', borderRadius: '6px', border: '1px solid #E9ECEF' } },
            h('p', { style: { margin: 0, fontSize: '0.9rem' } }, h('strong', null, `${t('gradeDetail.studentId')}: `), viewingGradeDetail.studentId),
            h('p', { style: { margin: 0, fontSize: '0.9rem' } }, h('strong', null, `${t('gradeDetail.className')}: `), viewingGradeDetail.className),
            h('p', { style: { margin: 0, fontSize: '0.9rem' } }, h('strong', null, `${t('gradeDetail.email')}: `), viewingGradeDetail.email)
          ),
          h('div', { className: 'data-table-container' },
            h('table', { className: 'data-table' },
              h('thead', null,
                h('tr', null,
                  h('th', null, t('gradeDetail.subject')),
                  h('th', { style: { textAlign: 'center' } }, t('components.oral')),
                  h('th', { style: { textAlign: 'center' } }, t('components.m15')),
                  h('th', { style: { textAlign: 'center' } }, t('components.mid')),
                  h('th', { style: { textAlign: 'center' } }, t('components.final')),
                  h('th', { style: { backgroundColor: '#E5E5DE', textAlign: 'center', fontWeight: 'bold' } }, t('components.subjectGpa'))
                )
              ),
              h('tbody', null,
                [
                  { key: 'math', name: t('subjects.math') },
                  { key: 'literature', name: t('subjects.literature') },
                  { key: 'english', name: t('subjects.english') }
                ].map(sub => {
                  const oralVal = viewingGradeDetail.grades[`${sub.key}_oral` as keyof SubjectGrades];
                  const m15Val = viewingGradeDetail.grades[`${sub.key}_m15` as keyof SubjectGrades];
                  const midVal = viewingGradeDetail.grades[`${sub.key}_mid` as keyof SubjectGrades];
                  const finalVal = viewingGradeDetail.grades[`${sub.key}_final` as keyof SubjectGrades];
                  const subjectGpa = viewingGradeDetail.grades[sub.key as keyof SubjectGrades];

                  return h('tr', { key: sub.key },
                    h('td', null, h('strong', null, sub.name)),
                    h('td', { style: { textAlign: 'center' }, className: oralVal === null || oralVal === undefined ? 'not-graded' : '' },
                      oralVal !== null && oralVal !== undefined ? oralVal : '-'
                    ),
                    h('td', { style: { textAlign: 'center' }, className: m15Val === null || m15Val === undefined ? 'not-graded' : '' },
                      m15Val !== null && m15Val !== undefined ? m15Val : '-'
                    ),
                    h('td', { style: { textAlign: 'center' }, className: midVal === null || midVal === undefined ? 'not-graded' : '' },
                      midVal !== null && midVal !== undefined ? midVal : '-'
                    ),
                    h('td', { style: { textAlign: 'center' }, className: finalVal === null || finalVal === undefined ? 'not-graded' : '' },
                      finalVal !== null && finalVal !== undefined ? finalVal : '-'
                    ),
                    h('td', { style: { textAlign: 'center', backgroundColor: '#F5F5F0' } },
                      h('strong', { style: { color: subjectGpa && subjectGpa >= 5 ? '#4E6C50' : '#AA5656' } },
                        subjectGpa !== null && subjectGpa !== undefined ? subjectGpa : t('admin.noGpa')
                      )
                    )
                  );
                })
              )
            )
          ),
          h('div', { style: { marginTop: '16px', textAlign: 'right', fontSize: '0.95rem' } },
            h('span', null, `${t('gradeDetail.overallGpa')}: `),
            h('strong', { style: { fontSize: '1.2rem', color: viewingGradeDetail.gpa && viewingGradeDetail.gpa >= 5 ? '#4E6C50' : '#AA5656', marginLeft: '6px' } },
              viewingGradeDetail.gpa !== null && viewingGradeDetail.gpa !== undefined ? viewingGradeDetail.gpa : t('admin.noGpa')
            )
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setViewingGradeDetail(null) }, t('classDetails.close'))
        )
      )
    ) : null,

    resetModalData.show && resetModalData.user ? (() => {
      const targetUser = resetModalData.user;
      return h('div', { className: 'modal-backdrop', style: { zIndex: 9999 } },
        h('div', { className: 'modal-card', style: { maxWidth: '520px', width: '90%' } },
          h('div', { className: 'modal-header' },
            h('h3', null, '🔑 Reset Mật Khẩu Tài Khoản'),
            h('button', {
              className: 'btn-close-modal',
              onClick: () => setResetModalData({ show: false, user: null })
            }, '✕')
          ),
          h('div', { className: 'modal-body', style: { padding: '24px' } },
            !resetModalData.rawPassword ? h(React.Fragment, null,
              h('p', { style: { fontSize: '0.95rem', color: '#334155', marginBottom: '16px' } },
                'Bạn có chắc chắn muốn đặt lại (reset) mật khẩu cho tài khoản dưới đây không?'
              ),
              h('div', {
                style: {
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px'
                }
              },
                h('div', { style: { marginBottom: '6px' } }, h('strong', null, 'Họ và tên: '), formatUserName(targetUser)),
                h('div', { style: { marginBottom: '6px' } }, h('strong', null, 'Mã ID: '), targetUser.code || targetUser.id),
                h('div', { style: { marginBottom: '6px' } }, h('strong', null, 'Email: '), targetUser.email),
                h('div', null, h('strong', null, 'Vai trò: '), formatRole(targetUser.role || 'student'))
              ),
              h('div', {
                style: {
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#1E40AF',
                  fontSize: '0.88rem',
                  lineHeight: '1.4'
                }
              }, '🔒 Hệ thống sẽ sử dụng thuật toán SecureRandom sinh mật khẩu ngẫu nhiên có độ dài đúng 10 ký tự (đảm bảo luôn chứa tối thiểu 1 chữ thường a-z, 1 chữ hoa A-Z và 1 chữ số 0-9). Người dùng sẽ sử dụng mật khẩu mới này để đăng nhập.')
            ) : h(React.Fragment, null,
              h('div', {
                style: {
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  color: '#065F46',
                  fontWeight: 600
                }
              }, '🎉 Mật khẩu đã được Reset thành công bằng SecureRandom!'),

              h('div', { style: { marginBottom: '8px', fontSize: '0.9rem', color: '#475569' } },
                `Mật khẩu mới (10 ký tự) của ${formatUserName(targetUser)} (${targetUser.code || targetUser.id}):`
              ),

              h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#0F172A',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  gap: '8px'
                }
              },
                h('input', {
                  type: 'text',
                  readOnly: true,
                  value: resetModalData.rawPassword || '',
                  onFocus: (e: any) => e.target.select(),
                  onClick: (e: any) => e.target.select(),
                  style: {
                    background: 'transparent',
                    border: 'none',
                    color: '#38BDF8',
                    fontFamily: 'monospace',
                    fontSize: '1.25rem',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer'
                  }
                }),
                h('button', {
                  type: 'button',
                  onClick: () => {
                    const txt = resetModalData.rawPassword || '';
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(txt).catch(() => {});
                      }
                      const el = document.createElement('textarea');
                      el.value = txt;
                      el.setAttribute('readonly', '');
                      el.style.position = 'fixed';
                      el.style.left = '-9999px';
                      document.body.appendChild(el);
                      el.focus();
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                    } catch (_) {}
                    setResetModalData(prev => ({ ...prev, copied: true }));
                  },
                  style: {
                    backgroundColor: resetModalData.copied ? '#10B981' : '#3B82F6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s ease'
                  }
                }, resetModalData.copied ? 'Đã copy! ✓' : 'Copy mật khẩu 📋')
              ),

            )
          ),
          h('div', { className: 'modal-footer' },
            !resetModalData.rawPassword ? h(React.Fragment, null,
              h('button', {
                type: 'button',
                className: 'btn btn-secondary',
                onClick: () => setResetModalData({ show: false, user: null }),
                disabled: resetModalData.loading
              }, 'Hủy bỏ'),
              h('button', {
                type: 'button',
                className: 'btn btn-primary',
                onClick: () => confirmResetPassword(),
                disabled: resetModalData.loading,
                style: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' }
              }, resetModalData.loading ? 'Đang tạo...' : 'Sinh mật khẩu ngẫu nhiên ')
            ) : h('button', {
              type: 'button',
              className: 'btn btn-primary',
              onClick: () => setResetModalData({ show: false, user: null })
            }, 'Hoàn tất & Đóng')
          )
        )
      );
    })() : null
  );
}
