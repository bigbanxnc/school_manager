import React, { useState } from 'react';
import { Member, Role } from '../../types';

interface LoginPortalProps {
  members: Member[];
  setCurrentUser: (user: Member | null) => void;
  setActiveTab: (tab: string) => void;
}

const h = React.createElement;

export default function LoginPortal({ members, setCurrentUser, setActiveTab }: LoginPortalProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // --- Giao tiếp API Network ---
    try {
      console.log(`[API Network Call] POST /api/login`, { email: loginEmail });
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        const loggedInUser: Member = await res.json();
        console.log('[API Network Success] Đăng nhập được xác thực bởi server.', loggedInUser);
        setCurrentUser(loggedInUser);
        setActiveTab(loggedInUser.role);
        return;
      } else {
        const errorData = await res.json().catch(() => ({}));
        setLoginError(errorData.message || 'Email hoặc mật khẩu không đúng từ server.');
        return;
      }
    } catch (err) {
      console.warn('[API Network Simulated fallback] Đồng bộ LocalState.', err);
    }

    const user = members.find(
      m => m.email.toLowerCase() === loginEmail.trim().toLowerCase() && m.password === loginPassword
    );
    if (user) {
      setCurrentUser(user);
      setActiveTab(user.role);
    } else {
      setLoginError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleQuickLogin = (role: Role) => {
    const user = members.find(m => m.role === role);
    if (user) {
      setCurrentUser(user);
      setLoginEmail(user.email);
      setLoginPassword(user.password);
      setActiveTab(role);
    }
  };

  return h('div', { className: 'login-screen', id: 'login_portal_screen' },
    h('div', { className: 'login-card', id: 'login_form_card' },
      h('div', { className: 'logo-header' },
        h('div', { className: 'academic-icon' }, '🏫'),
        h('h2', null, 'Hệ Thống Quản Lý Học Sinh')
      ),
      loginError ? h('div', { className: 'error-box' }, loginError) : null,
      h('form', { onSubmit: handleLogin, id: 'form_login_action' },
        h('div', { className: 'form-group' },
          h('label', { htmlFor: 'login_email_input' }, 'Tài khoản (Email)'),
          h('input', {
            type: 'email',
            id: 'login_email_input',
            value: loginEmail,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value),
            placeholder: 'Ten@gmail.com',
            required: true
          })
        ),
        h('div', { className: 'form-group' },
          h('label', { htmlFor: 'login_password_input' }, 'Mật khẩu'),
          h('input', {
            type: 'password',
            id: 'login_password_input',
            value: loginPassword,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value),
            placeholder: 'Nhập mật khẩu',
            required: true
          })
        ),
        h('button', { type: 'submit', className: 'btn-login-submit', id: 'btn_login_submit' }, 'Đăng Nhập Hệ Thống')
      )
    )
  );
}
