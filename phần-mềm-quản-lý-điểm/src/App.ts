import React, { useState, useEffect, useCallback } from 'react';
import { Member, SubjectGrades, ClassItem, Role, UserPermissions } from './types';
import LoginPortal from './components/LoginPortal/LoginPortal';
import AdminWorkspace from './components/AdminWorkspace/AdminWorkspace';
import TeacherWorkspace from './components/TeacherWorkspace/TeacherWorkspace';
import StudentWorkspace from './components/StudentWorkspace/StudentWorkspace';
import SourceCodeExplorer from './components/SourceCodeExplorer/SourceCodeExplorer';
import ForceChangePassword from './components/ForceChangePassword/ForceChangePassword';
import { getLanguage, setLanguage, t, formatRole, formatUserName, Language } from './i18n';

const h = React.createElement;

export default function App() {
  const [currentLang, setCurrentLangState] = useState<Language>(getLanguage());
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      setCurrentLangState(e.detail);
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const [classes, setRawClasses] = useState<ClassItem[]>([]);
  const [members, setRawMembers] = useState<Member[]>([]);
  const [gradesMap, setGradesMap] = useState<{ [studentId: string]: SubjectGrades }>({});

  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    const user = currentUser;
    if (user && members.length > 0) {
      const updatedUser = members.find(m => m.id === user.id);
      if (updatedUser) {
        if (
          updatedUser.className !== user.className ||
          updatedUser.name !== user.name ||
          updatedUser.email !== user.email ||
          JSON.stringify(updatedUser.permissions) !== JSON.stringify(user.permissions)
        ) {
          setCurrentUser({
            ...updatedUser,
            grades: user.grades || updatedUser.grades
          });
        }
      }
    }
  }, [members, currentUser]);

  const setMembers = useCallback((update: React.SetStateAction<Member[]>) => {
    setRawMembers(prev => {
      const rawNext = typeof update === 'function' ? update(prev) : update;
      const next = rawNext.map(m => {
        const preferredId = m.code ? m.code : String(m.id || '');
        return {
          ...m,
          id: preferredId
        };
      });
      const seen = new Set<string>();
      return next.filter(m => {
        const idClean = String(m.code || m.id || '').trim().toUpperCase();
        if (!idClean) return true;
        if (seen.has(idClean)) return false;
        seen.add(idClean);
        return true;
      });
    });
  }, []);

  const setClasses = useCallback((update: React.SetStateAction<ClassItem[]>) => {
    setRawClasses(prev => {
      const rawNext = typeof update === 'function' ? update(prev) : update;
      const next = rawNext.map(c => {
        const preferredId = c.code ? c.code : String(c.id || '');
        return {
          ...c,
          id: preferredId
        };
      });
      const seen = new Set<string>();
      return next.filter(c => {
        const idClean = String(c.code || c.id || '').trim().toUpperCase();
        if (!idClean) return true;
        if (seen.has(idClean)) return false;
        seen.add(idClean);
        return true;
      });
    });
  }, []);

  const [activeTab, setActiveTab] = useState<string>('login');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.mustChangePassword) {
        setActiveTab('force_change_pwd');
      } else {
        setActiveTab(currentUser.role);
      }
    } else {
      setActiveTab('login');
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
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
        h('span', { className: 'brand-title' }, t('systemTitle'))
      ) : h('div', { className: 'brand' }),

      h('div', { className: 'user-status-area', id: 'header_user_status', style: { display: 'flex', alignItems: 'center', gap: '16px' } },
        // Globe Language Icon Button
        h('button', {
          className: 'globe-lang-btn',
          title: t('selectLanguage'),
          style: {
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#F4F5F0',
            border: '1px solid #D2D8D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#3B593F',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          },
          onClick: () => setShowLangModal(true)
        },
          h('svg', {
            viewBox: '0 0 24 24',
            width: '20',
            height: '20',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          },
            h('circle', { cx: '12', cy: '12', r: '10' }),
            h('line', { x1: '2', y1: '12', x2: '22', y2: '12' }),
            h('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })
          )
        ),

        currentUser ? h(React.Fragment, null,
          h('div', { className: 'status-badge' },
            h('span', { className: 'dot' }),
            formatRole(currentUser.role) + ': ',
            formatUserName(currentUser)
          ),
          h('button', { className: 'btn-logout', id: 'btn_logout_action', onClick: handleLogout }, `${t('logout')} 🚪`)
        ) : h('div', { className: 'status-badge', style: { backgroundColor: '#FBEAEA', color: '#9C3D3D', borderColor: '#fecaca' } }, 'Chưa đăng nhập')
      )
    ),

    h('div', { className: 'main-frame', id: 'app_workspace_body_frame' },
      activeTab === 'login' ? h(LoginPortal, {
        members,
        setMembers,
        setCurrentUser,
        setActiveTab
      }) : null,

      currentUser && (currentUser.mustChangePassword || activeTab === 'force_change_pwd') ? h(ForceChangePassword, {
        currentUser,
        setCurrentUser,
        setActiveTab,
        setMembers
      }) : h(React.Fragment, null,
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

        activeTab === 'source_code' ? h(SourceCodeExplorer, null) : null
      )
    ),

    showLangModal ? h('div', {
      className: 'modal-backdrop',
      onClick: () => setShowLangModal(false),
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(3px)'
      }
    },
      h('div', {
        className: 'modal-card',
        onClick: (e: any) => e.stopPropagation(),
        style: {
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }
      },
        // Close button at top-left
        h('div', { style: { display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' } },
          h('button', {
            onClick: () => setShowLangModal(false),
            style: {
              border: 'none',
              background: 'transparent',
              fontSize: '1.2rem',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#222222',
              transition: 'background-color 0.2s',
              margin: '-8px 0 0 -8px'
            },
            onMouseEnter: (e: any) => e.currentTarget.style.backgroundColor = '#F7F7F7',
            onMouseLeave: (e: any) => e.currentTarget.style.backgroundColor = 'transparent'
          }, '✕')
        ),

        // Modal Title
        h('h2', {
          style: {
            margin: '0 0 28px 0',
            fontSize: '1.45rem',
            fontWeight: '700',
            color: '#222222',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }
        }, t('selectLanguage')),

        // Languages Grid
        h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px 16px'
          }
        },
          [
            { code: 'vi' as Language, id: 'vi_VN', name: 'Tiếng Việt', sub: 'Việt Nam' },
            { code: 'en' as Language, id: 'en_US', name: 'English', sub: 'United States' },
            { code: 'zh' as Language, id: 'zh_CN', name: '简体中文', sub: '中国' }
          ].map(item => {
            const isSelected = currentLang === item.code;

            return h('div', {
              key: item.id,
              onClick: () => {
                changeLanguage(item.code);
                setShowLangModal(false);
              },
              style: {
                padding: '14px 18px',
                borderRadius: '12px',
                border: isSelected ? '1.5px solid #222222' : '1px solid transparent',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              },
              onMouseEnter: (e: any) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#F7F7F7';
                }
              },
              onMouseLeave: (e: any) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }
            },
              h('div', {
                style: {
                  fontWeight: isSelected ? '600' : '400',
                  color: '#222222',
                  fontSize: '0.95rem',
                  lineHeight: '1.3'
                }
              }, item.name),
              h('div', {
                style: {
                  fontSize: '0.82rem',
                  color: '#717171',
                  marginTop: '2px',
                  fontWeight: '400'
                }
              }, item.sub)
            );
          })
        )
      )
    ) : null
  );
}
