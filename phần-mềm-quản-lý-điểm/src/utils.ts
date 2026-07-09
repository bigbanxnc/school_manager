import { SubjectGrades, StudentGradeRecord } from './types';

/**
 * Calculates the Grade Point Average (GPA) for a student's grades.
 */
export const calculateGpa = (grades: SubjectGrades): number | null => {
  const values = [grades.math, grades.literature, grades.english].filter(v => v !== null) as number[];
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
};

/**
 * Maps a calculated GPA to a academic classification text and style.
 */
export const getAcademicEvaluation = (gpa: number | null): { text: string; className: string } => {
  if (gpa === null) return { text: 'Chưa đánh giá', className: 'pending' };
  if (gpa >= 8.5) return { text: 'Xuất sắc', className: 'excellent' };
  if (gpa >= 7.0) return { text: 'Giỏi', className: 'good' };
  if (gpa >= 5.0) return { text: 'Trung bình / Khá', className: 'average' };
  return { text: 'Yếu', className: 'fail' };
};

/**
 * Triggers a download of student grade records as a CSV file.
 */
export const handleExportCsv = (filename: string, records: StudentGradeRecord[]) => {
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Vietnamese characters support
  csvContent += 'Mã Học Sinh,Tên Học Sinh,Lớp,Email,Điểm Toán,Điểm Văn,Điểm Anh,Điểm Trung Bình\r\n';

  records.forEach(row => {
    const mathStr = row.grades.math !== null ? row.grades.math.toString() : 'Chưa có';
    const litStr = row.grades.literature !== null ? row.grades.literature.toString() : 'Chưa có';
    const engStr = row.grades.english !== null ? row.grades.english.toString() : 'Chưa có';
    const gpaStr = row.gpa !== null ? row.gpa.toString() : 'Chưa có';

    csvContent += `"${row.studentId}","${row.studentName}","${row.className}","${row.email}",${mathStr},${litStr},${engStr},${gpaStr}\r\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
