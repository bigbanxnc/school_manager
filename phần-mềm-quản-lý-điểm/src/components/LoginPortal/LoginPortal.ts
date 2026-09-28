import React, { useState, useEffect, useRef } from 'react';
import { Member } from '../../types';
import { t, getLanguage } from '../../i18n';

interface LoginPortalProps {
  members: Member[];
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
  setCurrentUser: (user: Member | null) => void;
  setActiveTab: (tab: string) => void;
}

const h = React.createElement;

export default function LoginPortal({ members, setMembers, setCurrentUser, setActiveTab }: LoginPortalProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Toast notification for Change Password success ("tab chạy ra thông báo thành công rồi 2-3 giây là biến mất")
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const toastTimerRef = useRef<any>(null);
  const toastExitTimerRef = useRef<any>(null);

  const triggerSuccessToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastExitTimerRef.current) clearTimeout(toastExitTimerRef.current);

    setToastExiting(false);
    setToastMessage(msg);

    // After 2.3 seconds, start exit slide-up animation
    toastExitTimerRef.current = setTimeout(() => {
      setToastExiting(true);
    }, 2300);

    // After 2.65 seconds (~2-3s), fully dismiss the toast
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      setToastExiting(false);
    }, 2650);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastExitTimerRef.current) clearTimeout(toastExitTimerRef.current);
    };
  }, []);

  // State for Change Password modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpEmail, setCpEmail] = useState('');
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpFieldErrors, setCpFieldErrors] = useState<Record<string, string>>({});
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);

  const localizeLoginFieldError = (field: string, rawMsg: string): string => {
    const str = String(rawMsg || '').toLowerCase();
    if (str.includes('không chính xác') || str.includes('unauthorized') || str.includes('hoặc mật khẩu') || (str.includes('email') && str.includes('mật khẩu') && str.includes('chính xác'))) {
      return t('auth.unauthorizedMsg');
    }
    if (field === 'email') {
      if (str.includes('không tồn tại') || str.includes('does not exist') || str.includes('不存在') || str.includes('not found')) {
        return t('auth.emailNotFound');
      }
      if (str.includes('trống') || str.includes('required') || str.includes('empty') || str.includes('blank') || str.includes('不能为空')) {
        return t('auth.emailRequired');
      }
      if (str.includes('đúng') || str.includes('hợp lệ') || str.includes('định dạng') || str.includes('format') || str.includes('invalid') || str.includes('格式') || str.includes('不正确')) {
        return t('auth.invalidEmailFormat');
      }
      // If email input is empty, fallback to emailRequired, otherwise invalidEmailFormat
      if (!loginEmail.trim()) {
        return t('auth.emailRequired');
      }
      return t('auth.invalidEmailFormat');
    }

    if (field === 'password') {
      if (str.includes('trống') || str.includes('required') || str.includes('empty') || str.includes('blank') || str.includes('不能为空')) {
        return t('auth.passwordRequired');
      }
      if (str.includes('sai') || str.includes('incorrect') || str.includes('wrong') || str.includes('không chính xác') || str.includes('密码错误') || str.includes('错误')) {
        return t('auth.incorrectPassword');
      }
      if (!loginPassword) {
        return t('auth.passwordRequired');
      }
      return t('auth.incorrectPassword');
    }

    return rawMsg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const activeLang = getLanguage();

    const cleanEmail = loginEmail.trim();
    const cleanPassword = loginPassword.trim();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': activeLang
        },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword, lang: activeLang })
      });
      if (res.ok) {
        const loggedInUser: Member = await res.json();
        setCurrentUser(loggedInUser);
        if (loggedInUser.mustChangePassword) {
          setActiveTab('force_change_pwd');
        } else {
          setActiveTab(loggedInUser.role);
        }
        return;
      } else {
        const errorData = await res.json().catch(() => ({}));

        // Chống rò rỉ và dò quét tài khoản khi đăng nhập (Bảo mật xác thực)
        // Đồng nhất phản hồi lỗi duy nhất "Email hoặc mật khẩu không chính xác" cho cả 2 trường hợp
        if (res.status === 401 || errorData.status === 401) {
          setFieldErrors({
            password: t('auth.unauthorizedMsg')
          });
          return;
        }

        if (errorData.errors && typeof errorData.errors === 'object' && Object.keys(errorData.errors).length > 0) {
          const localizedErrors: Record<string, string> = {};
          for (const [field, rawMsg] of Object.entries(errorData.errors)) {
            localizedErrors[field] = localizeLoginFieldError(field, String(rawMsg));
          }
          setFieldErrors(localizedErrors);
        } else if (errorData.message) {
          const msg = String(errorData.message).toLowerCase();
          if (msg.includes('sai mật khẩu') || msg.includes('incorrect password') || msg.includes('密码错误')) {
            setFieldErrors({ password: t('auth.incorrectPassword') });
          } else if (msg.includes('cả hai') || msg.includes('both') || (msg.includes('email') && msg.includes('mật khẩu') && msg.includes('trống'))) {
            setFieldErrors({
              email: t('auth.emailRequired'),
              password: t('auth.passwordRequired')
            });
          } else if (msg.includes('định dạng') || msg.includes('không đúng') || msg.includes('format') || msg.includes('invalid email')) {
            setFieldErrors({ email: t('auth.invalidEmailFormat') });
          } else if (msg.includes('không tồn tại') || msg.includes('does not exist') || msg.includes('不存在')) {
            setFieldErrors({ email: t('auth.emailNotFound') });
          } else {
            setFieldErrors({
              email: t('auth.emailNotFound'),
              password: t('auth.incorrectPassword')
            });
          }
        } else {
          setFieldErrors({
            email: t('auth.emailNotFound'),
            password: t('auth.incorrectPassword')
          });
        }
        return;
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Local sync.', err);
    }

    const cleanE = loginEmail.trim().toLowerCase();
    const userWithEmail = members.find(m => (m.email || '').trim().toLowerCase() === cleanE);
    if (userWithEmail && String(userWithEmail.password) === String(loginPassword)) {
      const userCopy = { ...userWithEmail };
      setCurrentUser(userCopy);
      if (userCopy.mustChangePassword) {
        setActiveTab('force_change_pwd');
      } else {
        setActiveTab(userCopy.role);
      }
    } else {
      // Chống dò quét tài khoản: Đồng nhất lỗi duy nhất "Email hoặc mật khẩu không chính xác"
      setFieldErrors({
        password: t('auth.unauthorizedMsg')
      });
    }
  };

  const handleOpenChangePassword = () => {
    setCpEmail(loginEmail || '');
    setCpOldPassword('');
    setCpNewPassword('');
    setCpConfirmPassword('');
    setCpFieldErrors({});
    setCpSuccess('');
    setShowChangePassword(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpFieldErrors({});
    setCpSuccess('');

    setCpLoading(true);

    const activeLang = getLanguage();

    let currentAuthEmail = '';
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        currentAuthEmail = JSON.parse(saved)?.email || '';
      }
    } catch (e) {}

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Language': activeLang
    };
    if (currentAuthEmail) {
      reqHeaders['X-Current-User-Email'] = currentAuthEmail;
    }

    try {
      console.log('[API] Đang gọi POST /api/change-password với email:', cpEmail.trim(), 'lang:', activeLang);
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          email: cpEmail.trim(),
          oldPassword: cpOldPassword,
          newPassword: cpNewPassword,
          confirmPassword: cpConfirmPassword,
          currentUserEmail: currentAuthEmail,
          lang: activeLang
        })
      });
      console.log('[API] Phản hồi từ server status:', res.status);

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setLoginEmail(cpEmail.trim());
        setLoginPassword('');

        if (setMembers) {
          setMembers(prev => prev.map(m =>
            m.email.toLowerCase() === cpEmail.trim().toLowerCase()
              ? { ...m, password: cpNewPassword }
              : m
          ));
        }

        // Close modal immediately and run the success notification tab
        setShowChangePassword(false);
        triggerSuccessToast(t('auth.changePasswordSuccess'));
      } else {
        const localizeCpError = (field: string, rawMsg: string): string => {
          if (!rawMsg) return '';
          const msg = String(rawMsg).toLowerCase();
          if (msg.includes('quyền') || msg.includes('tài khoản khác') || msg.includes('permission') || msg.includes('another account') || msg.includes('无权')) {
            return t('auth.forbiddenAccountChange');
          }
          if (field === 'email') {
            if (msg.includes('không tìm thấy') || msg.includes('không tồn tại') || msg.includes('not found') || msg.includes('未找到')) {
              return t('auth.accountNotFound');
            }
            if (msg.includes('trống') || msg.includes('required') || msg.includes('empty') || msg.includes('不能为空')) {
              return t('auth.emailRequired');
            }
            if (msg.includes('đúng') || msg.includes('hợp lệ') || msg.includes('định dạng') || msg.includes('format') || msg.includes('invalid') || msg.includes('格式')) {
              return t('auth.invalidEmailFormat');
            }
            return t('auth.accountNotFound');
          }
          if (field === 'oldPassword' || field === 'currentPassword') {
            if (msg.includes('trống') || msg.includes('required') || msg.includes('empty') || msg.includes('不能为空')) {
              return t('auth.currentPasswordRequired');
            }
            if (msg.includes('chính xác') || msg.includes('sai') || msg.includes('incorrect') || msg.includes('wrong') || msg.includes('不正确') || msg.includes('错误')) {
              return t('auth.oldPasswordIncorrect');
            }
            return t('auth.oldPasswordIncorrect');
          }
          if (field === 'newPassword') {
            if (msg.includes('3 ký tự') || msg.includes('3 characters') || msg.includes('at least 3') || msg.includes('3个字符') || msg.includes('ngắn')) {
              return t('auth.newPasswordMinLength');
            }
            if (msg.includes('trống') || msg.includes('required') || msg.includes('empty') || msg.includes('不能为空')) {
              return t('auth.newPasswordRequired');
            }
            return t('auth.newPasswordRequired');
          }
          if (field === 'confirmPassword') {
            if (msg.includes('không khớp') || msg.includes('do not match') || msg.includes('mismatch') || msg.includes('不一致')) {
              return t('auth.passwordMismatch');
            }
            if (msg.includes('xác nhận') || msg.includes('confirm') || msg.includes('trống') || msg.includes('required') || msg.includes('empty') || msg.includes('请确认')) {
              return t('auth.confirmPasswordRequired');
            }
            return t('auth.confirmPasswordRequired');
          }
          return rawMsg;
        };

        if (data.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
          const mappedErrors: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.errors)) {
            mappedErrors[k] = localizeCpError(k, String(v));
          }
          setCpFieldErrors(mappedErrors);
        } else {
          const msg = data.message || '';
          const lowerMsg = String(msg).toLowerCase();
          if (res.status === 403 || lowerMsg.includes('quyền') || lowerMsg.includes('tài khoản khác') || lowerMsg.includes('permission') || lowerMsg.includes('another account')) {
            setCpFieldErrors({ email: t('auth.forbiddenAccountChange') });
          } else if (lowerMsg.includes('không tìm thấy tài khoản') || lowerMsg.includes('no account found') || lowerMsg.includes('không tồn tại')) {
            setCpFieldErrors({ email: localizeCpError('email', msg) });
          } else if (lowerMsg.includes('mật khẩu hiện tại không được để trống') || lowerMsg.includes('current password is required')) {
            setCpFieldErrors({ oldPassword: localizeCpError('oldPassword', msg) });
          } else if (lowerMsg.includes('mật khẩu hiện tại không chính xác') || lowerMsg.includes('current password is incorrect') || lowerMsg.includes('sai mật khẩu')) {
            setCpFieldErrors({ oldPassword: localizeCpError('oldPassword', msg) });
          } else if (lowerMsg.includes('xác nhận không khớp') || lowerMsg.includes('do not match')) {
            setCpFieldErrors({ confirmPassword: localizeCpError('confirmPassword', msg) });
          } else if (lowerMsg.includes('ít nhất 3 ký tự') || lowerMsg.includes('mật khẩu mới không được để trống') || lowerMsg.includes('new password is required')) {
            setCpFieldErrors({ newPassword: localizeCpError('newPassword', msg) });
          } else {
            setCpFieldErrors({ email: localizeCpError('email', msg) });
          }
        }
      }
    } catch (err) {
      // Fallback local update if network issue
      const member = members.find(
        m => m.email.toLowerCase() === cpEmail.trim().toLowerCase()
      );
      if (!member) {
        setCpFieldErrors({ email: t('auth.accountNotFound') });
      } else if (member.password !== cpOldPassword) {
        setCpFieldErrors({ oldPassword: t('auth.oldPasswordIncorrect') });
      } else {
        if (setMembers) {
          setMembers(prev => prev.map(m =>
            m.email.toLowerCase() === cpEmail.trim().toLowerCase()
              ? { ...m, password: cpNewPassword }
              : m
          ));
        }
        setLoginEmail(cpEmail.trim());
        setLoginPassword('');
        setShowChangePassword(false);
        triggerSuccessToast(t('auth.changePasswordSuccess'));
      }
    } finally {
      setCpLoading(false);
    }
  };

  return h('div', { className: 'login-screen', id: 'login_portal_screen' },
    // Toast Notification Tab (chạy ra từ bên trái khi đổi mật khẩu thành công rồi biến mất sau 2-3 giây)
    toastMessage ? h('div', {
      id: 'toast_password_change_success',
      className: `toast-notification-tab ${toastExiting ? 'is-leaving' : ''}`,
      role: 'alert',
      'aria-live': 'assertive'
    },
      h('div', { className: 'toast-icon-badge' },
        h('span', { className: 'toast-check-icon' }, '✓')
      ),
      h('div', { className: 'toast-content' },
        h('span', { className: 'toast-title' }, toastMessage)
      ),
      h('button', {
        type: 'button',
        className: 'toast-close-btn',
        id: 'btn_close_toast_password_success',
        onClick: () => {
          setToastExiting(true);
          setTimeout(() => setToastMessage(null), 250);
        },
        title: t('auth.close')
      }, '✕'),
      h('div', { className: 'toast-progress-bar' })
    ) : null,

    h('div', { className: 'login-card', id: 'login_form_card' },
      h('div', { className: 'logo-header' },
        h('div', { className: 'academic-icon' }, '🏫'),
        h('h2', null, t('systemTitle'))
      ),
      h('form', { onSubmit: handleLogin, id: 'form_login_action', noValidate: true },
        h('div', { className: 'form-group' },
          h('label', { htmlFor: 'login_email_input' }, `${t('table.email')} / Mã tài khoản`),
          h('input', {
            type: 'text',
            id: 'login_email_input',
            value: loginEmail,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              setLoginEmail(e.target.value);
              setFieldErrors(prev => ({ ...prev, email: '' }));
            },
            placeholder: '',
            style: fieldErrors.email ? { borderColor: '#ef4444', backgroundColor: '#FEF2F2' } : undefined,
            required: true,
            autoComplete: 'username'
          }),
          fieldErrors.email ? h('div', {
            className: 'field-error-text',
            id: 'error_email_field',
            style: { color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', textAlign: 'left', fontWeight: '500' }
          }, `⚠ ${fieldErrors.email}`) : null
        ),
        h('div', { className: 'form-group' },
          h('label', { htmlFor: 'login_password_input' }, t('table.password')),
          h('div', { style: { position: 'relative', display: 'flex', alignItems: 'center' } },
            h('input', {
              type: showLoginPassword ? 'text' : 'password',
              id: 'login_password_input',
              value: loginPassword,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setLoginPassword(e.target.value);
                setFieldErrors(prev => ({ ...prev, password: '' }));
              },
              placeholder: '',
              style: {
                width: '100%',
                paddingRight: '42px',
                boxSizing: 'border-box',
                ...(fieldErrors.password ? { borderColor: '#ef4444', backgroundColor: '#FEF2F2' } : {})
              },
              required: true,
              autoComplete: 'current-password'
            }),
            h('button', {
              type: 'button',
              tabIndex: -1,
              onClick: () => setShowLoginPassword(!showLoginPassword),
              title: showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu',
              style: {
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.15rem',
                color: '#64748B',
                padding: '4px 6px',
                lineHeight: 1
              }
            }, showLoginPassword ? '🙈' : '👁️')
          ),
          fieldErrors.password ? h('div', {
            className: 'field-error-text',
            id: 'error_password_field',
            style: { color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', textAlign: 'left', fontWeight: '500' }
          }, `⚠ ${fieldErrors.password}`) : null
        ),
        h('button', { type: 'submit', className: 'btn-login-submit', id: 'btn_login_submit' }, t('login')),
        h('div', { style: { marginTop: '16px', textAlign: 'center' } },
          h('button', {
            type: 'button',
            id: 'btn_open_change_password',
            style: {
              background: 'transparent',
              border: 'none',
              color: '#3B593F',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: '500',
              textDecoration: 'underline',
              padding: '6px 10px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            },
            onClick: handleOpenChangePassword
          }, t('auth.changePassword'))
        )
      )
    ),

    // Modal Change Password
    showChangePassword ? h('div', {
      className: 'modal-backdrop',
      id: 'modal_change_password_backdrop',
      onClick: () => !cpLoading && setShowChangePassword(false),
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
        id: 'modal_change_password_card',
        onClick: (e: any) => e.stopPropagation(),
        style: {
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }
      },
        // Modal Header
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
          h('h3', { style: { margin: 0, fontSize: '1.25rem', color: '#222222', fontWeight: '600' } }, t('auth.changePassword')),
          h('button', {
            type: 'button',
            id: 'btn_close_change_password',
            onClick: () => setShowChangePassword(false),
            disabled: cpLoading,
            style: {
              border: 'none',
              background: 'transparent',
              fontSize: '1.2rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666666'
            }
          }, '✕')
        ),

        // Notifications inside modal
        cpSuccess ? h('div', {
          style: {
            backgroundColor: '#EAF5EA',
            color: '#2B6E32',
            border: '1px solid #B8E2BD',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '0.88rem'
          }
        }, `✓ ${cpSuccess}`) : null,

        // Change Password Form
        h('form', { onSubmit: handleChangePasswordSubmit, id: 'form_change_password', noValidate: true },
          h('div', { className: 'form-group', style: { marginBottom: '14px' } },
            h('label', { htmlFor: 'cp_email_input', style: { display: 'block', marginBottom: '6px', fontSize: '0.88rem', fontWeight: '500', color: '#444444' } }, t('table.email')),
            h('input', {
              type: 'email',
              id: 'cp_email_input',
              value: cpEmail,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setCpEmail(e.target.value);
                setCpFieldErrors(prev => ({ ...prev, email: '' }));
              },
              placeholder: 'example@gmail.com',
              required: true,
              style: {
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: cpFieldErrors.email ? '1.5px solid #ef4444' : '1px solid #D2D8D0',
                backgroundColor: cpFieldErrors.email ? '#FEF2F2' : '#FFFFFF',
                fontSize: '0.95rem'
              }
            }),
            cpFieldErrors.email ? h('div', {
              className: 'field-error-text',
              id: 'error_cp_email_field',
              style: { color: '#dc2626', fontSize: '0.8rem', marginTop: '5px', textAlign: 'left', fontWeight: '500' }
            }, `⚠ ${cpFieldErrors.email}`) : null
          ),

          h('div', { className: 'form-group', style: { marginBottom: '14px' } },
            h('label', { htmlFor: 'cp_old_password_input', style: { display: 'block', marginBottom: '6px', fontSize: '0.88rem', fontWeight: '500', color: '#444444' } }, t('auth.currentPassword')),
            h('input', {
              type: 'password',
              id: 'cp_old_password_input',
              value: cpOldPassword,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setCpOldPassword(e.target.value);
                setCpFieldErrors(prev => ({ ...prev, oldPassword: '' }));
              },
              placeholder: '••••••••',
              required: true,
              style: {
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: cpFieldErrors.oldPassword ? '1.5px solid #ef4444' : '1px solid #D2D8D0',
                backgroundColor: cpFieldErrors.oldPassword ? '#FEF2F2' : '#FFFFFF',
                fontSize: '0.95rem'
              }
            }),
            cpFieldErrors.oldPassword ? h('div', {
              className: 'field-error-text',
              id: 'error_cp_old_password_field',
              style: { color: '#dc2626', fontSize: '0.8rem', marginTop: '5px', textAlign: 'left', fontWeight: '500' }
            }, `⚠ ${cpFieldErrors.oldPassword}`) : null
          ),

          h('div', { className: 'form-group', style: { marginBottom: '14px' } },
            h('label', { htmlFor: 'cp_new_password_input', style: { display: 'block', marginBottom: '6px', fontSize: '0.88rem', fontWeight: '500', color: '#444444' } }, t('auth.newPassword')),
            h('input', {
              type: 'password',
              id: 'cp_new_password_input',
              value: cpNewPassword,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setCpNewPassword(e.target.value);
                setCpFieldErrors(prev => ({ ...prev, newPassword: '' }));
              },
              placeholder: '••••••••',
              required: true,
              style: {
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: cpFieldErrors.newPassword ? '1.5px solid #ef4444' : '1px solid #D2D8D0',
                backgroundColor: cpFieldErrors.newPassword ? '#FEF2F2' : '#FFFFFF',
                fontSize: '0.95rem'
              }
            }),
            cpFieldErrors.newPassword ? h('div', {
              className: 'field-error-text',
              id: 'error_cp_new_password_field',
              style: { color: '#dc2626', fontSize: '0.8rem', marginTop: '5px', textAlign: 'left', fontWeight: '500' }
            }, `⚠ ${cpFieldErrors.newPassword}`) : null
          ),

          h('div', { className: 'form-group', style: { marginBottom: '20px' } },
            h('label', { htmlFor: 'cp_confirm_password_input', style: { display: 'block', marginBottom: '6px', fontSize: '0.88rem', fontWeight: '500', color: '#444444' } }, t('auth.confirmNewPassword')),
            h('input', {
              type: 'password',
              id: 'cp_confirm_password_input',
              value: cpConfirmPassword,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setCpConfirmPassword(e.target.value);
                setCpFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
              },
              placeholder: '••••••••',
              required: true,
              style: {
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: cpFieldErrors.confirmPassword ? '1.5px solid #ef4444' : '1px solid #D2D8D0',
                backgroundColor: cpFieldErrors.confirmPassword ? '#FEF2F2' : '#FFFFFF',
                fontSize: '0.95rem'
              }
            }),
            cpFieldErrors.confirmPassword ? h('div', {
              className: 'field-error-text',
              id: 'error_cp_confirm_password_field',
              style: { color: '#dc2626', fontSize: '0.8rem', marginTop: '5px', textAlign: 'left', fontWeight: '500' }
            }, `⚠ ${cpFieldErrors.confirmPassword}`) : null
          ),

          h('div', { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' } },
            h('button', {
              type: 'button',
              id: 'btn_cancel_change_password',
              onClick: () => setShowChangePassword(false),
              disabled: cpLoading,
              style: {
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #D2D8D0',
                background: '#F4F5F0',
                color: '#333333',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }
            }, t('auth.close')),
            h('button', {
              type: 'submit',
              id: 'btn_submit_change_password',
              disabled: cpLoading,
              style: {
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#3B593F',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: cpLoading ? 'not-allowed' : 'pointer',
                opacity: cpLoading ? 0.7 : 1
              }
            }, cpLoading ? t('auth.updating') : t('auth.changePasswordBtn'))
          )
        )
      )
    ) : null
  );
}
