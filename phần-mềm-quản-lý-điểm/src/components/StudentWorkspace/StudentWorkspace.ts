import React, { useState, useEffect } from 'react';
import { Member, SubjectGrades, StudentGradeRecord } from '../../types';
import { calculateGpa, handleExportCsv } from '../../utils';
import { t, formatSubject, formatClassName, formatEvaluation, formatUserName } from '../../i18n';

interface StudentWorkspaceProps {
  currentUser: Member;
  members?: Member[];
  gradesMap: { [studentId: string]: SubjectGrades };
}

const h = React.createElement;

export default function StudentWorkspace({ currentUser, gradesMap }: StudentWorkspaceProps) {
  const canViewGrades = currentUser.permissions?.studentViewGrades ?? (currentUser.permissions?.viewClassGrades ?? true);
  const canExportCsv = currentUser.permissions?.exportCsvReports ?? true;

  const isUnassigned = !currentUser.className || currentUser.className.trim() === '' || currentUser.className === 'Chưa xếp lớp' || currentUser.className === 'Unassigned';

  const studentIdentifier = currentUser.code || currentUser.id;

  const [grades, setGrades] = useState<SubjectGrades | null>(() => {
    if (isUnassigned) return { math: null, literature: null, english: null };
    if (gradesMap && gradesMap[studentIdentifier] !== undefined) return gradesMap[studentIdentifier];
    if (gradesMap && gradesMap[currentUser.id] !== undefined) return gradesMap[currentUser.id];
    return currentUser.grades || null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isUnassigned) {
      setGrades({ math: null, literature: null, english: null });
      setLoading(false);
      return;
    }

    if (gradesMap && gradesMap[studentIdentifier] !== undefined) {
      setGrades(gradesMap[studentIdentifier]);
    } else if (gradesMap && gradesMap[currentUser.id] !== undefined) {
      setGrades(gradesMap[currentUser.id]);
    }

    async function loadStudentGrades() {
      try {
        let fetchedGrades: SubjectGrades | null = null;

        // 1. Fetch by student code (e.g. HS178) or ID
        const res = await fetch(`/api/grades/${encodeURIComponent(studentIdentifier)}`, { cache: 'no-store' });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              const m = data.math === "" || data.math === null || data.math === undefined ? null : parseFloat(data.math);
              const l = data.literature === "" || data.literature === null || data.literature === undefined ? null : parseFloat(data.literature);
              const e = data.english === "" || data.english === null || data.english === undefined ? null : parseFloat(data.english);
              if (m !== null || l !== null || e !== null) {
                fetchedGrades = { math: m, literature: l, english: e };
              }
            }
          }
        }

        // 2. If not found and ID is different, try ID
        if (!fetchedGrades && currentUser.id && currentUser.id !== studentIdentifier) {
          try {
            const res2 = await fetch(`/api/grades/${encodeURIComponent(currentUser.id)}`, { cache: 'no-store' });
            if (res2.ok) {
              const contentType2 = res2.headers.get('content-type') || '';
              if (contentType2.includes('application/json')) {
                const data2 = await res2.json();
                if (data2 && typeof data2 === 'object') {
                  const m = data2.math === "" || data2.math === null || data2.math === undefined ? null : parseFloat(data2.math);
                  const l = data2.literature === "" || data2.literature === null || data2.literature === undefined ? null : parseFloat(data2.literature);
                  const e = data2.english === "" || data2.english === null || data2.english === undefined ? null : parseFloat(data2.english);
                  if (m !== null || l !== null || e !== null) {
                    fetchedGrades = { math: m, literature: l, english: e };
                  }
                }
              }
            }
          } catch (e2) {
            // ignore
          }
        }

        if (fetchedGrades) {
          setGrades(fetchedGrades);
        } else if (currentUser.grades && (currentUser.grades.math !== null || currentUser.grades.literature !== null || currentUser.grades.english !== null)) {
          setGrades(currentUser.grades);
        } else if (gradesMap && (gradesMap[studentIdentifier] || gradesMap[currentUser.id])) {
          setGrades(gradesMap[studentIdentifier] || gradesMap[currentUser.id]);
        }
      } catch (err) {
        console.error("Error loading student grades:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentGrades();
  }, [currentUser.id, currentUser.code, currentUser.className, isUnassigned, gradesMap]);

  if (loading) {
    return h('main', { className: 'workspace-content', id: 'student_workspace_content', style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' } },
      h('div', null, '...')
    );
  }

  const studentOwnRecord: StudentGradeRecord = {
    studentId: currentUser.id,
    studentName: formatUserName(currentUser),
    className: formatClassName(currentUser.className),
    email: currentUser.email,
    grades: grades || { math: null, literature: null, english: null },
    gpa: grades && canViewGrades ? calculateGpa(grades) : null
  };

  const evalText = canViewGrades ? formatEvaluation(studentOwnRecord.gpa) : '---';

  let gpaClass = 'gpa-score';
  if (studentOwnRecord.gpa !== null) {
    if (studentOwnRecord.gpa < 5) {
      gpaClass += ' low';
    } else if (studentOwnRecord.gpa < 7.5) {
      gpaClass += ' medium';
    }
  }

  return h('main', { className: 'workspace-content', style: { flex: 1, padding: '30px' }, id: 'student_workspace_content' },
    h('div', { className: 'student-welcome' },
      h('div', { className: 'profile-wrapper' },
        h('div', { className: 'student-avatar' }, '🎓'),
        h('div', { className: 'student-meta' },
          h('h2', null, `${t('welcome')}, ${studentOwnRecord.studentName}!`),
          h('p', null,
            `${t('table.id')}: `, h('strong', null, studentOwnRecord.studentId),
            ` | ${t('table.className')}: `, h('strong', null, studentOwnRecord.className)
          )
        )
      ),
      canExportCsv ? h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
        h('button', {
          className: 'btn btn-success',
          onClick: () => {
            if (!canExportCsv) {
              alert(t('permissions.accessDenied') || 'Bạn không có quyền xuất dữ liệu CSV!');
              return;
            }
            handleExportCsv(`diem_ca_nhan_${currentUser.id}.csv`, [studentOwnRecord]);
          },
          id: 'student_btn_export'
        }, `📥 ${t('exportCsv')}`)
      ) : null
    ),

    !canViewGrades ? h('div', {
      style: {
        backgroundColor: '#FEF2F2',
        color: '#991B1B',
        border: '1px solid #FECACA',
        padding: '14px 18px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '0.9rem'
      }
    }, '🔒 Quyền xem bảng điểm chi tiết của tài khoản hiện đang bị hạn chế hoặc chưa được kích hoạt.') : null,

    h('div', { className: 'subject-grades-grid' },
      h('div', { className: 'subject-grade-card' },
        h('h4', null, formatSubject('math')),
        h('div', {
          className: `grade-number ${!canViewGrades || studentOwnRecord.grades.math === null ? 'no-grade' : ''}`
        }, canViewGrades ? (studentOwnRecord.grades.math !== null ? studentOwnRecord.grades.math : '---') : '🔒')
      ),

      h('div', { className: 'subject-grade-card' },
        h('h4', null, formatSubject('literature')),
        h('div', {
          className: `grade-number ${!canViewGrades || studentOwnRecord.grades.literature === null ? 'no-grade' : ''}`
        }, canViewGrades ? (studentOwnRecord.grades.literature !== null ? studentOwnRecord.grades.literature : '---') : '🔒')
      ),

      h('div', { className: 'subject-grade-card' },
        h('h4', null, formatSubject('english')),
        h('div', {
          className: `grade-number ${!canViewGrades || studentOwnRecord.grades.english === null ? 'no-grade' : ''}`
        }, canViewGrades ? (studentOwnRecord.grades.english !== null ? studentOwnRecord.grades.english : '---') : '🔒')
      )
    ),

    h('div', { className: 'gpa-summary-box' },
      h('div', { className: 'gpa-label-box' },
        h('span', { className: 'gpa-title' }, `${t('components.gpa')}:`),
        h('span', { className: gpaClass }, canViewGrades && studentOwnRecord.gpa !== null ? studentOwnRecord.gpa : '---')
      ),
      h('div', { className: 'academic-eval' },
        `${t('table.academicPerformance')}: `,
        h('span', { className: 'eval-tag' }, evalText)
      )
    )
  );
}
