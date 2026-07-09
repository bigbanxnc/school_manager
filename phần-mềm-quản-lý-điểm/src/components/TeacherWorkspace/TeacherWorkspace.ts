import React, { useState, useEffect } from 'react';
import { Member, SubjectGrades, StudentGradeRecord } from '../../types';
import { calculateGpa, handleExportCsv } from '../../utils';

interface TeacherWorkspaceProps {
  currentUser: Member;
  members: Member[];
  gradesMap: { [studentId: string]: SubjectGrades };
  setGradesMap: React.Dispatch<React.SetStateAction<{ [studentId: string]: SubjectGrades }>>;
}

const h = React.createElement;

export default function TeacherWorkspace({ currentUser, members, gradesMap, setGradesMap }: TeacherWorkspaceProps) {
  const [teacherSearchInput, setTeacherSearchInput] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherActiveSubTab, setTeacherActiveSubTab] = useState<'grades' | 'members'>('grades');

  const [teacherGradesPage, setTeacherGradesPage] = useState(1);
  const [teacherMembersPage, setTeacherMembersPage] = useState(1);

  useEffect(() => {
    setTeacherGradesPage(1);
    setTeacherMembersPage(1);
  }, [teacherSearchQuery, teacherActiveSubTab]);

  // Form state for editing grade
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ studentId: string; studentName: string; grades: SubjectGrades } | null>(null);
  const [gradeForm, setGradeForm] = useState({ 
    math: '' as string | number, 
    literature: '' as string | number, 
    english: '' as string | number 
  });

  const getSubjectName = (sub?: string) => {
    if (sub === 'math') return 'Toán Học';
    if (sub === 'literature') return 'Ngữ Văn';
    if (sub === 'english') return 'Tiếng Anh';
    return 'môn học';
  };

  // Determine what classes the logged-in teacher teaches
  const getTeacherAssignedClasses = (): string[] => {
    if (currentUser.role !== 'teacher') return [];
    const freshSelf = members.find(m => m.id === currentUser.id);
    return freshSelf?.assignedClasses || [];
  };

  // Teacher restricted members view: Only students in their classes + themselves
  const getTeacherMembersList = (): Member[] => {
    const teacherClasses = getTeacherAssignedClasses();
    return members.filter(m => {
      if (m.id === currentUser.id) return true; // Himself
      if (m.role === 'student' && m.className && teacherClasses.includes(m.className)) return true;
      return false;
    });
  };

  // Student grades in class managed by teacher
  const getTeacherStudentsGrades = (): StudentGradeRecord[] => {
    const teacherClasses = getTeacherAssignedClasses();
    const studentsInMyClasses = members.filter(
      m => m.role === 'student' && m.className && teacherClasses.includes(m.className)
    );

    return studentsInMyClasses.map(s => {
      const grades = gradesMap[s.id] || { math: null, literature: null, english: null };
      return {
        studentId: s.id,
        studentName: s.name,
        className: s.className || '',
        email: s.email,
        grades,
        gpa: calculateGpa(grades)
      };
    });
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

  const filteredTeacherGrades = getTeacherStudentsGrades().filter(
    r => !teacherSearchQuery || matchGradeRecord(r, teacherSearchQuery)
  );

  const filteredTeacherMembers = getTeacherMembersList().filter(
    m => !teacherSearchQuery || 
         isQueryMatched(m.id, teacherSearchQuery) || 
         isQueryMatched(m.name, teacherSearchQuery) || 
         isQueryMatched(m.email, teacherSearchQuery) || 
         isQueryMatched(m.role, teacherSearchQuery)
  );

  const PAGE_SIZE = 10;

  const totalTeacherGradesPages = Math.ceil(filteredTeacherGrades.length / PAGE_SIZE) || 1;
  const activeTeacherGradesPage = Math.min(teacherGradesPage, totalTeacherGradesPages);
  const paginatedTeacherGrades = filteredTeacherGrades.slice((activeTeacherGradesPage - 1) * PAGE_SIZE, activeTeacherGradesPage * PAGE_SIZE);

  const totalTeacherMembersPages = Math.ceil(filteredTeacherMembers.length / PAGE_SIZE) || 1;
  const activeTeacherMembersPage = Math.min(teacherMembersPage, totalTeacherMembersPages);
  const paginatedTeacherMembers = filteredTeacherMembers.slice((activeTeacherMembersPage - 1) * PAGE_SIZE, activeTeacherMembersPage * PAGE_SIZE);

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

    const existingGrades = gradesMap[editingGrade.studentId] || { math: null, literature: null, english: null };
    
    // Restrictions: only update the subject this teacher teaches!
    const mathVal = currentUser.subject === 'math' 
      ? (gradeForm.math === '' ? null : parseFloat(gradeForm.math.toString())) 
      : existingGrades.math;
      
    const litVal = currentUser.subject === 'literature' 
      ? (gradeForm.literature === '' ? null : parseFloat(gradeForm.literature.toString())) 
      : existingGrades.literature;
      
    const engVal = currentUser.subject === 'english' 
      ? (gradeForm.english === '' ? null : parseFloat(gradeForm.english.toString())) 
      : existingGrades.english;

    // --- Giao tiếp API Network ---
    try {
      console.log(`[API Network Call] PUT /api/grades/${editingGrade.studentId}`, { math: mathVal, literature: litVal, english: engVal, updatedBy: currentUser.id });
      const res = await fetch(`/api/grades/${editingGrade.studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ math: mathVal, literature: litVal, english: engVal, updatedBy: currentUser.id })
      });
      if (res.ok) {
        console.log('[API Network Success] Giáo viên đã cập nhật điểm số học sinh thành công lên server.');
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
    }

    setGradesMap(prev => ({
      ...prev,
      [editingGrade.studentId]: { math: mathVal, literature: litVal, english: engVal }
    }));
    setShowGradeModal(false);
  };

  const isMathDisabled = currentUser.subject !== 'math';
  const isLiteratureDisabled = currentUser.subject !== 'literature';
  const isEnglishDisabled = currentUser.subject !== 'english';

  return h(React.Fragment, null,
    h('aside', { className: 'dashboard-sidebar', id: 'teacher_sidebar_menu' },
      h('div', { className: 'sidebar-section' },
        h('div', { className: 'sidebar-section-title' }, 'NHIỆM VỤ GIẢNG DẠY'),
        h('div', { style: { padding: '0 8px 12px', fontSize: '0.8rem', color: '#5A5A40', lineHeight: '1.4', borderBottom: '1px solid #E5E5DE', marginBottom: '8px' } },
          h('div', { style: { marginBottom: '6px' } }, 
            'Môn dạy của bạn: ', h('strong', null, getSubjectName(currentUser.subject))
          ),
          'Học kỳ hiện tại, bạn phụ trách giảng dạy cho các lớp: ', h('br'),
          h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' } },
            getTeacherAssignedClasses().map(c =>
              h('span', { key: c, className: 'badge-class', style: { backgroundColor: '#5A5A40', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' } }, c)
            ),
            getTeacherAssignedClasses().length === 0 ? h('span', { style: { color: '#AA5656', fontStyle: 'italic' } }, 'Chưa có lớp nào') : null
          )
        ),
        h('button', { 
          className: `sidebar-btn ${teacherActiveSubTab === 'grades' ? 'active' : ''}`, 
          id: 'teacher_menu_grades_action',
          onClick: () => setTeacherActiveSubTab('grades')
        }, '📊 Điểm Lớp Quản Lý'),
        h('button', { 
          className: `sidebar-btn ${teacherActiveSubTab === 'members' ? 'active' : ''}`, 
          id: 'teacher_menu_members_action',
          onClick: () => setTeacherActiveSubTab('members')
        }, '👥 Danh Sách Thành Viên')
      ),
      h('div', { className: 'sidebar-section' },
        h('div', { className: 'sidebar-section-title' }, 'TIỆN ÍCH GIÁO VIÊN'),
        h('button', {
          className: 'sidebar-btn',
          onClick: () => handleExportCsv(`bang_diem_giaovien_${currentUser.id}.csv`, getTeacherStudentsGrades()),
          id: 'teacher_menu_export'
        }, '📥 Xuất CSV Lớp Phụ Trách')
      )
    ),

    h('main', { className: 'workspace-content', id: 'teacher_workspace_content' },
      h('div', { className: 'workspace-header' },
        h('div', null,
          h('h1', null, 'Bảng Quản Lý Giáo Viên'),
          h('p', { style: { color: '#8E8E85', fontSize: '0.85rem', marginTop: '4px', fontFamily: 'sans-serif' } },
            'Chào, ', h('strong', null, currentUser.name), ' (Bộ môn ', h('strong', { style: { color: '#4E6C50' } }, getSubjectName(currentUser.subject)), '). Bạn chỉ có quyền sửa điểm môn học bạn được phân công phụ trách. Các môn học khác sẽ bị vô hiệu hóa chỉnh sửa để đảm bảo tính minh bạch.'
          )
        ),
        h('div', { className: 'header-actions' },
          h('button', {
            className: 'btn btn-success',
            onClick: () => handleExportCsv(`bang_diem_giaovien_${currentUser.id}.csv`, getTeacherStudentsGrades()),
            id: 'teacher_btn_export_csv'
          }, '📥 Xuất Điểm CSV các lớp phụ trách')
        )
      ),

      h('div', { className: 'search-filter-strip', style: { display: 'flex', gap: '10px', alignItems: 'center' } },
        h('div', { className: 'search-wrapper', style: { flex: 1 } },
          h('span', { className: 'search-icon' }, '🔍'),
          h('input', {
            type: 'text',
            placeholder: 'Tìm mã số, điểm số, tên học sinh, gmail...',
            value: teacherSearchInput,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTeacherSearchInput(e.target.value),
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && teacherSearchInput.trim() !== '') {
                setTeacherSearchQuery(teacherSearchInput.trim());
              }
            },
            id: 'teacher_search_input'
          })
        ),
        h('button', {
          className: 'btn btn-primary',
          disabled: teacherSearchInput.trim() === '',
          onClick: () => {
            if (teacherSearchInput.trim() !== '') {
              setTeacherSearchQuery(teacherSearchInput.trim());
            }
          },
          style: { opacity: teacherSearchInput.trim() === '' ? 0.6 : 1, cursor: teacherSearchInput.trim() === '' ? 'not-allowed' : 'pointer' }
        }, 'Tìm kiếm 🔍'),
        teacherSearchQuery ? h('button', {
          className: 'btn btn-secondary btn-sm',
          onClick: () => {
            setTeacherSearchInput('');
            setTeacherSearchQuery('');
          }
        }, 'Xóa lọc ✕') : null
      ),

      // SUBTAB 1: Grades Workspace
      teacherActiveSubTab === 'grades' ? h('div', { className: 'panel', style: { marginBottom: '24px' } },
        h('div', { className: 'workspace-header', style: { marginBottom: '14px' } },
          h('h3', { style: { fontSize: '1.15rem', color: '#3D3D38' } }, '📈 Điểm Học Sinh Trong Lớp')
        ),

        h('div', { className: 'data-table-container' },
          h('table', { className: 'data-table' },
            h('thead', null,
              h('tr', null,
                h('th', null, 'Mã Học Sinh'),
                h('th', null, 'Họ và Tên'),
                h('th', null, 'Lớp Học'),
                h('th', null, 'Email / Gmail'),
                h('th', null, 'Điểm Toán'),
                h('th', null, 'Điểm Văn'),
                h('th', null, 'Điểm Anh'),
                h('th', { style: { backgroundColor: '#E5E5DE', textAlign: 'center' } }, 'Trung Bình (GPA)'),
                h('th', { style: { textAlign: 'right' } }, 'Thao Tác')
              )
            ),
            h('tbody', null,
              filteredTeacherGrades.length === 0 ? h('tr', null,
                h('td', { colSpan: 9, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } },
                  'Không tìm thấy học sinh nào thuộc phân quyền lớp của bạn tương ứng với từ khóa.'
                )
              ) : paginatedTeacherGrades.map(r =>
                  h('tr', { key: r.studentId },
                    h('td', null, h('span', { className: 'strong-id' }, r.studentId)),
                    h('td', null, h('strong', null, r.studentName)),
                    h('td', null, h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, r.className)),
                    h('td', null, r.email),
                    h('td', { className: r.grades.math === null ? 'not-graded' : '' },
                      r.grades.math !== null ? r.grades.math : 'Chưa có'
                    ),
                    h('td', { className: r.grades.literature === null ? 'not-graded' : '' },
                      r.grades.literature !== null ? r.grades.literature : 'Chưa có'
                    ),
                    h('td', { className: r.grades.english === null ? 'not-graded' : '' },
                      r.grades.english !== null ? r.grades.english : 'Chưa có'
                    ),
                    h('td', { className: 'gpa-cell' },
                      h('strong', { style: { color: r.gpa && r.gpa >= 5 ? '#4E6C50' : '#AA5656' } },
                        r.gpa !== null ? r.gpa : 'N/A'
                      )
                    ),
                    h('td', null,
                      h('div', { className: 'action-btn-group' },
                        h('button', {
                          className: 'btn btn-secondary btn-sm',
                          onClick: () => openEditGrade(r.studentId, r.studentName, r.grades)
                        }, '✏️ Sửa điểm'),
                        h('button', {
                          className: 'btn btn-danger btn-sm',
                          style: { padding: '6px 10px' },
                          onClick: async () => {
                            const subName = getSubjectName(currentUser.subject);
                            if (window.confirm(`Bạn muốn xóa trắng điểm môn ${subName} của học sinh ${r.studentName}?`)) {
                              const existing = gradesMap[r.studentId] || { math: null, literature: null, english: null };
                              const subject = currentUser.subject || '';
 
                              // --- Giao tiếp API Network ---
                              try {
                                console.log(`[API Network Call] DELETE /api/grades/${r.studentId}/subject/${subject}`);
                                const res = await fetch(`/api/grades/${r.studentId}/subject/${subject}`, { method: 'DELETE' });
                                if (res.ok) {
                                  console.log('[API Network Success] Đã xóa điểm số môn học trên server.');
                                }
                              } catch (err) {
                                console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
                              }
 
                              setGradesMap(prev => ({
                                ...prev,
                                [r.studentId]: {
                                  ...existing,
                                  [subject]: null
                                }
                              }));
                            }
                          }
                        }, '✕ Xóa điểm')
                      )
                    )
                  )
                )
              )
            ),
          h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px', borderTop: '1px solid #E5E5DE' } },
            h('div', null, `Hiển thị ${Math.min(filteredTeacherGrades.length, (activeTeacherGradesPage - 1) * PAGE_SIZE + 1)}-${Math.min(filteredTeacherGrades.length, activeTeacherGradesPage * PAGE_SIZE)} trên tổng số ${filteredTeacherGrades.length} học sinh phù hợp`),
            renderPagination(activeTeacherGradesPage, totalTeacherGradesPages, setTeacherGradesPage)
          )
        )
      ) : null,

      // SUBTAB 2: Members Workspace
      teacherActiveSubTab === 'members' ? h('div', { className: 'panel' },
        h('div', { className: 'workspace-header', style: { marginBottom: '14px' } },
          h('h3', { style: { fontSize: '1.15rem', color: '#3D3D38' } }, '👥 Danh Sách Thành Viên Phân Hệ Giao Tiếp'),
          h('span', { style: { fontSize: '0.8rem', color: '#8E8E85', fontStyle: 'italic' } }, 'Không hiển thị các tài khoản Giáo viên khác')
        ),

        h('div', { className: 'data-table-container' },
          h('table', { className: 'data-table' },
            h('thead', null,
              h('tr', null,
                h('th', null, 'Mã Thành Viên'),
                h('th', null, 'Họ và Tên'),
                h('th', null, 'Vai Trò'),
                h('th', null, 'Email / Gmail'),
                h('th', null, 'Lớp Phụ Trách / Theo Học')
              )
            ),
            h('tbody', null,
              filteredTeacherMembers.length === 0 ? (
                h('tr', null,
                  h('td', { colSpan: 5, style: { textAlign: 'center', color: '#8E8E85', fontStyle: 'italic', padding: '30px' } },
                    'Không có thành viên trùng khớp.'
                  )
                )
              ) : (
                paginatedTeacherMembers.map(m =>
                  h('tr', { key: m.id },
                    h('td', null, h('span', { className: 'strong-id' }, m.id)),
                    h('td', null,
                      h('strong', null, m.name),
                      m.id === currentUser.id ? h('span', { style: { color: '#5A5A40', fontStyle: 'italic', fontSize: '0.75rem' } }, ' (Bạn)') : null
                    ),
                    h('td', null,
                      h('span', { className: `badge-role ${m.role}` },
                        m.role === 'teacher' ? 'Giáo Viên' : 'Học Sinh'
                      )
                    ),
                    h('td', null, m.email),
                    h('td', null,
                      m.role === 'student' ?
                        h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, m.className || 'Chưa xếp') :
                        h('span', { style: { color: '#5A5A40', fontWeight: 'bold' } }, (m.assignedClasses || []).join(', ') || 'Chưa có')
                    )
                  )
                )
              )
            )
          ),
          h('div', { className: 'table-footer', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px', borderTop: '1px solid #E5E5DE' } },
            h('div', null, `Hiển thị ${Math.min(filteredTeacherMembers.length, (activeTeacherMembersPage - 1) * PAGE_SIZE + 1)}-${Math.min(filteredTeacherMembers.length, activeTeacherMembersPage * PAGE_SIZE)} trên tổng số ${filteredTeacherMembers.length} thành viên phù hợp`),
            renderPagination(activeTeacherMembersPage, totalTeacherMembersPages, setTeacherMembersPage)
          )
        )
      ) : null
    ),

    showGradeModal && editingGrade ? h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal-card' },
        h('div', { className: 'modal-header' },
          h('h3', null, `Nhập & Sửa Điểm: ${editingGrade.studentName}`),
          h('button', { className: 'btn-close-modal', onClick: () => setShowGradeModal(false) }, '✕')
        ),
        h('form', { onSubmit: saveGrade },
          h('div', { className: 'modal-body' },
            h('p', { style: { fontSize: '0.8rem', color: '#8E8E85', marginBottom: '16px', fontFamily: 'sans-serif' } },
              'Hệ số điểm từ 0.0 đến 10.0. Để trống ô nhập nếu muốn chuyển điểm về trạng thái "Chưa có". Bạn chỉ có quyền chỉnh sửa điểm bộ môn mình phụ trách.'
            ),

            h('div', { className: 'modal-form-group' },
              h('label', null, 'Điểm Toán' + (isMathDisabled ? ' (Chỉ đọc - Chỉ GV Toán được sửa)' : ' (Bản quyền của bạn - Có thể sửa)')),
              h('input', {
                type: 'number',
                step: '0.1',
                min: '0',
                max: '10',
                value: gradeForm.math,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, math: e.target.value })),
                placeholder: isMathDisabled ? 'Không thuộc quyền giảng dạy' : 'Chưa có điểm',
                disabled: isMathDisabled
              })
            ),

            h('div', { className: 'modal-form-group' },
              h('label', null, 'Điểm Ngữ Văn' + (isLiteratureDisabled ? ' (Chỉ đọc - Chỉ GV Văn được sửa)' : ' (Bản quyền của bạn - Có thể sửa)')),
              h('input', {
                type: 'number',
                step: '0.1',
                min: '0',
                max: '10',
                value: gradeForm.literature,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, literature: e.target.value })),
                placeholder: isLiteratureDisabled ? 'Không thuộc quyền giảng dạy' : 'Chưa có điểm',
                disabled: isLiteratureDisabled
              })
            ),

            h('div', { className: 'modal-form-group' },
              h('label', null, 'Điểm Tiếng Anh' + (isEnglishDisabled ? ' (Chỉ đọc - Chỉ GV Anh được sửa)' : ' (Bản quyền của bạn - Có thể sửa)')),
              h('input', {
                type: 'number',
                step: '0.1',
                min: '0',
                max: '10',
                value: gradeForm.english,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGradeForm(prev => ({ ...prev, english: e.target.value })),
                placeholder: isEnglishDisabled ? 'Không thuộc quyền giảng dạy' : 'Chưa có điểm',
                disabled: isEnglishDisabled
              })
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { type: 'button', className: 'btn btn-secondary', onClick: () => setShowGradeModal(false) }, 'Hủy'),
            h('button', { type: 'submit', className: 'btn btn-primary' }, 'Cập Nhật Điểm')
          )
        )
      )
    ) : null
  );
}
