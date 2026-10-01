import React, { useState, useEffect } from 'react';
import { Member, SubjectGrades, StudentGradeRecord } from '../../types';
import { calculateGpa, handleExportCsv } from '../../utils';
import { t, formatSubject, formatRole, formatClassName, formatUserName, formatPaginationInfo } from '../../i18n';

interface TeacherWorkspaceProps {
  currentUser: Member;
  members: Member[];
  gradesMap: { [studentId: string]: SubjectGrades };
  setGradesMap: React.Dispatch<React.SetStateAction<{ [studentId: string]: SubjectGrades }>>;
}

const h = React.createElement;

const safeFloat = (v: any): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const num = parseFloat(v);
  return isNaN(num) ? null : num;
};

export default function TeacherWorkspace({ currentUser, gradesMap, setGradesMap }: TeacherWorkspaceProps) {
  const canEnterGrades = currentUser.permissions
    ? (currentUser.permissions.teacherEnterGrades ?? (currentUser.permissions.editMathGrades || currentUser.permissions.editLiteratureGrades || currentUser.permissions.editEnglishGrades || false))
    : true;
  const canViewAssignedGrades = currentUser.permissions?.teacherViewAssignedClassGrades ?? (currentUser.permissions?.viewClassGrades ?? true);
  const canViewStudentList = currentUser.permissions?.teacherViewStudentList ?? true;
  const canExportCsv = currentUser.permissions?.exportCsvReports ?? true;

  const [teacherSearchInput, setTeacherSearchInput] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherActiveSubTab, setTeacherActiveSubTab] = useState<'grades' | 'members'>('grades');

  const [teacherGradesPage, setTeacherGradesPage] = useState(1);
  const [teacherMembersPage, setTeacherMembersPage] = useState(1);

  const [paginatedTeacherGrades, setPaginatedTeacherGrades] = useState<StudentGradeRecord[]>([]);
  const [totalTeacherGrades, setTotalTeacherGrades] = useState(0);

  const [paginatedTeacherMembers, setPaginatedTeacherMembers] = useState<Member[]>([]);
  const [totalTeacherMembers, setTotalTeacherMembers] = useState(0);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  useEffect(() => {
    setTeacherGradesPage(1);
    setTeacherMembersPage(1);
  }, [teacherSearchQuery, teacherActiveSubTab]);

  useEffect(() => {
    setTeacherSearchInput('');
    setTeacherSearchQuery('');
  }, [teacherActiveSubTab]);

  useEffect(() => {
    if (teacherActiveSubTab !== 'grades') return;
    let isMounted = true;
    async function loadTeacherGrades() {
      const PAGE_SIZE = 10;
      const assignedClasses = currentUser.assignedClasses || [];
      try {
        const classesParam = assignedClasses.join(',');
        const url = `/api/grades?page=${teacherGradesPage}&size=${PAGE_SIZE}&classes=${encodeURIComponent(classesParam)}&search=${encodeURIComponent(teacherSearchQuery)}&currentUserId=${encodeURIComponent(currentUser.id)}`;
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json') && isMounted) {
          const data = await res.json();
          const records: StudentGradeRecord[] = (data.content || []).map((r: any) => ({
            studentId: r.studentCode || r.code || r.studentId,
            studentName: r.studentName,
            className: r.className,
            email: r.email,
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
              english_final: safeFloat(r.english_final),
            },
            gpa: safeFloat(r.gpa)
          }));

          setTotalTeacherGrades(data.totalElements || 0);
          setPaginatedTeacherGrades(records);

          const map: { [studentId: string]: SubjectGrades } = {};
          records.forEach(rec => {
            map[rec.studentId] = rec.grades;
          });
          setGradesMap(prev => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error("Error loading teacher grades:", err);
      }
    }
    loadTeacherGrades();
    return () => {
      isMounted = false;
    };
  }, [teacherActiveSubTab, teacherGradesPage, teacherSearchQuery, refreshTrigger, currentUser.id]);

  useEffect(() => {
    if (teacherActiveSubTab !== 'members') return;
    let isMounted = true;
    async function loadTeacherMembers() {
      const PAGE_SIZE = 10;
      const assignedClasses = currentUser.assignedClasses || [];
      try {
        const classesParam = assignedClasses.join(',');
        const res = await fetch(`/api/members?page=${teacherMembersPage}&size=${PAGE_SIZE}&classes=${encodeURIComponent(classesParam)}&search=${encodeURIComponent(teacherSearchQuery)}&currentUserId=${encodeURIComponent(currentUser.id)}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json') && isMounted) {
          const data = await res.json();
          setTotalTeacherMembers(data.totalElements || 0);
          setPaginatedTeacherMembers(data.content || []);
        }
      } catch (err) {
        console.error("Error loading teacher members:", err);
      }
    }
    loadTeacherMembers();
    return () => {
      isMounted = false;
    };
  }, [teacherActiveSubTab, teacherMembersPage, teacherSearchQuery, refreshTrigger, currentUser.id]);

  const PAGE_SIZE = 10;

  const totalTeacherGradesPages = Math.ceil(totalTeacherGrades / PAGE_SIZE) || 1;
  const activeTeacherGradesPage = Math.min(teacherGradesPage, totalTeacherGradesPages);

  const totalTeacherMembersPages = Math.ceil(totalTeacherMembers / PAGE_SIZE) || 1;
  const activeTeacherMembersPage = Math.min(teacherMembersPage, totalTeacherMembersPages);

  const getSubjectName = (sub?: string) => {
    return formatSubject(sub || 'math');
  };

  const getTeacherAssignedClasses = (): string[] => {
    return currentUser.assignedClasses || [];
  };

  const exportAllGradesCsv = async () => {
    if (!canExportCsv) {
      alert(t('permissions.accessDenied') || 'Bạn không có quyền xuất dữ liệu CSV!');
      return;
    }
    try {
      const assignedClasses = currentUser.assignedClasses || [];
      const classesParam = assignedClasses.join(',');
      let url = `/api/grades?classes=${encodeURIComponent(classesParam)}&currentUserId=${encodeURIComponent(currentUser.id)}&page=1&size=9999`;
      if (teacherSearchQuery) {
        url += `&search=${encodeURIComponent(teacherSearchQuery)}`;
      }
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const records: StudentGradeRecord[] = (data.content || []).map((r: any) => ({
          studentId: r.studentCode || r.code || r.studentId,
          studentName: r.studentName,
          className: r.className,
          email: r.email,
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
            english_final: safeFloat(r.english_final),
          },
          gpa: safeFloat(r.gpa)
        }));
        const filename = teacherSearchQuery 
          ? `grades_${teacherSearchQuery.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
          : `grades_all_${currentUser.id}.csv`;
        handleExportCsv(filename, records);
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

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

    const PAGE_WINDOW = 10;
    const startPage = currentPage;
    const endPage = Math.min(currentPage + PAGE_WINDOW - 1, totalPages);

    if (startPage > 1) {
      buttons.push(h('button', {
        key: 'group-prev',
        className: 'btn-pagination group-nav',
        onClick: (e: any) => { e.preventDefault(); onPageChange(1); },
        title: 'Về trang 1',
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

  useEffect(() => {
    if (!canViewStudentList && teacherActiveSubTab === 'members') {
      setTeacherActiveSubTab('grades');
    }
  }, [canViewStudentList, teacherActiveSubTab]);

  const openEditGrade = (studentId: string, studentName: string, grades: SubjectGrades) => {
    if (!canEnterGrades) return;
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

  const saveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !canEnterGrades) return;

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
      english_oral, english_m15, english_mid, english_final,
      updatedBy: currentUser.id
    };

    try {
      const res = await fetch(`/api/grades/${editingGrade.studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setGradesMap(prev => ({
          ...prev,
          [editingGrade.studentId]: {
            ...prev[editingGrade.studentId],
            ...bodyData
          }
        }));
        setRefreshTrigger(prev => prev + 1);
        setShowGradeModal(false);
      }
    } catch (err) {
      console.warn('Error saving grade:', err);
    }
  };

  return h(React.Fragment, null,
    h('aside', { className: 'dashboard-sidebar', id: 'teacher_sidebar_menu' },
      h('div', { className: 'sidebar-section' },
        h('div', { className: 'sidebar-section-title' }, t('table.subject')),
        h('div', { style: { padding: '0 8px 12px', fontSize: '0.8rem', color: '#5A5A40', lineHeight: '1.4', borderBottom: '1px solid #E5E5DE', marginBottom: '8px' } },
          h('div', { style: { marginBottom: '6px' } }, 
            `${t('table.subject')}: `, h('strong', null, getSubjectName(currentUser.subject))
          ),
          h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' } },
            getTeacherAssignedClasses().map(c =>
              h('span', { key: c, className: 'badge-class', style: { backgroundColor: '#5A5A40', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' } }, c)
            ),
            getTeacherAssignedClasses().length === 0 ? h('span', { style: { color: '#AA5656', fontStyle: 'italic' } }, formatClassName('unassigned')) : null
          )
        ),
        h('button', { 
          className: `sidebar-btn ${teacherActiveSubTab === 'grades' ? 'active' : ''}`, 
          id: 'teacher_menu_grades_action',
          onClick: () => setTeacherActiveSubTab('grades')
        }, `📊 ${t('tabs.studentsGrades')}`),
        canViewStudentList ? h('button', { 
          className: `sidebar-btn ${teacherActiveSubTab === 'members' ? 'active' : ''}`, 
          id: 'teacher_menu_members_action',
          onClick: () => setTeacherActiveSubTab('members')
        }, `👥 ${t('tabs.allMembers')}`) : null
      ),
      canExportCsv ? h('div', { className: 'sidebar-section' },
        h('button', {
          className: 'sidebar-btn',
          onClick: () => {
            if (!canExportCsv) {
              alert(t('permissions.accessDenied') || 'Bạn không có quyền xuất dữ liệu CSV!');
              return;
            }
            handleExportCsv(`grades_page_${activeTeacherGradesPage}.csv`, paginatedTeacherGrades);
          },
          id: 'teacher_menu_export_current'
        }, `📥 ${t('exportCsv')} (${activeTeacherGradesPage})`),
        h('button', {
          className: 'sidebar-btn',
          onClick: () => {
            if (!canExportCsv) {
              alert(t('permissions.accessDenied') || 'Bạn không có quyền xuất dữ liệu CSV!');
              return;
            }
            exportAllGradesCsv();
          },
          id: 'teacher_menu_export_all'
        }, `📥 ${t('exportCsv')} (All)`)
      ) : null
    ),

    h('main', { className: 'workspace-content', id: 'teacher_workspace_content' },
      h('div', { className: 'workspace-header' },
        h('div', null,
          h('h1', null, t('roles.teacher')),
          h('p', { style: { color: '#8E8E85', fontSize: '0.85rem', marginTop: '4px', fontFamily: 'sans-serif' } },
            `${t('welcome')}, `, h('strong', null, formatUserName(currentUser)), ' (', h('strong', { style: { color: '#4E6C50' } }, getSubjectName(currentUser.subject)), ').'
          )
        )
      ),

      h('div', { className: 'search-filter-strip-container', style: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' } },
        h('div', { className: 'search-filter-strip', style: { display: 'flex', gap: '10px', alignItems: 'center' } },
          h('div', { className: 'search-wrapper', style: { flex: 1 } },
            h('span', { className: 'search-icon' }, '🔍'),
            h('input', {
              type: 'text',
              placeholder: t('actions.searchPlaceholder'),
              value: teacherSearchInput,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherSearchInput(e.target.value),
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  setTeacherSearchQuery(teacherSearchInput.trim());
                }
              },
              id: 'teacher_search_input'
            })
          ),
          h('button', {
            className: 'btn btn-primary',
            onClick: () => setTeacherSearchQuery(teacherSearchInput.trim()),
            id: 'teacher_btn_search_submit'
          }, `${t('actions.search')} 🔍`),
          teacherSearchQuery ? h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: () => {
              setTeacherSearchInput('');
              setTeacherSearchQuery('');
            }
          }, `${t('actions.clearFilter')} ✕`) : null
        )
      ),

      teacherActiveSubTab === 'grades' ? h('div', { className: 'panel', style: { marginBottom: '24px' } },
        h('div', { className: 'workspace-header', style: { marginBottom: '14px' } },
          h('h3', { style: { fontSize: '1.15rem', color: '#3D3D38' } }, `📈 ${t('tabs.studentsGrades')}`)
        ),

        !canViewAssignedGrades ? h('div', {
          style: {
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FECACA',
            padding: '16px 20px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }
        },
          h('span', { style: { fontSize: '1.4rem' } }, '🔒'),
          h('div', null,
            h('strong', null, 'Quyền xem bảng điểm bị khóa: '),
            'Tài khoản Giáo viên hiện chưa được cấp quyền xem bảng điểm của các lớp phụ trách.'
          )
        ) : h('div', { className: 'data-table-container' },
          h('table', { className: 'data-table' },
            h('thead', null,
              h('tr', null,
                h('th', null, t('table.id')),
                h('th', null, t('table.name')),
                h('th', null, t('table.className')),
                h('th', null, t('table.email')),
                h('th', null, t('components.oral')),
                h('th', null, t('components.m15')),
                h('th', null, t('components.mid')),
                h('th', null, t('components.final')),
                h('th', { style: { backgroundColor: '#E5E5DE', textAlign: 'center' } }, t('components.subjectGpa')),
                h('th', { style: { textAlign: 'right' } }, t('table.actions'))
              )
            ),
            h('tbody', null,
              paginatedTeacherGrades.length === 0 ? h('tr', null,
                h('td', { colSpan: 10, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } }, '---')
              ) : paginatedTeacherGrades.map(r => {
                  const sub = currentUser.subject || 'math';
                  const oralVal = r.grades[`${sub}_oral` as keyof SubjectGrades];
                  const m15Val = r.grades[`${sub}_m15` as keyof SubjectGrades];
                  const midVal = r.grades[`${sub}_mid` as keyof SubjectGrades];
                  const finalVal = r.grades[`${sub}_final` as keyof SubjectGrades];
                  const subjectGpa = r.grades[sub as keyof SubjectGrades];

                  return h('tr', { key: r.studentId },
                    h('td', null, h('span', { className: 'strong-id' }, r.studentId)),
                    h('td', null, h('strong', null, r.studentName)),
                    h('td', null, h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, formatClassName(r.className))),
                    h('td', null, r.email),
                    h('td', { className: oralVal === null || oralVal === undefined ? 'not-graded' : '' }, oralVal !== null && oralVal !== undefined ? oralVal : '---'),
                    h('td', { className: m15Val === null || m15Val === undefined ? 'not-graded' : '' }, m15Val !== null && m15Val !== undefined ? m15Val : '---'),
                    h('td', { className: midVal === null || midVal === undefined ? 'not-graded' : '' }, midVal !== null && midVal !== undefined ? midVal : '---'),
                    h('td', { className: finalVal === null || finalVal === undefined ? 'not-graded' : '' }, finalVal !== null && finalVal !== undefined ? finalVal : '---'),
                    h('td', { className: 'gpa-cell' },
                      h('strong', { style: { color: subjectGpa && subjectGpa >= 5 ? '#4E6C50' : '#AA5656' } },
                        subjectGpa !== null && subjectGpa !== undefined ? subjectGpa : '---'
                      )
                    ),
                    h('td', null,
                      h('div', { className: 'action-btn-group' },
                        h('button', {
                          className: 'btn btn-secondary btn-sm',
                          disabled: !canEnterGrades,
                          title: !canEnterGrades ? 'Chưa được cấp quyền sửa điểm / Permission denied' : '',
                          style: !canEnterGrades ? { opacity: 0.5, cursor: 'not-allowed' } : {},
                          onClick: () => canEnterGrades && openEditGrade(r.studentId, r.studentName, r.grades)
                        }, `✏️ ${t('actions.edit')}`)
                      )
                    )
                  );
                })
            )
          ),
          h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px', borderTop: '1px solid #E5E5DE' } },
            h('div', null, formatPaginationInfo(totalTeacherGrades === 0 ? 0 : (activeTeacherGradesPage - 1) * PAGE_SIZE + 1, Math.min(totalTeacherGrades, activeTeacherGradesPage * PAGE_SIZE), totalTeacherGrades, 'matchingStudents')),
            renderPagination(activeTeacherGradesPage, totalTeacherGradesPages, setTeacherGradesPage)
          )
        )
      ) : null,

      teacherActiveSubTab === 'members' ? h('div', { className: 'panel' },
        h('div', { className: 'workspace-header', style: { marginBottom: '14px' } },
          h('h3', { style: { fontSize: '1.15rem', color: '#3D3D38' } }, `👥 ${t('tabs.allMembers')}`)
        ),

        h('div', { className: 'data-table-container' },
          h('table', { className: 'data-table' },
            h('thead', null,
              h('tr', null,
                h('th', null, t('table.id')),
                h('th', null, t('table.name')),
                h('th', null, t('table.role')),
                h('th', null, t('table.email')),
                h('th', null, t('table.className'))
              )
            ),
            h('tbody', null,
              paginatedTeacherMembers.length === 0 ? (
                h('tr', null,
                  h('td', { colSpan: 5, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } }, '---')
                )
              ) : (
                paginatedTeacherMembers.map(m =>
                  h('tr', { key: m.id },
                    h('td', null, h('span', { className: 'strong-id' }, m.id)),
                    h('td', null,
                      h('strong', null, m.name),
                      m.id === currentUser.id ? ' (You)' : null
                    ),
                    h('td', null,
                      h('span', { className: `badge-role ${m.role}` }, formatRole(m.role))
                    ),
                    h('td', null, m.email),
                    h('td', null,
                      m.role === 'student' ?
                        h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, formatClassName(m.className)) :
                        h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, (m.assignedClasses || []).join(', ') || '---')
                    )
                  )
                )
              )
            )
          ),
          h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px', borderTop: '1px solid #E5E5DE' } },
            h('div', null, formatPaginationInfo(totalTeacherMembers === 0 ? 0 : (activeTeacherMembersPage - 1) * PAGE_SIZE + 1, Math.min(totalTeacherMembers, activeTeacherMembersPage * PAGE_SIZE), totalTeacherMembers, 'matchingMembers')),
            renderPagination(activeTeacherMembersPage, totalTeacherMembersPages, setTeacherMembersPage)
          )
        )
      ) : null
    ),

    showGradeModal && editingGrade ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card', style: { maxWidth: '750px', width: '90%' } },
        h('div', { className: 'modal-header' },
          h('h3', null, `${t('actions.edit')}: ${editingGrade.studentName}`),
          h('button', { className: 'btn-close-modal', onClick: () => setShowGradeModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveGrade },
          h('div', { className: 'modal-body', style: { padding: '20px', maxHeight: '75vh', overflowY: 'auto' } },
            (() => {
              const teacherSub = (currentUser.subject || 'math').toLowerCase();
              
              if (teacherSub === 'math') {
                return h('div', { style: { marginBottom: '20px', border: '1px solid #E6E6E3', borderRadius: '8px', padding: '16px', backgroundColor: '#F9F9F6' } },
                  h('h4', { style: { fontWeight: '600', color: '#1C1C1A', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid #E6E6E3', paddingBottom: '6px' } }, formatSubject('math')),
                  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' } },
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.oral')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.math_oral,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_oral: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.m15')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.math_m15,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_m15: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.mid')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.math_mid,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_mid: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.final')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.math_final,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math_final: e.target.value })),
                        placeholder: '---'
                      })
                    )
                  )
                );
              }

              if (teacherSub === 'literature') {
                return h('div', { style: { marginBottom: '20px', border: '1px solid #E6E6E3', borderRadius: '8px', padding: '16px', backgroundColor: '#F9F9F6' } },
                  h('h4', { style: { fontWeight: '600', color: '#1C1C1A', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid #E6E6E3', paddingBottom: '6px' } }, formatSubject('literature')),
                  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' } },
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.oral')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.literature_oral,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_oral: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.m15')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.literature_m15,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_m15: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.mid')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.literature_mid,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_mid: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.final')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.literature_final,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature_final: e.target.value })),
                        placeholder: '---'
                      })
                    )
                  )
                );
              }

              if (teacherSub === 'english') {
                return h('div', { style: { marginBottom: '20px', border: '1px solid #E6E6E3', borderRadius: '8px', padding: '16px', backgroundColor: '#F9F9F6' } },
                  h('h4', { style: { fontWeight: '600', color: '#1C1C1A', marginBottom: '12px', fontSize: '0.9rem', borderBottom: '1px solid #E6E6E3', paddingBottom: '6px' } }, formatSubject('english')),
                  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' } },
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.oral')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.english_oral,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_oral: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.m15')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.english_m15,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_m15: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.mid')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.english_mid,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_mid: e.target.value })),
                        placeholder: '---'
                      })
                    ),
                    h('div', { className: 'modal-form-group', style: { marginBottom: 0 } },
                      h('label', { style: { fontSize: '0.75rem', fontWeight: '500', color: '#6B6B63', marginBottom: '4px' } }, t('components.final')),
                      h('input', {
                        type: 'number', step: '0.1', min: '0', max: '10',
                        value: gradeForm.english_final,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english_final: e.target.value })),
                        placeholder: '---'
                      })
                    )
                  )
                );
              }

              return null;
            })()
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowGradeModal(false) }, t('actions.cancel')),
            h('button', { type: 'submit', className: 'btn btn-primary' }, t('actions.save'))
          )
        )
      )
    ) : null
  );
}
