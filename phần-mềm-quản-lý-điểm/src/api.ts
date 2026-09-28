import React, { useState, useEffect, useCallback } from 'react';
import { Member, SubjectGrades, ClassItem } from './types';
import LoginPortal from './components/LoginPortal/LoginPortal';
import AdminWorkspace from './components/AdminWorkspace/AdminWorkspace';
import TeacherWorkspace from './components/TeacherWorkspace/TeacherWorkspace';
import StudentWorkspace from './components/StudentWorkspace/StudentWorkspace';
import SourceCodeExplorer from './components/SourceCodeExplorer/SourceCodeExplorer';

// Initial Mock Data
const INITIAL_CLASSES: ClassItem[] = [
  { id: '10A1', name: 'Lớp 10A1' },
  { id: '11A2', name: 'Lớp 11A2' },
  { id: '12B1', name: 'Lớp 12B1' },
  { id: '12C3', name: 'Lớp 12C3' }
];

const INITIAL_MEMBERS: Member[] = [
  { id: 'AD001', name: 'Nguyễn Văn Quản Trị', email: 'admin@gmail.com', password: 'admin', role: 'admin' },
  { id: 'GV001', name: 'Trần Thị Toán', email: 'toan.tran@edu.com', password: 'teacher1', role: 'teacher', assignedClasses: ['10A1', '11A2'], subject: 'math' },
  { id: 'GV002', name: 'Lê Văn Văn', email: 'van.le@edu.com', password: 'teacher2', role: 'teacher', assignedClasses: ['11A2', '12B1'], subject: 'literature' },
  { id: 'GV003', name: 'Phạm Anh Anh', email: 'anh.pham@edu.com', password: 'teacher3', role: 'teacher', assignedClasses: ['10A1', '12B1', '12C3'], subject: 'english' },
  { id: 'HS001', name: 'Nguyễn Văn Nam', email: 'nam.nguyen@gmail.com', password: 'student1', role: 'student', className: '10A1' },
  { id: 'HS002', name: 'Trần Thị Bình', email: 'binh.tran@gmail.com', password: 'student2', role: 'student', className: '10A1' },
  { id: 'HS003', name: 'Lê Hoàng Long', email: 'long.le@gmail.com', password: 'student3', role: 'student', className: '11A2' },
  { id: 'HS004', name: 'Phạm Minh Thư', email: 'thu.pham@gmail.com', password: 'student4', role: 'student', className: '11A2' },
  { id: 'HS005', name: 'Vũ Tiến Đạt', email: 'dat.vu@gmail.com', password: 'student5', role: 'student', className: '12B1' },
  { id: 'HS006', name: 'Ngô Mai Chi', email: 'chi.ngo@gmail.com', password: 'student6', role: 'student', className: '12C3' }
];

const INITIAL_GRADES: { [studentId: string]: SubjectGrades } = {
  'HS001': { math: 8.5, literature: 7.0, english: 9.0 },
  'HS002': { math: 9.0, literature: 8.5, english: 8.0 },
  'HS003': { math: 6.5, literature: 8.0, english: 7.5 },
  'HS004': { math: 10.0, literature: 9.0, english: 9.5 },
  'HS005': { math: 5.0, literature: 6.0, english: 5.5 },
  'HS006': { math: 7.5, literature: 7.5, english: 8.0 }
};

const h = React.createElement;

export default function App() {
  // --- Persistent State (We always initialize from clean empty lists to prevent stale cache bugs when copying files) ---
  const [classes, setRawClasses] = useState<ClassItem[]>([]);
  const [members, setRawMembers] = useState<Member[]>([]);
  const [gradesMap, setGradesMap] = useState<{ [studentId: string]: SubjectGrades }>({});

  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    const saved = localStorage.getItem('school_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Unique updaters that guarantee no duplicate IDs can ever enter the React state
  const setMembers = useCallback((update: React.SetStateAction<Member[]>) => {
    setRawMembers(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      const seen = new Set<string>();
      return next.filter(m => {
        const idClean = (m.id || '').trim().toUpperCase();
        if (!idClean) return true;
        if (seen.has(idClean)) return false;
        seen.add(idClean);
        return true;
      });
    });
  }, []);

  const setClasses = useCallback((update: React.SetStateAction<ClassItem[]>) => {
    setRawClasses(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      const seen = new Set<string>();
      return next.filter(c => {
        const idClean = (c.id || '').trim().toUpperCase();
        if (!idClean) return true;
        if (seen.has(idClean)) return false;
        seen.add(idClean);
        return true;
      });
    });
  }, []);

  // Navigation tab: 'login' | 'admin' | 'teacher' | 'student' | 'source_code'
  const [activeTab, setActiveTab] = useState<string>('login');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('school_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('school_current_user');
    }
  }, [currentUser]);

  // Auto-sync entire data from server/db.json on first load to discard stale localStorage cache
  useEffect(() => {
    async function syncDataFromServer() {
      try {
        console.log('[Sync] Khởi động đồng bộ dữ liệu từ server...');
        const [membersRes, classesRes, gradesRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/classes'),
          fetch('/api/grades')
        ]);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          if (Array.isArray(membersData) && membersData.length > 0) {
            setMembers(membersData);
            console.log(`[Sync] Đồng bộ thành công ${membersData.length} thành viên.`);
          }
        }
        
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          if (Array.isArray(classesData) && classesData.length > 0) {
            setClasses(classesData);
            console.log(`[Sync] Đồng bộ thành công ${classesData.length} lớp học.`);
          }
        }

        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          if (Array.isArray(gradesData)) {
            const map: { [studentId: string]: SubjectGrades } = {};
            gradesData.forEach((r: any) => {
              map[r.studentId] = {
                math: r.math,
                literature: r.literature,
                english: r.english
              };
            });
            setGradesMap(map);
            console.log(`[Sync] Đồng bộ thành công ${Object.keys(map).length} điểm số.`);
          }
        }
      } catch (err) {
        console.warn('[Sync] Không thể tự động đồng bộ dữ liệu từ server:', err);
      }
    }
    syncDataFromServer();
  }, []);

  // Adjust active screen based on currentUser role changes
  useEffect(() => {
    if (currentUser) {
      setActiveTab(currentUser.role);
    } else {
      setActiveTab('login');
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return h('div', { className: 'app-container', id: 'main_school_app' },
    h('nav', { className: 'top-nav', id: 'top_navigation_bar' },
      currentUser?.role !== 'admin' ? h('div', {
        className: 'brand',
        onClick: () => {
          if (currentUser) {
            setActiveTab(currentUser.role);
          } else {
            setActiveTab('login');
          }
        }
      },
        h('div', { className: 'logo-box' },
          h('svg', { fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', viewBox: '0 0 24 24', style: { width: '20px', height: '20px' } },
            h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' })
          )
        ),
        h('span', { className: 'brand-title' }, 'Hệ Thống Quản Lý Học Sinh')
      ) : h('div', { className: 'brand' }),

      h('div', { className: 'user-status-area', id: 'header_user_status' },
        currentUser ? h(React.Fragment, null,
          h('div', { className: 'status-badge' },
            h('span', { className: 'dot' }),
            currentUser.role === 'admin' ? 'Admin: ' :
            currentUser.role === 'teacher' ? 'GV: ' : 'HS: ',
            currentUser.name
          ),
          h('button', { className: 'btn-logout', id: 'btn_logout_action', onClick: handleLogout }, 'Đăng xuất 🚪')
        ) : h('div', { className: 'status-badge', style: { backgroundColor: '#FBEAEA', color: '#9C3D3D', borderColor: '#fecaca' } }, 'Chưa đăng nhập')
      )
    ),

    h('div', { className: 'main-frame', id: 'app_workspace_body_frame' },
      activeTab === 'login' ? h(LoginPortal, {
        members,
        setCurrentUser,
        setActiveTab
      }) : null,

      activeTab === 'admin' && currentUser?.role === 'admin' ? h(AdminWorkspace, {
        currentUser,
        classes,
        setClasses,
        members,
        setMembers,
        gradesMap,
        setGradesMap
      }) : null,

      activeTab === 'teacher' && currentUser?.role === 'teacher' ? h(TeacherWorkspace, {
        currentUser,
        members,
        gradesMap,
        setGradesMap
      }) : null,

      activeTab === 'student' && currentUser?.role === 'student' ? h(StudentWorkspace, {
        currentUser,
        members,
        gradesMap
      }) : null,

      activeTab === 'source_code' ? h(SourceCodeExplorer) : null
    ),

    h('footer', { className: 'app-footer' })
  );
}
