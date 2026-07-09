import React from 'react';
import { Member, SubjectGrades, StudentGradeRecord } from '../../types';
import { calculateGpa, getAcademicEvaluation, handleExportCsv } from '../../utils';

interface StudentWorkspaceProps {
  currentUser: Member;
  members: Member[];
  gradesMap: { [studentId: string]: SubjectGrades };
}

const h = React.createElement;

export default function StudentWorkspace({ currentUser, members, gradesMap }: StudentWorkspaceProps) {
  const getStudentOwnRecord = (): StudentGradeRecord | null => {
    if (currentUser.role !== 'student') return null;
    const freshSelf = members.find(m => m.id === currentUser.id);
    if (!freshSelf) return null;
    const grades = gradesMap[freshSelf.id] || { math: null, literature: null, english: null };
    return {
      studentId: freshSelf.id,
      studentName: freshSelf.name,
      className: freshSelf.className || 'Chưa xếp lớp',
      email: freshSelf.email,
      grades,
      gpa: calculateGpa(grades)
    };
  };

  const studentOwnRecord = getStudentOwnRecord();

  if (!studentOwnRecord) {
    return h('main', { className: 'workspace-content', id: 'student_workspace_content' },
      h('div', { className: 'error-box' }, 'Không thể tìm thấy thông tin điểm của tài khoản học sinh hiện tại.')
    );
  }

  const evalObj = getAcademicEvaluation(studentOwnRecord.gpa);

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
          h('h2', null, `Xin chào, ${studentOwnRecord.studentName}!`),
          h('p', null,
            'Mã học sinh: ', h('strong', null, studentOwnRecord.studentId),
            ' | Lớp học: ', h('strong', null, studentOwnRecord.className)
          )
        )
      ),
      h('button', {
        className: 'btn btn-success',
        onClick: () => handleExportCsv(`diem_ca_nhan_${currentUser.id}.csv`, [studentOwnRecord]),
        id: 'student_btn_export'
      }, '📥 Xuất CSV Điểm Cá Nhân')
    ),

    h('div', { className: 'subject-grades-grid' },
      h('div', { className: 'subject-grade-card' },
        h('h4', null, 'Toán Học'),
        h('div', {
          className: `grade-number ${studentOwnRecord.grades.math === null ? 'no-grade' : ''}`
        }, studentOwnRecord.grades.math !== null ? studentOwnRecord.grades.math : 'Chưa có điểm')
      ),

      h('div', { className: 'subject-grade-card' },
        h('h4', null, 'Ngữ Văn'),
        h('div', {
          className: `grade-number ${studentOwnRecord.grades.literature === null ? 'no-grade' : ''}`
        }, studentOwnRecord.grades.literature !== null ? studentOwnRecord.grades.literature : 'Chưa có điểm')
      ),

      h('div', { className: 'subject-grade-card' },
        h('h4', null, 'Tiếng Anh'),
        h('div', {
          className: `grade-number ${studentOwnRecord.grades.english === null ? 'no-grade' : ''}`
        }, studentOwnRecord.grades.english !== null ? studentOwnRecord.grades.english : 'Chưa có điểm')
      )
    ),

    h('div', { className: 'gpa-summary-box' },
      h('div', { className: 'gpa-label-box' },
        h('span', { className: 'gpa-title' }, 'Điểm Trung Bình (GPA):'),
        h('span', { className: gpaClass }, studentOwnRecord.gpa !== null ? studentOwnRecord.gpa : 'N/A')
      ),
      h('div', { className: 'academic-eval' },
        'Học lực học kỳ: ',
        h('span', { className: evalObj.className }, evalObj.text)
      )
    )
  );
}
