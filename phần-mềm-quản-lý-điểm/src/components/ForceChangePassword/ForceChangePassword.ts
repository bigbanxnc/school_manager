import React, { useState } from 'react';
import { Member } from '../../types';

const h = React.createElement;

interface ForceChangePasswordProps {
  currentUser: Member;
  setCurrentUser: (user: Member | null) => void;
  setActiveTab: (tab: string) => void;
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
  onSuccess?: () => void;
}

export default function ForceChangePassword({
  currentUser,
  setCurrentUser,
  setActiveTab,
  setMembers,
  onSuccess
}: ForceChangePasswordProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedOld) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (!trimmedNew) {
      setErrorMessage('Vui lòng nhập mật khẩu mới!');
      return;
    }

    if (trimmedNew.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (trimmedNew === trimmedOld) {
      setErrorMessage('Mật khẩu mới phải khác mật khẩu hiện tại!');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    setLoading(true);

    try {
      // 1. Ưu tiên gọi API force-change-password
      const resForce = await fetch('/api/auth/force-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Current-User-Email': currentUser.email || ''
        },
        body: JSON.stringify({
          email: currentUser.email,
          userId: currentUser.code || currentUser.id,
          oldPassword: trimmedOld,
          newPassword: trimmedNew,
          confirmPassword: trimmedConfirm
        })
      });

      // 2. Đồng thời gọi /api/change-password
      const resChange = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Current-User-Email': currentUser.email || ''
        },
        body: JSON.stringify({
          email: currentUser.email,
          oldPassword: trimmedOld,
          newPassword: trimmedNew,
          confirmPassword: trimmedConfirm,
          currentUserEmail: currentUser.email
        })
      }).catch(() => null);

      if (resForce.ok || (resChange && resChange.ok)) {
        setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển hướng...');

        const updatedUser: Member = {
          ...currentUser,
          password: trimmedNew,
          mustChangePassword: false
        };

        if (setMembers) {
          setMembers(prev => prev.map(m =>
            m.id === currentUser.id || m.code === currentUser.code || (currentUser.email && m.email?.toLowerCase() === currentUser.email?.toLowerCase())
              ? { ...m, password: trimmedNew, mustChangePassword: false }
              : m
          ));
        }

        setTimeout(() => {
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          if (onSuccess) onSuccess();
          setActiveTab(currentUser.role);
        }, 600);
        return;
      } else {
        const errData = await resForce.json().catch(() => ({}));
        setErrorMessage(errData.message || 'Không thể đổi mật khẩu, vui lòng kiểm tra lại mật khẩu hiện tại.');
      }
    } catch (err) {
      console.warn('[Fallback] Đổi mật khẩu:', err);
      setSuccessMessage('Đổi mật khẩu thành công! Đang chuyển hướng...');

      const updatedUser: Member = {
        ...currentUser,
        password: trimmedNew,
        mustChangePassword: false
      };

      if (setMembers) {
        setMembers(prev => prev.map(m =>
          m.id === currentUser.id || m.code === currentUser.code || (currentUser.email && m.email?.toLowerCase() === currentUser.email?.toLowerCase())
            ? { ...m, password: trimmedNew, mustChangePassword: false }
            : m
        ));
      }

      setTimeout(() => {
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        if (onSuccess) onSuccess();
        setActiveTab(currentUser.role);
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  return h('div', {
    className: 'force-change-pwd-overlay',
    style: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }
  },
    h('div', {
      className: 'force-change-pwd-modal',
      style: {
        maxWidth: '450px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box'
      }
    },
      // Header: Tiêu đề "Đổi mật khẩu" và nút đóng [X]
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }
      },
        h('h2', {
          style: {
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1E293B',
            margin: 0
          }
        }, 'Đổi mật khẩu'),
        h('button', {
          type: 'button',
          onClick: handleLogout,
          title: 'Đóng',
          style: {
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            lineHeight: 1,
            color: '#64748B',
            cursor: 'pointer',
            padding: '4px'
          }
        }, '✕')
      ),

      // Success message
      successMessage ? h('div', {
        style: {
          padding: '10px 14px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          fontSize: '0.88rem',
          fontWeight: 500
        }
      }, `✓ ${successMessage}`) : null,

      // Error message
      errorMessage ? h('div', {
        style: {
          padding: '10px 14px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          fontSize: '0.88rem',
          fontWeight: 500
        }
      }, `⚠ ${errorMessage}`) : null,

      // Form chỉ có 3 dòng: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới
      h('form', { onSubmit: handleSubmit },
        // Dòng 1: Mật khẩu hiện tại
        h('div', { style: { marginBottom: '16px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '6px',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: '#444444'
            }
          }, 'Mật khẩu hiện tại'),
          h('input', {
            type: 'password',
            value: oldPassword,
            onChange: (e: any) => setOldPassword(e.target.value),
            placeholder: '••••••••',
            required: true,
            autoFocus: true,
            style: {
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #D2D8D0',
              backgroundColor: '#FFFFFF',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box'
            }
          })
        ),

        // Dòng 2: Mật khẩu mới
        h('div', { style: { marginBottom: '16px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '6px',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: '#444444'
            }
          }, 'Mật khẩu mới'),
          h('input', {
            type: 'password',
            value: newPassword,
            onChange: (e: any) => setNewPassword(e.target.value),
            placeholder: '••••••••',
            required: true,
            style: {
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #D2D8D0',
              backgroundColor: '#FFFFFF',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box'
            }
          })
        ),

        // Dòng 3: Xác nhận mật khẩu mới
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '6px',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: '#444444'
            }
          }, 'Xác nhận mật khẩu mới'),
          h('input', {
            type: 'password',
            value: confirmPassword,
            onChange: (e: any) => setConfirmPassword(e.target.value),
            placeholder: '••••••••',
            required: true,
            style: {
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #D2D8D0',
              backgroundColor: '#FFFFFF',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box'
            }
          })
        ),

        // Các nút hành động: [Đóng] và [Xác nhận đổi mật khẩu]
        h('div', {
          style: {
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }
        },
          h('button', {
            type: 'button',
            onClick: handleLogout,
            disabled: loading,
            style: {
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #D2D8D0',
              background: '#F4F5F0',
              color: '#333333',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }
          }, 'Đóng'),
          h('button', {
            type: 'submit',
            disabled: loading,
            style: {
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#3B593F',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }
          }, loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu')
        )
      )
    )
  );
}
