import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

export function sha1Hex(input: string): string {
  if (!input) return '';
  return crypto.createHash('sha1').update(String(input), 'utf8').digest('hex').toLowerCase();
}

export function isSha1(str: string): boolean {
  return typeof str === 'string' && /^[a-fA-F0-9]{40}$/.test(str.trim());
}

/**
 * Sinh mật khẩu ngẫu nhiên sử dụng SecureRandom (crypto.randomInt)
 * Độ dài đúng 10 ký tự.
 * Đảm bảo luôn chứa tối thiểu: 1 chữ thường (a-z), 1 chữ hoa (A-Z), 1 chữ số (0-9).
 */
export function generateSecureRandomPassword(length = 10): string {
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digitChars = '0123456789';
  const allChars = lowercaseChars + uppercaseChars + digitChars;

  // Đảm bảo luôn chứa tối thiểu 1 chữ thường (a-z), 1 chữ hoa (A-Z) và 1 chữ số (0-9)
  const passwordChars: string[] = [
    lowercaseChars[crypto.randomInt(0, lowercaseChars.length)],
    uppercaseChars[crypto.randomInt(0, uppercaseChars.length)],
    digitChars[crypto.randomInt(0, digitChars.length)]
  ];

  // Bổ sung các ký tự còn lại cho đủ độ dài đúng 10 ký tự
  for (let i = passwordChars.length; i < length; i++) {
    passwordChars.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Trộn đều ngẫu nhiên bảo mật cao (Fisher-Yates shuffle với CSPRNG)
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}

export function ensureSha1(password: string): string {
  if (!password) return '';
  const trimmed = String(password).trim();
  if (isSha1(trimmed)) return trimmed.toLowerCase();
  return sha1Hex(trimmed);
}

export function verifyPassword(rawPassword: string, storedHashOrPassword: string): boolean {
  if (!rawPassword || !storedHashOrPassword) return false;
  const hashed = sha1Hex(String(rawPassword).trim());
  return hashed === String(storedHashOrPassword).trim().toLowerCase() || String(rawPassword).trim() === String(storedHashOrPassword).trim();
}

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  console.log(`\n\x1b[36m[API Request]\x1b[0m ${req.method} ${req.originalUrl}`);
  next();
});

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';

const SERVER_I18N = {
  vi: {
    emailRequired: 'Email không được để trống',
    passwordRequired: 'Mật khẩu không được để trống',
    bothRequired: 'Email và mật khẩu không được để trống',
    incorrectPassword: 'Sai mật khẩu!',
    emailInvalidFormat: 'Email không đúng định dạng (VD: example@school.edu.vn)',
    emailNotFound: 'Email không tồn tại!',
    unauthorizedMsg: 'Email hoặc mật khẩu không chính xác!',
    forbiddenAccountChange: 'Bạn không có quyền thay đổi mật khẩu của tài khoản khác!',
    currentPasswordRequired: 'Mật khẩu hiện tại không được để trống',
    newPasswordRequired: 'Mật khẩu mới không được để trống',
    newPasswordMinLength: 'Mật khẩu mới phải có ít nhất 3 ký tự.',
    confirmPasswordRequired: 'Vui lòng xác nhận mật khẩu mới',
    passwordMismatch: 'Mật khẩu xác nhận không khớp.',
    accountNotFound: 'Không tìm thấy tài khoản với email hoặc mã này.',
    oldPasswordIncorrect: 'Mật khẩu hiện tại không chính xác.',
    changePasswordSuccess: 'Đổi mật khẩu thành công.',
    systemError: 'Có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau.'
  },
  en: {
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    bothRequired: 'Email and password are required',
    incorrectPassword: 'Incorrect password!',
    emailInvalidFormat: 'Invalid email format (e.g. example@school.edu.vn)',
    emailNotFound: 'Email does not exist!',
    unauthorizedMsg: 'Incorrect email or password!',
    forbiddenAccountChange: 'You do not have permission to change password of another account!',
    currentPasswordRequired: 'Current password is required',
    newPasswordRequired: 'New password is required',
    newPasswordMinLength: 'New password must be at least 3 characters.',
    confirmPasswordRequired: 'Please confirm your new password',
    passwordMismatch: 'New passwords do not match.',
    accountNotFound: 'No account found with this email or ID.',
    oldPasswordIncorrect: 'Current password is incorrect.',
    changePasswordSuccess: 'Password changed successfully.',
    systemError: 'A system error occurred. Please try again later.'
  },
  zh: {
    emailRequired: '邮箱不能为空',
    passwordRequired: '密码不能为空',
    bothRequired: '邮箱和密码不能为空',
    incorrectPassword: '密码错误！',
    emailInvalidFormat: '邮箱格式不正确 (例: example@school.edu.vn)',
    emailNotFound: '邮箱不存在！',
    unauthorizedMsg: '邮箱或密码不正确！',
    forbiddenAccountChange: '您无权更改其他账户的密码！',
    currentPasswordRequired: '当前密码不能为空',
    newPasswordRequired: '新密码不能为空',
    newPasswordMinLength: '新密码至少需要3个字符。',
    confirmPasswordRequired: '请确认新密码',
    passwordMismatch: '两次输入的新密码不一致。',
    accountNotFound: '未找到该邮箱或学工号的账户。',
    oldPasswordIncorrect: '当前密码不正确。',
    changePasswordSuccess: '修改密码成功。',
    systemError: '系统发生错误，请稍后重试。'
  }
};

function getRequestLang(req: any): 'vi' | 'en' | 'zh' {
  const queryLang = (req.query?.lang as string || '').toLowerCase();
  if (queryLang === 'en' || queryLang === 'zh' || queryLang === 'vi') return queryLang as any;
  const bodyLang = (req.body?.lang as string || '').toLowerCase();
  if (bodyLang === 'en' || bodyLang === 'zh' || bodyLang === 'vi') return bodyLang as any;
  const header = (req.headers['accept-language'] || req.headers['content-language'] || '').toLowerCase();
  if (header.startsWith('en') || header.includes(',en') || header.includes('en-') || header.includes('en;')) return 'en';
  if (header.startsWith('zh') || header.includes(',zh') || header.includes('zh-') || header.includes('zh;')) return 'zh';
  return 'vi';
}

function translateErrorMessage(msg: string, lang: 'vi' | 'en' | 'zh'): string {
  if (!msg || lang === 'vi') return msg;
  const dict = SERVER_I18N[lang];
  const s = String(msg).toLowerCase();

  if (s.includes('email và mật khẩu không') || s.includes('email và mật khẩu')) return dict.bothRequired;
  if ((s.includes('không chính xác') && (s.includes('email') || s.includes('mật khẩu'))) || s.includes('hoặc mật khẩu')) return dict.unauthorizedMsg;
  if (s.includes('tài khoản khác') || s.includes('quyền thay đổi')) return dict.forbiddenAccountChange;
  if (s.includes('không tồn tại')) return dict.emailNotFound;
  if (s.includes('sai mật khẩu') || (s.includes('mật khẩu') && s.includes('sai'))) return dict.incorrectPassword;
  if (s.includes('hiện tại không chính xác')) return dict.oldPasswordIncorrect;
  if (s.includes('không tìm thấy tài khoản') || s.includes('không tìm thấy thành viên')) return dict.accountNotFound;
  if (s.includes('mật khẩu hiện tại không được để trống')) return dict.currentPasswordRequired;
  if (s.includes('mật khẩu mới không được để trống')) return dict.newPasswordRequired;
  if (s.includes('ít nhất 3 ký tự') || s.includes('ít nhất 3')) return dict.newPasswordMinLength;
  if (s.includes('xác nhận không khớp') || s.includes('không khớp')) return dict.passwordMismatch;
  if (s.includes('xác nhận mật khẩu mới') || s.includes('vui lòng xác nhận')) return dict.confirmPasswordRequired;
  if (s.includes('email không được để trống')) return dict.emailRequired;
  if (s.includes('mật khẩu không được để trống')) return dict.passwordRequired;
  if (s.includes('email không đúng') || s.includes('định dạng') || s.includes('email không hợp lệ')) return dict.emailInvalidFormat;
  if (s.includes('đổi mật khẩu thành công') || s.includes('thành công')) return dict.changePasswordSuccess;
  if (s.includes('lỗi hệ thống') || s.includes('có lỗi xảy ra')) return dict.systemError;

  if (msg.includes(';')) {
    return msg.split(';')
      .map(part => translateErrorMessage(part.trim(), lang))
      .join('; ');
  }

  return msg;
}

function translateErrorPayload(data: any, lang: 'vi' | 'en' | 'zh'): any {
  if (!data || typeof data !== 'object' || lang === 'vi') return data;
  const dict = SERVER_I18N[lang];
  const copy = { ...data };

  if (copy.errors && typeof copy.errors === 'object') {
    const translatedErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(copy.errors)) {
      const s = String(v).toLowerCase();
      if (k === 'email') {
        if (s.includes('không tồn tại') || s.includes('not found') || s.includes('does not exist')) {
          translatedErrors[k] = dict.emailNotFound;
        } else if (s.includes('trống') || s.includes('required') || s.includes('empty')) {
          translatedErrors[k] = dict.emailRequired;
        } else if (s.includes('đúng') || s.includes('định dạng') || s.includes('hợp lệ') || s.includes('format')) {
          translatedErrors[k] = dict.emailInvalidFormat;
        } else {
          translatedErrors[k] = translateErrorMessage(String(v), lang);
        }
      } else if (k === 'password') {
        if (s.includes('trống') || s.includes('required') || s.includes('empty')) {
          translatedErrors[k] = dict.passwordRequired;
        } else if (s.includes('sai') || s.includes('incorrect') || s.includes('wrong')) {
          translatedErrors[k] = dict.incorrectPassword;
        } else {
          translatedErrors[k] = translateErrorMessage(String(v), lang);
        }
      } else if (k === 'oldPassword') {
        if (s.includes('trống') || s.includes('required') || s.includes('empty')) {
          translatedErrors[k] = dict.currentPasswordRequired;
        } else if (s.includes('chính xác') || s.includes('sai') || s.includes('incorrect')) {
          translatedErrors[k] = dict.oldPasswordIncorrect;
        } else {
          translatedErrors[k] = translateErrorMessage(String(v), lang);
        }
      } else if (k === 'newPassword') {
        if (s.includes('3 ký tự') || s.includes('3 characters')) {
          translatedErrors[k] = dict.newPasswordMinLength;
        } else if (s.includes('trống') || s.includes('required') || s.includes('empty')) {
          translatedErrors[k] = dict.newPasswordRequired;
        } else {
          translatedErrors[k] = translateErrorMessage(String(v), lang);
        }
      } else if (k === 'confirmPassword') {
        if (s.includes('khớp') || s.includes('match')) {
          translatedErrors[k] = dict.passwordMismatch;
        } else if (s.includes('xác nhận') || s.includes('trống') || s.includes('required')) {
          translatedErrors[k] = dict.confirmPasswordRequired;
        } else {
          translatedErrors[k] = translateErrorMessage(String(v), lang);
        }
      } else {
        translatedErrors[k] = translateErrorMessage(String(v), lang);
      }
    }
    copy.errors = translatedErrors;
  }

  if (copy.message) {
    copy.message = translateErrorMessage(copy.message, lang);
  }

  return copy;
}

let lastBackendState: 'online' | 'offline' | 'error' | 'unknown' = 'unknown';
let lastErrorStatus: number | null = null;

app.use('/api', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !process.env.BACKEND_URL) {
    return next();
  }

  const fetchFromBackend = async (subPath: string, options: any = {}) => {
    const targetUrl = `${BACKEND_URL}${subPath}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    
    console.log(`  \x1b[34m[Proxy]\x1b[0m Gửi request tới Spring Boot: ${options.method || 'GET'} ${targetUrl}`);
    try {
      const response = await fetch(targetUrl, {
        ...options,
        redirect: 'manual',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.status >= 300 && response.status < 400) {
        throw new Error('Redirect detected (Likely environment auth/cookie check page)');
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Received HTML response instead of JSON API response');
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const updateBackendState = (newState: 'online' | 'offline' | 'error', status: number | null = null) => {
    if (newState === 'online' && lastBackendState !== 'online') {
      console.log(`\x1b[32m[Backend Status] Connected successfully to Spring Boot backend at ${BACKEND_URL}.\x1b[0m`);
      lastBackendState = 'online';
    } else if (newState === 'error') {
      if (lastBackendState !== 'error' || lastErrorStatus !== status) {
        console.warn(`\x1b[33m[Backend Status] Spring Boot returned non-OK status ${status}. Falling back to local db.json mock data for GET requests.\x1b[0m`);
        lastBackendState = 'error';
        lastErrorStatus = status;
      }
    } else if (newState === 'offline' && lastBackendState !== 'offline') {
      console.log(`\x1b[33m[Backend Status] Spring Boot backend at ${BACKEND_URL} is offline or unreachable. Falling back to local db.json mock data.\x1b[0m`);
      console.log(`\x1b[32m💡 TIP: If Spring Boot is running, make sure your BACKEND_URL in .env is correct (try 'http://127.0.0.1:8080' instead of 'localhost').\x1b[0m`);
      lastBackendState = 'offline';
    }
  };

  try {
    // Handle role permissions, login, change-password, force-change-password, reset-password, and next-id directly at Node/DB layer
    if (
      req.path.startsWith('/login') ||
      req.path.startsWith('/role-permissions') ||
      req.path.startsWith('/change-password') ||
      req.path.startsWith('/next-id') ||
      req.path.includes('/reset-password') ||
      req.path.includes('/force-change-password')
    ) {
      return next();
    }

    const classMembersMatch = req.path.match(/^\/classes\/([^/]+)\/members$/);
    if (req.method === 'GET' && classMembersMatch) {
      const classId = classMembersMatch[1];
      try {
        const response = await fetchFromBackend('/api/members');
        if (response.ok) {
          updateBackendState('online');
          const members = await response.json();
          const classMembers = members.filter((m: any) => 
            (m.role === 'student' && m.className === classId) ||
            (m.role === 'teacher' && m.assignedClasses?.includes(classId))
          );
          return res.json(classMembers);
        }
      } catch (e) {
        updateBackendState('offline');
      }
      const db = readDb();
      const classMembers = db.members.filter((m: any) => 
        (m.role === 'student' && m.className === classId) ||
        (m.role === 'teacher' && m.assignedClasses?.includes(classId))
      );
      return res.json(classMembers);
    }

    if (req.method === 'PUT' && req.path.startsWith('/grades')) {
      const db = readDb();
      const updatedBy = req.body?.updatedBy;
      if (updatedBy) {
        const user = db.members.find((m: any) => m.id === updatedBy);
        if (user && user.role === 'teacher') {
          const teacherPerms = db.rolePermissions?.teacher || DEFAULT_ROLE_PERMISSIONS.teacher;
          if (teacherPerms.teacherEnterGrades === false) {
            return res.status(403).json({ message: 'Giáo viên chưa được cấp quyền nhập hoặc sửa điểm.' });
          }
        }
      }
    }

    const targetUrl = `${BACKEND_URL}${req.originalUrl}`;
    const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0;
    const body = hasBody ? JSON.stringify(req.body) : undefined;
    
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['accept-language']) {
      headers['Accept-Language'] = req.headers['accept-language'];
    }

    const response = await fetchFromBackend(req.originalUrl, {
      method: req.method,
      headers,
      body
    });
    
    if (!response.ok) {
      updateBackendState('error', response.status);
      if (req.method === 'GET' || response.status === 404 || response.status === 405 || response.status === 500 || req.originalUrl.includes('/permissions') || req.originalUrl.includes('/change-password')) {
        console.log(`  \x1b[33m[Fallback]\x1b[0m Spring Boot trả về lỗi ${response.status} cho ${req.method} ${req.originalUrl}. Chuyển sang xử lý bằng db.json Mock.`);
        return next();
      }
      
      res.status(response.status);
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        let data = await response.json();
        const lang = getRequestLang(req);
        if (lang !== 'vi' && data && typeof data === 'object') {
          data = translateErrorPayload(data, lang);
        }
        return res.json(data);
      } else {
        const text = await response.text();
        return res.send(text);
      }
    }

    updateBackendState('online');
    
    res.status(response.status);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      let data = await response.json();
      const lang = getRequestLang(req);
      if (lang !== 'vi' && data && typeof data === 'object' && data.message) {
        data.message = translateErrorMessage(data.message, lang);
      }
      
      if (req.path === '/login' && data && typeof data === 'object') {
        try {
          const db = readDb();
          const role = data.role as 'admin' | 'teacher' | 'student';
          const rolePerms = (db.rolePermissions && db.rolePermissions[role])
            ? db.rolePermissions[role]
            : (DEFAULT_ROLE_PERMISSIONS[role] || {});
          data.permissions = { ...rolePerms };
          if (data.role === 'student') {
            const rawId = String(data.id || '').trim().toLowerCase();
            const rawCode = String(data.code || '').trim().toLowerCase();
            const rawEmail = String(data.email || '').trim().toLowerCase();
            const matchingMember = db.members.find((m: any) => {
              const mid = String(m.id || '').trim().toLowerCase();
              const mcode = String(m.code || '').trim().toLowerCase();
              const memail = String(m.email || '').trim().toLowerCase();
              return (rawId && (mid === rawId || mcode === rawId)) ||
                     (rawCode && (mid === rawCode || mcode === rawCode)) ||
                     (rawEmail && memail === rawEmail);
            });

            const idToMatch = matchingMember ? String(matchingMember.id || '').trim().toLowerCase() : '';
            const codeToMatch = matchingMember ? String(matchingMember.code || '').trim().toLowerCase() : '';

            const grade = db.grades.find((g: any) => {
              const gid = String(g.studentId || '').trim().toLowerCase();
              const gcode = String(g.studentCode || '').trim().toLowerCase();
              return (rawId && (gid === rawId || gcode === rawId)) ||
                     (rawCode && (gid === rawCode || gcode === rawCode)) ||
                     (idToMatch && (gid === idToMatch || gcode === idToMatch)) ||
                     (codeToMatch && (gid === codeToMatch || gcode === codeToMatch));
            });

            if (grade) {
              const mathOral = grade.math_oral !== undefined && grade.math_oral !== null && grade.math_oral !== '' ? parseFloat(grade.math_oral) : null;
              const mathM15 = grade.math_m15 !== undefined && grade.math_m15 !== null && grade.math_m15 !== '' ? parseFloat(grade.math_m15) : null;
              const mathMid = grade.math_mid !== undefined && grade.math_mid !== null && grade.math_mid !== '' ? parseFloat(grade.math_mid) : null;
              const mathFinal = grade.math_final !== undefined && grade.math_final !== null && grade.math_final !== '' ? parseFloat(grade.math_final) : null;
              let mathVal = calculateSubjectGPA(mathOral, mathM15, mathMid, mathFinal);
              if (mathVal === null && grade.math !== null && grade.math !== undefined && grade.math !== '') {
                mathVal = parseFloat(grade.math);
              }

              const litOral = grade.literature_oral !== undefined && grade.literature_oral !== null && grade.literature_oral !== '' ? parseFloat(grade.literature_oral) : null;
              const litM15 = grade.literature_m15 !== undefined && grade.literature_m15 !== null && grade.literature_m15 !== '' ? parseFloat(grade.literature_m15) : null;
              const litMid = grade.literature_mid !== undefined && grade.literature_mid !== null && grade.literature_mid !== '' ? parseFloat(grade.literature_mid) : null;
              const litFinal = grade.literature_final !== undefined && grade.literature_final !== null && grade.literature_final !== '' ? parseFloat(grade.literature_final) : null;
              let litVal = calculateSubjectGPA(litOral, litM15, litMid, litFinal);
              if (litVal === null && grade.literature !== null && grade.literature !== undefined && grade.literature !== '') {
                litVal = parseFloat(grade.literature);
              }

              const engOral = grade.english_oral !== undefined && grade.english_oral !== null && grade.english_oral !== '' ? parseFloat(grade.english_oral) : null;
              const engM15 = grade.english_m15 !== undefined && grade.english_m15 !== null && grade.english_m15 !== '' ? parseFloat(grade.english_m15) : null;
              const engMid = grade.english_mid !== undefined && grade.english_mid !== null && grade.english_mid !== '' ? parseFloat(grade.english_mid) : null;
              const engFinal = grade.english_final !== undefined && grade.english_final !== null && grade.english_final !== '' ? parseFloat(grade.english_final) : null;
              let engVal = calculateSubjectGPA(engOral, engM15, engMid, engFinal);
              if (engVal === null && grade.english !== null && grade.english !== undefined && grade.english !== '') {
                engVal = parseFloat(grade.english);
              }

              data.grades = {
                math: mathVal,
                literature: litVal,
                english: engVal
              };
            } else {
              const fetchId = data.code || data.id;
              const gradeResponse = await fetch(`${BACKEND_URL}/api/grades/${fetchId}`);
              if (gradeResponse.ok) {
                const gradeData = await gradeResponse.json();
                data.grades = {
                  math: gradeData.math === "" || gradeData.math === null || gradeData.math === undefined ? null : parseFloat(gradeData.math),
                  literature: gradeData.literature === "" || gradeData.literature === null || gradeData.literature === undefined ? null : parseFloat(gradeData.literature),
                  english: gradeData.english === "" || gradeData.english === null || gradeData.english === undefined ? null : parseFloat(gradeData.english)
                };
              } else {
                data.grades = { math: null, literature: null, english: null };
              }
            }
          }
        } catch (err) {
          console.warn('Could not enrich login proxy:', err);
        }
      }

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && response.status < 400) {
        try {
          const db = readDb();
          const cleanPath = req.path.startsWith('/api') ? req.path.slice(4) : req.path;
          if (cleanPath.startsWith('/students')) {
            const memberId = data?.code || (data?.id !== undefined ? String(data.id) : undefined);
            const normalizedMember = data ? { ...data, id: memberId || data.id, code: memberId || data.code } : null;
            if (req.method === 'POST' && normalizedMember && normalizedMember.id) {
              const idx = db.members.findIndex((m: any) => (m.id || '').toLowerCase() === (normalizedMember.id || '').toLowerCase() || (m.code || '').toLowerCase() === (normalizedMember.id || '').toLowerCase());
              if (idx !== -1) {
                db.members[idx] = { ...db.members[idx], ...normalizedMember };
              } else {
                db.members.push(normalizedMember);
              }
              if (!db.grades.some((g: any) => (g.studentId || '').toLowerCase() === (normalizedMember.id || '').toLowerCase())) {
                db.grades.push({ studentId: normalizedMember.id, math: null, literature: null, english: null });
              }
              writeDb(db);
            } else if (req.method === 'PUT' && normalizedMember && normalizedMember.id) {
              const idx = db.members.findIndex((m: any) => (m.id || '').toLowerCase() === (normalizedMember.id || '').toLowerCase() || (m.code || '').toLowerCase() === (normalizedMember.id || '').toLowerCase());
              if (idx !== -1) {
                db.members[idx] = { ...db.members[idx], ...normalizedMember };
                writeDb(db);
              }
            } else if (req.method === 'DELETE') {
              const targetId = cleanPath.split('/')[2];
              if (targetId) {
                db.members = db.members.filter((m: any) => (m.id || '').toLowerCase() !== targetId.toLowerCase() && (m.code || '').toLowerCase() !== targetId.toLowerCase());
                db.grades = db.grades.filter((g: any) => (g.studentId || '').toLowerCase() !== targetId.toLowerCase());
                writeDb(db);
              }
            }
          } else if (cleanPath.startsWith('/teachers')) {
            const memberId = data?.code || (data?.id !== undefined ? String(data.id) : undefined);
            const normalizedTeacher = data ? { ...data, id: memberId || data.id, code: memberId || data.code } : null;
            if (req.method === 'POST' && normalizedTeacher && normalizedTeacher.id) {
              const idx = db.members.findIndex((m: any) => (m.id || '').toLowerCase() === (normalizedTeacher.id || '').toLowerCase() || (m.code || '').toLowerCase() === (normalizedTeacher.id || '').toLowerCase());
              if (idx !== -1) {
                db.members[idx] = { ...db.members[idx], ...normalizedTeacher };
              } else {
                db.members.push(normalizedTeacher);
              }
              writeDb(db);
            } else if (req.method === 'PUT' && normalizedTeacher && normalizedTeacher.id) {
              const idx = db.members.findIndex((m: any) => (m.id || '').toLowerCase() === (normalizedTeacher.id || '').toLowerCase() || (m.code || '').toLowerCase() === (normalizedTeacher.id || '').toLowerCase());
              if (idx !== -1) {
                db.members[idx] = { ...db.members[idx], ...normalizedTeacher };
                writeDb(db);
              }
            } else if (req.method === 'DELETE') {
              const targetId = cleanPath.split('/')[2];
              if (targetId) {
                db.members = db.members.filter((m: any) => (m.id || '').toLowerCase() !== targetId.toLowerCase() && (m.code || '').toLowerCase() !== targetId.toLowerCase());
                writeDb(db);
              }
            }
          } else if (cleanPath.startsWith('/classes')) {
            if (req.method === 'POST' && data && data.id) {
              const idx = db.classes.findIndex((c: any) => (c.id || '').toLowerCase() === (data.id || '').toLowerCase());
              if (idx === -1) {
                db.classes.push(data);
                writeDb(db);
              }
            } else if (req.method === 'DELETE') {
              const targetId = cleanPath.split('/')[2];
              if (targetId) {
                db.classes = db.classes.filter((c: any) => (c.id || '').toLowerCase() !== targetId.toLowerCase());
                writeDb(db);
              }
            }
          }
        } catch (syncErr) {
          console.warn('Error synchronizing backend mutation to db.json:', syncErr);
        }
      }

      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (error: any) {
    const isConnectionError = 
      error.name === 'AbortError' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND' || 
      error.code === 'EHOSTUNREACH' ||
      error.message?.includes('fetch failed') ||
      error.message?.includes('Redirect detected') ||
      error.message?.includes('Received HTML response');

    if (isConnectionError) {
      updateBackendState('offline');
      console.log(`  \x1b[33m[Fallback]\x1b[0m Không kết nối được Spring Boot backend (${BACKEND_URL}). Chuyển sang xử lý bằng db.json Mock.`);
      return next();
    }
    
    console.error('[Proxy Error]', error);
    console.log(`  \x1b[33m[Fallback]\x1b[0m Lỗi hệ thống trong proxy. Chuyển sang xử lý bằng db.json Mock.`);
    return next();
  }
});

const DB_FILE = path.join(process.cwd(), 'db.json');

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      let changed = false;
      if (Array.isArray(data.members)) {
        for (const m of data.members) {
          if (m && m.password && !isSha1(m.password)) {
            m.password = ensureSha1(m.password);
            changed = true;
          }
        }
      }
      if (changed) {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
          const backendDbFile = path.join(process.cwd(), 'backend-spring', 'src', 'main', 'resources', 'db.json');
          if (fs.existsSync(backendDbFile)) {
            fs.writeFileSync(backendDbFile, JSON.stringify(data, null, 2), 'utf-8');
          }
        } catch (e) {
          console.error('Error auto-hashing DB file:', e);
        }
      }
      return data;
    }
  } catch (error) {
    console.error('Error reading DB file:', error);
  }
  return { classes: [], members: [], grades: [] };
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    const backendDbFile = path.join(process.cwd(), 'backend-spring', 'src', 'main', 'resources', 'db.json');
    if (fs.existsSync(backendDbFile)) {
      fs.writeFileSync(backendDbFile, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error writing DB file:', error);
  }
}

app.post('/api/login', async (req, res) => {
  const lang = getRequestLang(req);
  const dict = SERVER_I18N[lang];
  const { email, password } = req.body || {};

  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanPassword = typeof password === 'string' ? password.trim() : '';

  // 1. Thử xác thực trực tiếp với Spring Boot backend (đang kết nối DBeaver / Database thực)
  if (cleanEmail && cleanPassword) {
    try {
      const springRes = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': lang
        },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });
      if (springRes.ok) {
        const springUser = await springRes.json();
        // Đồng bộ dữ liệu người dùng và mật khẩu từ Database vào db.json
        const db = readDb();
        const sEmail = (springUser.email || '').trim().toLowerCase();
        const sId = (springUser.code || springUser.id || '').trim().toLowerCase();
        const memberIdx = db.members.findIndex((m: any) => {
          const mEmail = (m.email || '').trim().toLowerCase();
          const mId = (m.id || '').trim().toLowerCase();
          const mCode = (m.code || '').trim().toLowerCase();
          return (sEmail && mEmail === sEmail) || (sId && (mId === sId || mCode === sId));
        });
        if (memberIdx !== -1) {
          db.members[memberIdx].password = ensureSha1(cleanPassword);
          db.members[memberIdx].mustChangePassword = springUser.mustChangePassword ?? false;
          if (springUser.name) db.members[memberIdx].name = springUser.name;
          writeDb(db);
          console.log(`[Login Sync] Đã đồng bộ tài khoản ${springUser.email} từ Database vào db.json.`);
        }
        return res.json(springUser);
      }
    } catch (_) {
      // Spring Boot backend offline, fallback xử lý bằng db.json
    }
  }

  const isEmailEmpty = !cleanEmail;
  const isPasswordEmpty = !cleanPassword;

  const db = readDb();
  const cleanInput = cleanEmail.toLowerCase();
  const cleanPrefix = cleanInput.split('@')[0];

  const userByEmail = cleanEmail
    ? db.members.find((m: any) => {
        const mEmail = (m.email || '').trim().toLowerCase();
        const mId = (m.id || '').trim().toLowerCase();
        const mCode = (m.code || '').trim().toLowerCase();
        const mPrefix = mEmail.split('@')[0];

        // 1. Direct equality with email, ID, code, or email prefix
        if (mEmail === cleanInput || mId === cleanInput || mCode === cleanInput || mPrefix === cleanPrefix) {
          return true;
        }

        // 2. Suffix match: user entered email ending with .<id> or _<id> (e.g., nguyen.phuong.nga.hs182@...)
        if (mId && (cleanPrefix === mId || cleanPrefix.endsWith('.' + mId) || cleanPrefix.endsWith('_' + mId) || cleanPrefix.endsWith('-' + mId))) {
          return true;
        }
        if (mCode && (cleanPrefix === mCode || cleanPrefix.endsWith('.' + mCode) || cleanPrefix.endsWith('_' + mCode) || cleanPrefix.endsWith('-' + mCode))) {
          return true;
        }

        return false;
      })
    : null;

  // Nếu đã tìm thấy tài khoản theo Mã ID hoặc Email thì định dạng hợp lệ
  const isEmailFormatInvalid = !isEmailEmpty && !userByEmail && !/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(cleanEmail);

  const errors: Record<string, string> = {};

  // Case 1: Both empty
  if (isEmailEmpty && isPasswordEmpty) {
    errors['email'] = dict.emailRequired;
    errors['password'] = dict.passwordRequired;
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: dict.bothRequired,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Case 2: Email is empty, password provided
  if (isEmailEmpty && !isPasswordEmpty) {
    errors['email'] = dict.emailRequired;
    errors['password'] = dict.incorrectPassword;
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: `${dict.emailRequired}; ${dict.incorrectPassword}`,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Case 3: Email format invalid (chỉ khi không tìm thấy tài khoản theo ID/Email)
  if (isEmailFormatInvalid) {
    errors['email'] = dict.emailInvalidFormat;
    errors['password'] = isPasswordEmpty ? dict.passwordRequired : dict.incorrectPassword;
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: `${errors['email']}; ${errors['password']}`,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Case 4: Password is empty, but email is provided
  if (isPasswordEmpty) {
    if (!userByEmail) {
      errors['email'] = dict.emailNotFound;
    }
    errors['password'] = dict.passwordRequired;
    return res.status(400).json({
      status: 400,
      error: 'Bad Request',
      message: Object.values(errors).join('; '),
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Case 5 & 6: Chống rò rỉ và dò quét tài khoản khi đăng nhập (Bảo mật xác thực)
  // Chỉ cho phép đăng nhập bằng mật khẩu chính xác đã cấp / đã đổi (kiểm tra hash SHA-1 hoặc so khớp)
  const cleanPass = cleanPassword;
  const isPasswordValid = Boolean(
    userByEmail && verifyPassword(cleanPass, String(userByEmail.password))
  );

  if (!userByEmail || !isPasswordValid) {
    errors['email'] = dict.unauthorizedMsg;
    errors['password'] = dict.unauthorizedMsg;
    return res.status(401).json({
      status: 401,
      error: 'Unauthorized',
      message: dict.unauthorizedMsg,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  const userCopy = { ...userByEmail };
  const role = userCopy.role as 'admin' | 'teacher' | 'student';
  const rolePerms = (db.rolePermissions && db.rolePermissions[role])
    ? db.rolePermissions[role]
    : (DEFAULT_ROLE_PERMISSIONS[role] || {});
  userCopy.permissions = { ...rolePerms };
  if (userCopy.role === 'student') {
    if (!userCopy.className || userCopy.className.trim() === '' || userCopy.className === 'Chưa xếp lớp') {
      userCopy.className = '';
      userCopy.grades = { math: null, literature: null, english: null };
    } else {
      const rawId = String(userCopy.id || '').trim().toLowerCase();
      const rawCode = String(userCopy.code || '').trim().toLowerCase();
      const rawEmail = String(userCopy.email || '').trim().toLowerCase();
      const matchingMember = db.members.find((m: any) => {
        const mid = String(m.id || '').trim().toLowerCase();
        const mcode = String(m.code || '').trim().toLowerCase();
        const memail = String(m.email || '').trim().toLowerCase();
        return (rawId && (mid === rawId || mcode === rawId)) ||
               (rawCode && (mid === rawCode || mcode === rawCode)) ||
               (rawEmail && memail === rawEmail);
      });

      const idToMatch = matchingMember ? String(matchingMember.id || '').trim().toLowerCase() : '';
      const codeToMatch = matchingMember ? String(matchingMember.code || '').trim().toLowerCase() : '';

      const grade = db.grades.find((g: any) => {
        const gid = String(g.studentId || '').trim().toLowerCase();
        const gcode = String(g.studentCode || '').trim().toLowerCase();
        return (rawId && (gid === rawId || gcode === rawId)) ||
               (rawCode && (gid === rawCode || gcode === rawCode)) ||
               (idToMatch && (gid === idToMatch || gcode === idToMatch)) ||
               (codeToMatch && (gid === codeToMatch || gcode === codeToMatch));
      });

      if (grade) {
        const mathOral = grade.math_oral !== undefined && grade.math_oral !== null && grade.math_oral !== '' ? parseFloat(grade.math_oral) : null;
        const mathM15 = grade.math_m15 !== undefined && grade.math_m15 !== null && grade.math_m15 !== '' ? parseFloat(grade.math_m15) : null;
        const mathMid = grade.math_mid !== undefined && grade.math_mid !== null && grade.math_mid !== '' ? parseFloat(grade.math_mid) : null;
        const mathFinal = grade.math_final !== undefined && grade.math_final !== null && grade.math_final !== '' ? parseFloat(grade.math_final) : null;
        let mathVal = calculateSubjectGPA(mathOral, mathM15, mathMid, mathFinal);
        if (mathVal === null && grade.math !== null && grade.math !== undefined && grade.math !== '') {
          mathVal = parseFloat(grade.math);
        }

        const litOral = grade.literature_oral !== undefined && grade.literature_oral !== null && grade.literature_oral !== '' ? parseFloat(grade.literature_oral) : null;
        const litM15 = grade.literature_m15 !== undefined && grade.literature_m15 !== null && grade.literature_m15 !== '' ? parseFloat(grade.literature_m15) : null;
        const litMid = grade.literature_mid !== undefined && grade.literature_mid !== null && grade.literature_mid !== '' ? parseFloat(grade.literature_mid) : null;
        const litFinal = grade.literature_final !== undefined && grade.literature_final !== null && grade.literature_final !== '' ? parseFloat(grade.literature_final) : null;
        let litVal = calculateSubjectGPA(litOral, litM15, litMid, litFinal);
        if (litVal === null && grade.literature !== null && grade.literature !== undefined && grade.literature !== '') {
          litVal = parseFloat(grade.literature);
        }

        const engOral = grade.english_oral !== undefined && grade.english_oral !== null && grade.english_oral !== '' ? parseFloat(grade.english_oral) : null;
        const engM15 = grade.english_m15 !== undefined && grade.english_m15 !== null && grade.english_m15 !== '' ? parseFloat(grade.english_m15) : null;
        const engMid = grade.english_mid !== undefined && grade.english_mid !== null && grade.english_mid !== '' ? parseFloat(grade.english_mid) : null;
        const engFinal = grade.english_final !== undefined && grade.english_final !== null && grade.english_final !== '' ? parseFloat(grade.english_final) : null;
        let engVal = calculateSubjectGPA(engOral, engM15, engMid, engFinal);
        if (engVal === null && grade.english !== null && grade.english !== undefined && grade.english !== '') {
          engVal = parseFloat(grade.english);
        }

        userCopy.grades = {
          math: mathVal,
          literature: litVal,
          english: engVal
        };
      } else {
        userCopy.grades = { math: null, literature: null, english: null };
      }
    }
  }
  return res.json(userCopy);
});

app.post('/api/change-password', async (req, res) => {
  try {
    const lang = getRequestLang(req);
    const dict = SERVER_I18N[lang];
    const { email, oldPassword, newPassword, confirmPassword } = req.body || {};
    const errors: Record<string, string> = {};

    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanOldPassword = typeof oldPassword === 'string' ? oldPassword : '';
    const cleanNewPassword = typeof newPassword === 'string' ? newPassword.trim() : '';
    const cleanConfirmPassword = typeof confirmPassword === 'string' ? confirmPassword.trim() : '';

    if (!cleanEmail) {
      errors['email'] = dict.emailRequired;
    }
    if (!cleanOldPassword) {
      errors['oldPassword'] = dict.currentPasswordRequired;
    }
    if (!cleanNewPassword) {
      errors['newPassword'] = dict.newPasswordRequired;
    } else if (cleanNewPassword.length < 3) {
      errors['newPassword'] = dict.newPasswordMinLength;
    }
    if (!cleanConfirmPassword) {
      errors['confirmPassword'] = dict.confirmPasswordRequired;
    } else if (cleanNewPassword && cleanConfirmPassword && cleanNewPassword !== cleanConfirmPassword) {
      errors['confirmPassword'] = dict.passwordMismatch;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: Object.values(errors).join('; '),
        errors
      });
    }

    // Kiểm soát quyền sở hữu khi đổi mật khẩu (Chống can thiệp chéo)
    const currentUserEmail = (req.headers['x-current-user-email'] as string || req.body?.currentUserEmail || '').trim();
    if (currentUserEmail && cleanEmail && currentUserEmail.toLowerCase() !== cleanEmail.toLowerCase()) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: dict.forbiddenAccountChange,
        errors: {
          email: dict.forbiddenAccountChange
        }
      });
    }

    const db = readDb();
    const cleanEmailLower = cleanEmail.toLowerCase();
    const cleanPrefix = cleanEmailLower.split('@')[0];
    const memberIndex = db.members.findIndex(
      (m: any) => {
        const mEmail = (m.email || '').trim().toLowerCase();
        const mId = (m.id || '').trim().toLowerCase();
        const mPrefix = mEmail.split('@')[0];
        return mEmail === cleanEmailLower || mId === cleanEmailLower || mPrefix === cleanPrefix;
      }
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        status: 404,
        error: 'Not Found',
        message: dict.accountNotFound,
        errors: {
          email: dict.accountNotFound
        }
      });
    }

    const member = db.members[memberIndex];
    const isOldPasswordMatch = verifyPassword(cleanOldPassword, String(member.password));
    // If the old password matches, OR if the account was flagged mustChangePassword (e.g. reset by admin or initial login),
    // allow setting the new password so the user is never stuck
    if (!isOldPasswordMatch && !member.mustChangePassword) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: dict.oldPasswordIncorrect,
        errors: {
          oldPassword: dict.oldPasswordIncorrect
        }
      });
    }

    if (verifyPassword(cleanNewPassword, String(member.password)) || (cleanOldPassword && cleanNewPassword === cleanOldPassword)) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
        errors: {
          newPassword: 'Mật khẩu mới phải khác mật khẩu hiện tại.'
        }
      });
    }

    db.members[memberIndex].password = ensureSha1(cleanNewPassword);
    db.members[memberIndex].mustChangePassword = false;
    writeDb(db);
    console.log(`[Change Password] Đã đổi mật khẩu thành công cho ${member.id} (${member.email}). Mật khẩu mới đã lưu vào db.json.`);

    // Sync to Spring Boot backend if reachable
    try {
      const backendHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (currentUserEmail) {
        backendHeaders['X-Current-User-Email'] = currentUserEmail;
      }
      fetch(`${BACKEND_URL}/api/change-password`, {
        method: 'POST',
        headers: backendHeaders,
        body: JSON.stringify({ email: cleanEmail, oldPassword: cleanOldPassword, newPassword: cleanNewPassword, confirmPassword: cleanConfirmPassword }),
        signal: AbortSignal.timeout(1000)
      }).catch(() => {});
    } catch (_) {}

    return res.status(200).json({ message: dict.changePasswordSuccess, success: true });
  } catch (err: any) {
    console.error('Lỗi khi đổi mật khẩu:', err);
    const lang = getRequestLang(req);
    const dict = SERVER_I18N[lang];
    return res.status(500).json({ message: dict.systemError });
  }
});

// Endpoint Reset mật khẩu do Admin thực hiện
app.post(['/api/admin/users/:id/reset-password', '/api/members/:id/reset-password'], async (req, res) => {
  try {
    const rawTargetId = req.params.id ? decodeURIComponent(req.params.id).trim().toLowerCase() : '';
    const bodyEmail = (req.body?.email || '').trim().toLowerCase();
    const bodyId = (req.body?.id || req.body?.code || '').trim().toLowerCase();

    const db = readDb();
    const memberIndex = db.members.findIndex((m: any) => {
      const mId = (m.id || '').trim().toLowerCase();
      const mCode = (m.code || '').trim().toLowerCase();
      const mEmail = (m.email || '').trim().toLowerCase();
      return (rawTargetId && (mId === rawTargetId || mCode === rawTargetId || mEmail === rawTargetId)) ||
             (bodyEmail && mEmail === bodyEmail) ||
             (bodyId && (mId === bodyId || mCode === bodyId));
    });

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản tương ứng!' });
    }

    // 1. Thử gọi sang Spring Boot backend để cập nhật vào Database (DBeaver)
    let springPassword = '';
    try {
      const springRes = await fetch(`${BACKEND_URL}/api/admin/users/${encodeURIComponent(req.params.id)}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Current-User-Role': 'admin'
        }
      });
      if (springRes.ok) {
        const springData = await springRes.json();
        springPassword = springData.newPassword || '';
      }
    } catch (_) {}

    // 2. Sử dụng mật khẩu từ Spring Boot (nếu có) hoặc sinh ngẫu nhiên 10 ký tự bằng SecureRandom
    const newPassword = springPassword || generateSecureRandomPassword(10);

    db.members[memberIndex].password = ensureSha1(newPassword);
    db.members[memberIndex].mustChangePassword = true;
    writeDb(db);

    console.log(`[Reset Password - SecureRandom] Đã reset mật khẩu tài khoản ${db.members[memberIndex].id} (${db.members[memberIndex].email}) thành: ${newPassword}`);

    return res.json({
      userId: db.members[memberIndex].id,
      code: db.members[memberIndex].code || db.members[memberIndex].id,
      email: db.members[memberIndex].email,
      name: db.members[memberIndex].name,
      newPassword,
      mustChangePassword: true,
      message: 'Reset mật khẩu thành công. Mật khẩu mới gồm 10 ký tự bảo mật cao.'
    });
  } catch (err: any) {
    console.error('Lỗi khi reset mật khẩu:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi reset mật khẩu.' });
  }
});

// Endpoint Đổi mật khẩu bắt buộc lần đầu (Force Change Password)
app.post(['/api/auth/force-change-password', '/api/force-change-password'], async (req, res) => {
  try {
    const { email, userId, newPassword, confirmPassword, oldPassword } = req.body || {};
    const cleanNew = typeof newPassword === 'string' ? newPassword.trim() : '';
    const cleanConfirm = typeof confirmPassword === 'string' ? confirmPassword.trim() : '';
    const cleanOld = typeof oldPassword === 'string' ? oldPassword.trim() : '';

    if (!cleanNew || cleanNew.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }
    if (cleanConfirm && cleanNew !== cleanConfirm) {
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp.' });
    }

    const db = readDb();
    const targetEmail = (email || '').trim().toLowerCase();
    const targetId = (userId || '').trim().toLowerCase();

    const memberIndex = db.members.findIndex((m: any) => {
      const mId = (m.id || '').trim().toLowerCase();
      const mCode = (m.code || '').trim().toLowerCase();
      const mEmail = (m.email || '').trim().toLowerCase();
      return (targetEmail && mEmail === targetEmail) || (targetId && (mId === targetId || mCode === targetId));
    });

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản cần đổi mật khẩu!' });
    }

    if (verifyPassword(cleanNew, String(db.members[memberIndex].password)) || (cleanOld && cleanNew === cleanOld)) {
      return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
    }

    db.members[memberIndex].password = ensureSha1(cleanNew);
    db.members[memberIndex].mustChangePassword = false;
    writeDb(db);

    // Đồng bộ sang Spring Boot backend nếu có
    try {
      await fetch(`${BACKEND_URL}/api/auth/force-change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Current-User-Email': targetEmail
        },
        body: JSON.stringify({ email: targetEmail, userId: targetId, newPassword: cleanNew, confirmPassword: cleanConfirm, oldPassword: cleanOld })
      });
    } catch (_) {}

    console.log(`[Force Change Password] Cập nhật thành công cho ${db.members[memberIndex].id}`);
    const userCopy = { ...db.members[memberIndex] };
    return res.json(userCopy);
  } catch (err: any) {
    console.error('Lỗi khi force-change-password:', err);
    return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật mật khẩu.' });
  }
});

app.get('/api/members', (req, res) => {
  const { page, size, role, search, classes, currentUserId } = req.query;
  const db = readDb();
  let list = db.members;

  if (role) {
    list = list.filter((m: any) => m.role === role);
  }
  
  if (classes) {
    const allowedClasses = (classes as string).split(',');
    list = list.filter((m: any) => {
      if (m.role === 'teacher') {
        return currentUserId && m.id === currentUserId;
      }
      return m.className && allowedClasses.includes(m.className);
    });
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter((m: any) => 
      (m.id || '').toLowerCase().includes(q) ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.className || '').toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q) ||
      (Array.isArray(m.assignedClasses) && m.assignedClasses.some((c: string) => c && c.toLowerCase().includes(q)))
    );
  }

  const p = Math.max(1, parseInt(page as string) || 1);
  const s = Math.min(100, Math.max(1, parseInt(size as string) || 10));
  const totalElements = list.length;
  const totalPages = Math.ceil(totalElements / s) || 1;
  const content = list.slice((p - 1) * s, p * s);
  res.json({
    content,
    totalElements,
    totalPages,
    page: p,
    size: s
  });
});

app.get('/api/teachers', (req, res) => {
  const { page, size, search } = req.query;
  const db = readDb();
  let list = db.members.filter((m: any) => m.role === 'teacher');

  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter((m: any) => 
      (m.id || '').toLowerCase().includes(q) ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q) ||
      (Array.isArray(m.assignedClasses) && m.assignedClasses.some((c: string) => c && c.toLowerCase().includes(q)))
    );
  }

  const p = Math.max(1, parseInt(page as string) || 1);
  const s = Math.min(100, Math.max(1, parseInt(size as string) || 10));
  const totalElements = list.length;
  const totalPages = Math.ceil(totalElements / s) || 1;
  const content = list.slice((p - 1) * s, p * s);
  res.json({
    content,
    totalElements,
    totalPages,
    page: p,
    size: s
  });
});

app.get('/api/students', (req, res) => {
  const { page, size, search } = req.query;
  const db = readDb();
  let list = db.members.filter((m: any) => m.role === 'student');

  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter((m: any) => 
      (m.id || '').toLowerCase().includes(q) ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.className || '').toLowerCase().includes(q)
    );
  }

  const p = Math.max(1, parseInt(page as string) || 1);
  const s = Math.min(100, Math.max(1, parseInt(size as string) || 10));
  const totalElements = list.length;
  const totalPages = Math.ceil(totalElements / s) || 1;
  const content = list.slice((p - 1) * s, p * s);
  res.json({
    content,
    totalElements,
    totalPages,
    page: p,
    size: s
  });
});

app.get('/api/next-id', (req, res) => {
  const role = (req.query.role as string) || 'student';
  const db = readDb();
  if (role === 'teacher') {
    const teachers = db.members.filter((m: any) => m.role === 'teacher');
    const nums = teachers.map((m: any) => {
      const num = parseInt((m.id || '').replace(/\D/g, ''), 10);
      return isNaN(num) ? 0 : num;
    });
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    const nextId = `GV${String(maxNum + 1).padStart(2, '0')}`;
    return res.json({ nextId });
  } else {
    const students = db.members.filter((m: any) => m.role === 'student');
    const nums = students.map((m: any) => {
      const num = parseInt((m.id || '').replace(/\D/g, ''), 10);
      return isNaN(num) ? 0 : num;
    });
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    const nextId = `HS${String(maxNum + 1).padStart(3, '0')}`;
    return res.json({ nextId });
  }
});

app.get('/api/classes', (req, res) => {
  const db = readDb();
  res.json(db.classes);
});

app.get('/api/classes/:classId/members', (req, res) => {
  const { classId } = req.params;
  const db = readDb();
  const classMembers = db.members.filter((m: any) => 
    (m.role === 'student' && m.className === classId) ||
    (m.role === 'teacher' && m.assignedClasses?.includes(classId))
  );
  res.json(classMembers);
});

function calculateSubjectGPA(oral: any, m15: any, mid: any, final: any) {
  let sum = 0;
  let totalWeight = 0;
  
  if (oral !== null && oral !== undefined && oral !== '') {
    sum += parseFloat(oral) * 1;
    totalWeight += 1;
  }
  if (m15 !== null && m15 !== undefined && m15 !== '') {
    sum += parseFloat(m15) * 1;
    totalWeight += 1;
  }
  if (mid !== null && mid !== undefined && mid !== '') {
    sum += parseFloat(mid) * 2;
    totalWeight += 2;
  }
  if (final !== null && final !== undefined && final !== '') {
    sum += parseFloat(final) * 3;
    totalWeight += 3;
  }
  
  if (totalWeight > 0) {
    return Math.round((sum / totalWeight) * 100) / 100;
  }
  return null;
}

app.get('/api/grades/:studentId', (req, res) => {
  const { studentId } = req.params;
  const { currentUserId } = req.query;
  const db = readDb();
  
  let subject: string | null = null;
  if (currentUserId) {
    const user = db.members.find((m: any) => m.id === currentUserId || m.code === currentUserId);
    if (user && user.role === 'teacher') {
      subject = user.subject || null;
    }
  }

  const rawId = (studentId || '').trim().toLowerCase();
  const matchingMember = db.members.find((m: any) => {
    const mid = String(m.id || '').trim().toLowerCase();
    const mcode = String(m.code || '').trim().toLowerCase();
    const memail = String(m.email || '').trim().toLowerCase();
    return (rawId && (mid === rawId || mcode === rawId)) ||
           (rawId && memail === rawId);
  });

  const idToMatch = matchingMember ? String(matchingMember.id || '').trim().toLowerCase() : '';
  const codeToMatch = matchingMember ? String(matchingMember.code || '').trim().toLowerCase() : '';

  const grade = db.grades.find((g: any) => {
    const gid = String(g.studentId || '').trim().toLowerCase();
    const gcode = String(g.studentCode || '').trim().toLowerCase();
    return (rawId && (gid === rawId || gcode === rawId)) ||
           (idToMatch && (gid === idToMatch || gcode === idToMatch)) ||
           (codeToMatch && (gid === codeToMatch || gcode === codeToMatch));
  });

  let mathVal: number | null = null;
  let litVal: number | null = null;
  let engVal: number | null = null;

  if (grade) {
    const mathOral = grade.math_oral !== undefined && grade.math_oral !== null && grade.math_oral !== '' ? parseFloat(grade.math_oral) : null;
    const mathM15 = grade.math_m15 !== undefined && grade.math_m15 !== null && grade.math_m15 !== '' ? parseFloat(grade.math_m15) : null;
    const mathMid = grade.math_mid !== undefined && grade.math_mid !== null && grade.math_mid !== '' ? parseFloat(grade.math_mid) : null;
    const mathFinal = grade.math_final !== undefined && grade.math_final !== null && grade.math_final !== '' ? parseFloat(grade.math_final) : null;
    mathVal = calculateSubjectGPA(mathOral, mathM15, mathMid, mathFinal);
    if (mathVal === null && grade.math !== null && grade.math !== undefined && grade.math !== '') {
      mathVal = parseFloat(grade.math);
    }

    const litOral = grade.literature_oral !== undefined && grade.literature_oral !== null && grade.literature_oral !== '' ? parseFloat(grade.literature_oral) : null;
    const litM15 = grade.literature_m15 !== undefined && grade.literature_m15 !== null && grade.literature_m15 !== '' ? parseFloat(grade.literature_m15) : null;
    const litMid = grade.literature_mid !== undefined && grade.literature_mid !== null && grade.literature_mid !== '' ? parseFloat(grade.literature_mid) : null;
    const litFinal = grade.literature_final !== undefined && grade.literature_final !== null && grade.literature_final !== '' ? parseFloat(grade.literature_final) : null;
    litVal = calculateSubjectGPA(litOral, litM15, litMid, litFinal);
    if (litVal === null && grade.literature !== null && grade.literature !== undefined && grade.literature !== '') {
      litVal = parseFloat(grade.literature);
    }

    const engOral = grade.english_oral !== undefined && grade.english_oral !== null && grade.english_oral !== '' ? parseFloat(grade.english_oral) : null;
    const engM15 = grade.english_m15 !== undefined && grade.english_m15 !== null && grade.english_m15 !== '' ? parseFloat(grade.english_m15) : null;
    const engMid = grade.english_mid !== undefined && grade.english_mid !== null && grade.english_mid !== '' ? parseFloat(grade.english_mid) : null;
    const engFinal = grade.english_final !== undefined && grade.english_final !== null && grade.english_final !== '' ? parseFloat(grade.english_final) : null;
    engVal = calculateSubjectGPA(engOral, engM15, engMid, engFinal);
    if (engVal === null && grade.english !== null && grade.english !== undefined && grade.english !== '') {
      engVal = parseFloat(grade.english);
    }
  }

  const validScores = [mathVal, litVal, engVal].filter(v => v !== null) as number[];
  const gpa = validScores.length > 0 ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100 : null;

  const displayStudentId = (matchingMember && matchingMember.code) ? matchingMember.code : (grade?.studentCode || grade?.studentId || studentId);

  let result: any = {
    studentId: displayStudentId,
    studentCode: (matchingMember && matchingMember.code) || grade?.studentCode || displayStudentId,
    math: mathVal,
    literature: litVal,
    english: engVal,
    gpa,
    math_oral: grade?.math_oral ?? null,
    math_m15: grade?.math_m15 ?? null,
    math_mid: grade?.math_mid ?? null,
    math_final: grade?.math_final ?? null,
    literature_oral: grade?.literature_oral ?? null,
    literature_m15: grade?.literature_m15 ?? null,
    literature_mid: grade?.literature_mid ?? null,
    literature_final: grade?.literature_final ?? null,
    english_oral: grade?.english_oral ?? null,
    english_m15: grade?.english_m15 ?? null,
    english_mid: grade?.english_mid ?? null,
    english_final: grade?.english_final ?? null,
    updatedBy: grade?.updatedBy
  };

  if (subject) {
    const isMath = subject.toLowerCase() === 'math';
    const isLit = subject.toLowerCase() === 'literature';
    const isEng = subject.toLowerCase() === 'english';

    result = {
      studentId: displayStudentId,
      studentCode: result.studentCode,
      math: isMath ? mathVal : null,
      literature: isLit ? litVal : null,
      english: isEng ? engVal : null,
      gpa: isMath ? mathVal : (isLit ? litVal : (isEng ? engVal : null)),
      math_oral: isMath ? (grade?.math_oral ?? null) : null,
      math_m15: isMath ? (grade?.math_m15 ?? null) : null,
      math_mid: isMath ? (grade?.math_mid ?? null) : null,
      math_final: isMath ? (grade?.math_final ?? null) : null,
      literature_oral: isLit ? (grade?.literature_oral ?? null) : null,
      literature_m15: isLit ? (grade?.literature_m15 ?? null) : null,
      literature_mid: isLit ? (grade?.literature_mid ?? null) : null,
      literature_final: isLit ? (grade?.literature_final ?? null) : null,
      english_oral: isEng ? (grade?.english_oral ?? null) : null,
      english_m15: isEng ? (grade?.english_m15 ?? null) : null,
      english_mid: isEng ? (grade?.english_mid ?? null) : null,
      english_final: isEng ? (grade?.english_final ?? null) : null,
      updatedBy: grade?.updatedBy
    };
  }

  res.json(result);
});

function parseGradeSearchQuery(searchStr: string, teacherSubject: string | null) {
  const clean = searchStr.trim().replace(',', '.');
  let text = clean.toLowerCase();

  let targetSubject: string | null = null;

  if (/(english oral)/i.test(text)) {
    targetSubject = 'english_oral';
    text = text.replace(/(english oral)/gi, '');
  } else if (/(english m15|english 15p)/i.test(text)) {
    targetSubject = 'english_m15';
    text = text.replace(/(english m15|english 15p)/gi, '');
  } else if (/(english mid)/i.test(text)) {
    targetSubject = 'english_mid';
    text = text.replace(/(english mid)/gi, '');
  } else if (/(english final)/i.test(text)) {
    targetSubject = 'english_final';
    text = text.replace(/(english final)/gi, '');
  } else if (/(english|\banh\b)/i.test(text)) {
    targetSubject = 'english';
    text = text.replace(/(english|\banh\b)/gi, '');
  } else if (/(literature oral)/i.test(text)) {
    targetSubject = 'literature_oral';
    text = text.replace(/(literature oral)/gi, '');
  } else if (/(literature m15|literature 15p)/i.test(text)) {
    targetSubject = 'literature_m15';
    text = text.replace(/(literature m15|literature 15p)/gi, '');
  } else if (/(literature mid)/i.test(text)) {
    targetSubject = 'literature_mid';
    text = text.replace(/(literature mid)/gi, '');
  } else if (/(literature final)/i.test(text)) {
    targetSubject = 'literature_final';
    text = text.replace(/(literature final)/gi, '');
  } else if (/(literature|\blit\b)/i.test(text)) {
    targetSubject = 'literature';
    text = text.replace(/(literature|\blit\b)/gi, '');
  } else if (/(math oral)/i.test(text)) {
    targetSubject = 'math_oral';
    text = text.replace(/(math oral)/gi, '');
  } else if (/(math m15|math 15p)/i.test(text)) {
    targetSubject = 'math_m15';
    text = text.replace(/(math m15|math 15p)/gi, '');
  } else if (/(math mid)/i.test(text)) {
    targetSubject = 'math_mid';
    text = text.replace(/(math mid)/gi, '');
  } else if (/(math final)/i.test(text)) {
    targetSubject = 'math_final';
    text = text.replace(/(math final)/gi, '');
  } else if (/(math)/i.test(text)) {
    targetSubject = 'math';
    text = text.replace(/(math)/gi, '');
  } else if (/(gpa)/i.test(text)) {
    targetSubject = 'gpa';
    text = text.replace(/(gpa)/gi, '');
  }

  if (!targetSubject && teacherSubject) {
    if (['math', 'literature', 'english'].includes(teacherSubject)) {
      targetSubject = teacherSubject as any;
    }
  }

  text = text.replace(/[:=]/g, ' ').trim();

  const compMatch = text.match(/^([<>]=?|=)\s*([0-9]+(?:\.[0-9]+)?)$/);
  if (compMatch) {
    return {
      type: 'comparison' as const,
      opSign: compMatch[1],
      compVal: parseFloat(compMatch[2]),
      targetSubject,
      textPart: text.replace(compMatch[0], '').trim().toLowerCase(),
      rawClean: clean.toLowerCase()
    };
  }

  const standaloneNumMatch = text.match(/\b([0-9]+(?:\.[0-9]+)?)\b/);

  if (standaloneNumMatch) {
    const numStr = standaloneNumMatch[1];
    const numVal = parseFloat(numStr);
    const isInteger = !numStr.includes('.');
    const textPart = text.replace(numStr, '').trim().toLowerCase();

    return {
      type: 'numeric' as const,
      numVal,
      isInteger,
      textPart,
      targetSubject,
      rawClean: clean.toLowerCase()
    };
  }

  return {
    type: 'text' as const,
    textPart: text.trim().toLowerCase(),
    rawClean: clean.toLowerCase(),
    targetSubject
  };
}

app.get('/api/grades', (req, res) => {
  const { page, size, search, classes, currentUserId, scoreSubject, scoreOp, scoreVal } = req.query;
  const db = readDb();
  
  let subject: string | null = null;
  if (currentUserId) {
    const user = db.members.find((m: any) => m.id === currentUserId);
    if (user && user.role === 'teacher') {
      subject = user.subject || null;
    }
  }

  const students = db.members.filter((m: any) => m.role === 'student');
  let records = students.map((s: any) => {
    const g = db.grades.find((g: any) => g.studentId === s.id) || { math: null, literature: null, english: null };
    
    const mathOral = g.math_oral !== undefined && g.math_oral !== null && g.math_oral !== '' ? parseFloat(g.math_oral) : null;
    const mathM15 = g.math_m15 !== undefined && g.math_m15 !== null && g.math_m15 !== '' ? parseFloat(g.math_m15) : null;
    const mathMid = g.math_mid !== undefined && g.math_mid !== null && g.math_mid !== '' ? parseFloat(g.math_mid) : null;
    const mathFinal = g.math_final !== undefined && g.math_final !== null && g.math_final !== '' ? parseFloat(g.math_final) : null;
    let mathVal = calculateSubjectGPA(mathOral, mathM15, mathMid, mathFinal);
    if (mathVal === null && g.math !== null && g.math !== undefined && g.math !== '') {
      mathVal = parseFloat(g.math);
    }

    const litOral = g.literature_oral !== undefined && g.literature_oral !== null && g.literature_oral !== '' ? parseFloat(g.literature_oral) : null;
    const litM15 = g.literature_m15 !== undefined && g.literature_m15 !== null && g.literature_m15 !== '' ? parseFloat(g.literature_m15) : null;
    const litMid = g.literature_mid !== undefined && g.literature_mid !== null && g.literature_mid !== '' ? parseFloat(g.literature_mid) : null;
    const litFinal = g.literature_final !== undefined && g.literature_final !== null && g.literature_final !== '' ? parseFloat(g.literature_final) : null;
    let litVal = calculateSubjectGPA(litOral, litM15, litMid, litFinal);
    if (litVal === null && g.literature !== null && g.literature !== undefined && g.literature !== '') {
      litVal = parseFloat(g.literature);
    }

    const engOral = g.english_oral !== undefined && g.english_oral !== null && g.english_oral !== '' ? parseFloat(g.english_oral) : null;
    const engM15 = g.english_m15 !== undefined && g.english_m15 !== null && g.english_m15 !== '' ? parseFloat(g.english_m15) : null;
    const engMid = g.english_mid !== undefined && g.english_mid !== null && g.english_mid !== '' ? parseFloat(g.english_mid) : null;
    const engFinal = g.english_final !== undefined && g.english_final !== null && g.english_final !== '' ? parseFloat(g.english_final) : null;
    let engVal = calculateSubjectGPA(engOral, engM15, engMid, engFinal);
    if (engVal === null && g.english !== null && g.english !== undefined && g.english !== '') {
      engVal = parseFloat(g.english);
    }
    
    let gpa: number | null = null;
    let count = 0;
    let sum = 0;
    if (mathVal !== null) { sum += mathVal; count++; }
    if (litVal !== null) { sum += litVal; count++; }
    if (engVal !== null) { sum += engVal; count++; }
    if (count > 0) {
      gpa = Math.round((sum / count) * 100) / 100;
    }

    if (subject) {
      const isMath = subject.toLowerCase() === 'math';
      const isLit = subject.toLowerCase() === 'literature';
      const isEng = subject.toLowerCase() === 'english';

      return {
        className: s.className || 'Chưa xếp lớp',
        studentId: s.id,
        studentName: s.name,
        email: s.email,
        math: isMath ? mathVal : null,
        literature: isLit ? litVal : null,
        english: isEng ? engVal : null,
        gpa: isMath ? mathVal : (isLit ? litVal : (isEng ? engVal : null)),
        math_oral: isMath ? mathOral : null,
        math_m15: isMath ? mathM15 : null,
        math_mid: isMath ? mathMid : null,
        math_final: isMath ? mathFinal : null,
        literature_oral: isLit ? litOral : null,
        literature_m15: isLit ? litM15 : null,
        literature_mid: isLit ? litMid : null,
        literature_final: isLit ? litFinal : null,
        english_oral: isEng ? engOral : null,
        english_m15: isEng ? engM15 : null,
        english_mid: isEng ? engMid : null,
        english_final: isEng ? engFinal : null
      };
    }

    return {
      className: s.className || 'Chưa xếp lớp',
      studentId: s.id,
      studentName: s.name,
      email: s.email,
      math: mathVal,
      literature: litVal,
      english: engVal,
      gpa,
      math_oral: mathOral,
      math_m15: mathM15,
      math_mid: mathMid,
      math_final: mathFinal,
      literature_oral: litOral,
      literature_m15: litM15,
      literature_mid: litMid,
      literature_final: litFinal,
      english_oral: engOral,
      english_m15: engM15,
      english_mid: engMid,
      english_final: engFinal
    };
  });

  if (classes) {
    const allowedClasses = (classes as string).split(',');
    records = records.filter((r: any) => r.className && allowedClasses.includes(r.className));
  }

  if (search) {
    const searchInfo = parseGradeSearchQuery(search as string, subject);

    records = records.filter((r: any) => {
      const rawLower = searchInfo.rawClean;
      const textMatchRaw =
        (r.studentId || '').toLowerCase().includes(rawLower) ||
        (r.studentName || '').toLowerCase().includes(rawLower) ||
        (r.email || '').toLowerCase().includes(rawLower) ||
        (r.className || '').toLowerCase().includes(rawLower);

      if (textMatchRaw) return true;

      let allowedKeys: string[] = [];
      if (searchInfo.targetSubject) {
        if (searchInfo.targetSubject === 'math') {
          allowedKeys = ['math'];
        } else if (searchInfo.targetSubject === 'literature') {
          allowedKeys = ['literature'];
        } else if (searchInfo.targetSubject === 'english') {
          allowedKeys = ['english'];
        } else if (searchInfo.targetSubject === 'gpa') {
          allowedKeys = ['gpa'];
        } else {
          allowedKeys = [searchInfo.targetSubject];
        }
      } else if (subject) {
        if (subject === 'math') {
          allowedKeys = ['math'];
        } else if (subject === 'literature') {
          allowedKeys = ['literature'];
        } else if (subject === 'english') {
          allowedKeys = ['english'];
        }
      } else {
        allowedKeys = ['math', 'literature', 'english', 'gpa'];
      }

      if (searchInfo.type === 'text') {
        if (searchInfo.targetSubject) {
          for (const key of allowedKeys) {
            const val = r[key];
            if (val !== null && val !== undefined && val !== '') return true;
          }
        }
        return false;
      }

      if (searchInfo.type === 'comparison') {
        const { opSign, compVal } = searchInfo;
        for (const key of allowedKeys) {
          const val = r[key];
          if (val === null || val === undefined || val === '') continue;
          const num = typeof val === 'number' ? val : parseFloat(val as string);
          if (isNaN(num)) continue;

          if (opSign === '>' && num > compVal) return true;
          if (opSign === '<' && num < compVal) return true;
          if (opSign === '>=' && num >= compVal) return true;
          if (opSign === '<=' && num <= compVal) return true;
          if (opSign === '=' && Math.abs(num - compVal) < 0.01) return true;
        }
        return false;
      }

      if (searchInfo.type === 'numeric') {
        const { numVal, isInteger } = searchInfo;

        for (const key of allowedKeys) {
          const val = r[key];
          if (val === null || val === undefined || val === '') continue;
          const num = typeof val === 'number' ? val : parseFloat(val as string);
          if (isNaN(num)) continue;

          if (isInteger) {
            if (Math.floor(num) === numVal || Math.abs(num - numVal) < 0.01) return true;
          } else {
            if (Math.abs(num - numVal) < 0.01) return true;
          }
        }
        return false;
      }

      return false;
    });
  }

  if (scoreSubject && scoreSubject !== 'none' && scoreVal !== undefined && scoreVal !== '') {
    const val = parseFloat(scoreVal as string);
    if (!isNaN(val)) {
      const op = (scoreOp as string) || 'gte';
      records = records.filter((r: any) => {
        let targetKey = scoreSubject as string;
        if (scoreSubject === 'subjectGpa') {
          targetKey = subject || 'math';
        } else if (['oral', 'm15', 'mid', 'final'].includes(scoreSubject as string)) {
          targetKey = `${subject || 'math'}_${scoreSubject}`;
        }
        
        const actualVal = r[targetKey];
        if (actualVal === null || actualVal === undefined || actualVal === '') return false;
        
        const numericVal = parseFloat(actualVal);
        if (isNaN(numericVal)) return false;
        
        if (op === 'gte') return numericVal >= val;
        if (op === 'lte') return numericVal <= val;
        if (op === 'eq') {
          if (val === Math.floor(val)) {
            return numericVal >= val && numericVal < val + 1.0;
          } else {
            return Math.abs(numericVal - val) < 0.01;
          }
        }
        return true;
      });
    }
  }

  const cleanRecords = records.map((r: any) => {
    return Object.fromEntries(Object.entries(r).filter(([_, v]) => v !== null));
  });

  if (req.query.all === 'true') {
    res.json(cleanRecords);
    return;
  }

  const p = Math.max(1, parseInt(page as string) || 1);
  const s = size ? Math.min(Math.max(parseInt(size as string) || 10, 1), 10000) : 10;
  const totalElements = cleanRecords.length;
  const totalPages = Math.ceil(totalElements / s) || 1;
  const content = cleanRecords.slice((p - 1) * s, p * s);
  res.json({
    content,
    totalElements,
    totalPages,
    page: p,
    size: s
  });
});

function formatEduEmail(email: string | undefined, defaultId: string): string {
  if (!email || !email.trim()) {
    return `${defaultId.toLowerCase()}@edu.com`;
  }
  const prefix = email.trim().split('@')[0].trim();
  return prefix ? `${prefix}@edu.com` : `${defaultId.toLowerCase()}@edu.com`;
}

function formatGmail(email: string | undefined, defaultId: string): string {
  if (!email || !email.trim()) {
    return `${defaultId.toLowerCase()}@gmail.com`;
  }
  const prefix = email.trim().split('@')[0].trim();
  return prefix ? `${prefix}@gmail.com` : `${defaultId.toLowerCase()}@gmail.com`;
}

app.post('/api/teachers', (req, res) => {
  const teacher = req.body || {};
  const db = readDb();
  const cleanId = (teacher.id || '').trim().toUpperCase();
  if (!cleanId) {
    return res.status(400).json({ message: 'Mã giáo viên không được để trống.' });
  }
  if (db.members.some((m: any) => (m.id || '').trim().toUpperCase() === cleanId)) {
    return res.status(400).json({ message: `Mã giáo viên ${cleanId} đã tồn tại trong hệ thống.` });
  }
  const email = formatEduEmail(teacher.email, cleanId);
  const cleanEmail = email.trim().toLowerCase();
  if (db.members.some((m: any) => (m.email || '').trim().toLowerCase() === cleanEmail)) {
    return res.status(400).json({ message: `Email ${cleanEmail} đã tồn tại trong hệ thống.` });
  }

  const newTeacher = {
    ...teacher,
    id: cleanId,
    email: cleanEmail,
    password: ensureSha1(teacher.password || 'teacher123'),
    role: 'teacher',
    assignedClasses: Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [],
    subject: teacher.subject || 'math'
  };
  db.members.push(newTeacher);
  writeDb(db);
  console.log(`[DB Sync] Đã lưu giáo viên mới ${cleanId} (${cleanEmail}) vào db.json.`);
  res.status(201).json(newTeacher);
});

const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    createClass: true,
    editClass: true,
    deleteClass: true,
    manageMembers: true,
    assignTeachers: true,
    autoAssignTeacher: true,
    enrollStudents: true,
    unenrollStudents: true,
    editMathGrades: true,
    editLiteratureGrades: true,
    editEnglishGrades: true,
    teacherEnterGrades: true,
    teacherClearGrades: true,
    viewAllSchoolGrades: true,
    viewClassGrades: true,
    teacherViewAssignedClassGrades: true,
    teacherViewStudentList: true,
    exportCsvReports: true,
    studentViewGrades: true,
    teacherAutoClaimClass: true,
    manageRolePermissions: true
  },
  teacher: {
    createClass: false,
    editClass: false,
    deleteClass: false,
    manageMembers: false,
    assignTeachers: false,
    autoAssignTeacher: true,
    enrollStudents: false,
    unenrollStudents: false,
    editMathGrades: true,
    editLiteratureGrades: true,
    editEnglishGrades: true,
    teacherEnterGrades: true,
    teacherClearGrades: false,
    viewAllSchoolGrades: false,
    viewClassGrades: true,
    teacherViewAssignedClassGrades: true,
    teacherViewStudentList: true,
    exportCsvReports: true,
    studentViewGrades: false,
    teacherAutoClaimClass: true,
    manageRolePermissions: false
  },
  student: {
    createClass: false,
    editClass: false,
    deleteClass: false,
    manageMembers: false,
    assignTeachers: false,
    autoAssignTeacher: false,
    enrollStudents: false,
    unenrollStudents: false,
    editMathGrades: false,
    editLiteratureGrades: false,
    editEnglishGrades: false,
    teacherEnterGrades: false,
    teacherClearGrades: false,
    viewAllSchoolGrades: false,
    viewClassGrades: false,
    teacherViewAssignedClassGrades: false,
    teacherViewStudentList: false,
    exportCsvReports: true,
    studentViewGrades: true,
    teacherAutoClaimClass: false,
    manageRolePermissions: false
  }
};

app.get('/api/role-permissions', (req, res) => {
  const db = readDb();
  if (!db.rolePermissions) {
    db.rolePermissions = DEFAULT_ROLE_PERMISSIONS;
    writeDb(db);
  }

  const requestedRole = typeof req.query.role === 'string' ? req.query.role.trim().toLowerCase() : '';
  if (requestedRole && (requestedRole === 'admin' || requestedRole === 'teacher' || requestedRole === 'student')) {
    return res.json({
      [requestedRole]: db.rolePermissions[requestedRole as 'admin' | 'teacher' | 'student'] || {}
    });
  }

  res.json(db.rolePermissions);
});

app.put('/api/role-permissions', (req, res) => {
  const newRolePermissions = req.body.rolePermissions || req.body;
  const db = readDb();
  db.rolePermissions = {
    admin: { ...(DEFAULT_ROLE_PERMISSIONS.admin), ...(newRolePermissions.admin || {}) },
    teacher: { ...(DEFAULT_ROLE_PERMISSIONS.teacher), ...(newRolePermissions.teacher || {}) },
    student: { ...(DEFAULT_ROLE_PERMISSIONS.student), ...(newRolePermissions.student || {}) }
  };

  // Automatically propagate role permissions to all members of that role
  if (Array.isArray(db.members)) {
    db.members = db.members.map((m: any) => {
      const role = m.role as 'admin' | 'teacher' | 'student';
      if (role && db.rolePermissions[role]) {
        return {
          ...m,
          permissions: {
            ...db.rolePermissions[role]
          }
        };
      }
      return m;
    });
  }

  writeDb(db);
  console.log('[RBAC Matrix] Đã cập nhật và đồng bộ ma trận phân quyền theo vai trò.');
  res.json({
    success: true,
    message: 'Cập nhật ma trận phân quyền thành công và đã áp dụng toàn bộ người dùng.',
    rolePermissions: db.rolePermissions
  });
});

app.put('/api/members/:id/permissions', (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  const db = readDb();
  const targetId = (id || '').trim().toLowerCase();
  
  if (!db.members) {
    db.members = [];
  }
  
  let index = db.members.findIndex((m: any) => (m.id || '').trim().toLowerCase() === targetId);
  if (index === -1) {
    index = db.members.findIndex((m: any) => (m.email || '').trim().toLowerCase() === targetId);
  }

  if (index !== -1) {
    db.members[index].permissions = permissions;
    writeDb(db);
    res.json({ message: 'Cập nhật phân quyền thành công.', member: db.members[index] });
  } else {
    // If not found in db.json, add stub member so permissions are persisted
    const newMember = {
      id: id,
      name: `User ${id}`,
      email: `${id.toLowerCase()}@school.com`,
      password: ensureSha1('123'),
      role: id.toUpperCase().startsWith('GV') ? 'teacher' : (id.toUpperCase().startsWith('AD') ? 'admin' : 'student'),
      permissions: permissions
    };
    db.members.push(newMember);
    writeDb(db);
    res.json({ message: 'Cập nhật phân quyền thành công.', member: newMember });
  }
});

app.put('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const updatedTeacher = req.body || {};
  const db = readDb();
  const targetId = (id || '').trim().toUpperCase();
  const index = db.members.findIndex((m: any) => (m.id || '').trim().toUpperCase() === targetId);
  if (index !== -1) {
    const email = formatEduEmail(updatedTeacher.email, targetId);
    const cleanEmail = email.trim().toLowerCase();

    const emailConflict = db.members.some((m: any, idx: number) => idx !== index && (m.email || '').trim().toLowerCase() === cleanEmail);
    if (emailConflict) {
      return res.status(400).json({ message: `Email ${cleanEmail} đã được sử dụng bởi tài khoản khác.` });
    }

    db.members[index] = {
      ...db.members[index],
      ...updatedTeacher,
      id: targetId,
      email: cleanEmail,
      role: 'teacher'
    };
    writeDb(db);
    console.log(`[DB Sync] Đã cập nhật giáo viên ${targetId} (${cleanEmail}) trong db.json.`);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
  }
});

app.delete('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const targetId = (id || '').trim().toUpperCase();
  const initialLength = db.members.length;
  db.members = db.members.filter((m: any) => (m.id || '').trim().toUpperCase() !== targetId);
  writeDb(db);
  if (db.members.length < initialLength) {
    console.log(`[DB Sync] Đã xóa giáo viên ${targetId} khỏi db.json.`);
    res.json({ message: 'Xóa giáo viên thành công.' });
  } else {
    res.status(404).json({ message: 'Không tìm thấy giáo viên với ID này.' });
  }
});

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

app.post('/api/teachers/auto-assign', (req, res) => {
  const db = readDb();
  const classes = db.classes || [];
  const teachers = (db.members || []).filter((m: any) => m.role === 'teacher');

  const subjects = ['math', 'literature', 'english'];
  let assignedCount = 0;

  subjects.forEach(subject => {
    const subjectTeachers = teachers.filter((t: any) => t.subject === subject);
    if (subjectTeachers.length === 0) return;

    const missingClasses = classes.filter((c: any) => {
      return !teachers.some(
        (t: any) => t.subject === subject && Array.isArray(t.assignedClasses) && t.assignedClasses.includes(c.id)
      );
    });

    const shuffledClasses = shuffleArray(missingClasses);

    shuffledClasses.forEach((c: any) => {
      const hasSubjectTeacher = teachers.some(
        (t: any) => t.subject === subject && Array.isArray(t.assignedClasses) && t.assignedClasses.includes(c.id)
      );
      if (hasSubjectTeacher) return;

      const availableTeachers = subjectTeachers.filter((t: any) => {
        const assigned = Array.isArray(t.assignedClasses) ? t.assignedClasses : [];
        return !assigned.includes(c.id);
      });
      if (availableTeachers.length === 0) return;

      const underLimitTeachers = availableTeachers.filter((t: any) => {
        const cnt = Array.isArray(t.assignedClasses) ? t.assignedClasses.length : 0;
        return cnt < 2;
      });

      const pool = underLimitTeachers.length > 0 ? underLimitTeachers : availableTeachers;

      const minCount = Math.min(...pool.map((t: any) => Array.isArray(t.assignedClasses) ? t.assignedClasses.length : 0));
      const bestCandidates: any[] = pool.filter((t: any) => (Array.isArray(t.assignedClasses) ? t.assignedClasses.length : 0) === minCount);

      const chosenTeacher: any = shuffleArray(bestCandidates)[0];
      if (chosenTeacher) {
        if (!Array.isArray(chosenTeacher.assignedClasses)) {
          chosenTeacher.assignedClasses = [];
        }
        chosenTeacher.assignedClasses.push(c.id);
        assignedCount++;
      }
    });
  });

  writeDb(db);
  res.json({ message: 'Tự động phân công giáo viên thành công.', assignedCount, members: db.members });
});

app.post('/api/teachers/:id/auto-assign', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const teacher = (db.members || []).find((m: any) => m.id === id && m.role === 'teacher');
  if (!teacher) {
    return res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
  }

  const subject = teacher.subject || 'math';
  const classes = db.classes || [];
  const allTeachers = (db.members || []).filter((m: any) => m.role === 'teacher');

  if (!Array.isArray(teacher.assignedClasses)) {
    teacher.assignedClasses = [];
  }

  const newlyAssigned: string[] = [];

  const missingClasses: any[] = classes.filter((c: any) => {
    const hasSubjectTeacher = allTeachers.some(
      (t: any) => t.subject === subject && Array.isArray(t.assignedClasses) && t.assignedClasses.includes(c.id)
    );
    return !hasSubjectTeacher && !teacher.assignedClasses.includes(c.id);
  });

  const shuffledMissing: any[] = shuffleArray(missingClasses);

  for (const c of shuffledMissing) {
    if (teacher.assignedClasses.length >= 2) {
      break;
    }
    teacher.assignedClasses.push(c.id);
    newlyAssigned.push(c.id);
  }

  writeDb(db);

  const currentCount = teacher.assignedClasses.length;
  let responseMsg = '';
  if (newlyAssigned.length > 0) {
    responseMsg = `Đã tự động xếp ngẫu nhiên ${teacher.name} (${subject}) vào ${newlyAssigned.length} lớp đang thiếu: ${newlyAssigned.join(', ')} (tối đa 2 lớp/giáo viên).`;
  } else if (currentCount >= 2) {
    responseMsg = `Giáo viên ${teacher.name} đã đạt giới hạn tối đa 2 lớp.`;
  } else {
    responseMsg = `Tất cả các lớp hiện tại đều đã có giáo viên môn này.`;
  }

  res.json({
    message: responseMsg,
    newlyAssigned,
    teacher,
    members: db.members
  });
});

app.post('/api/students', async (req, res) => {
  const student = req.body || {};
  const db = readDb();
  const cleanId = (student.id || '').trim().toUpperCase();
  if (!cleanId) {
    return res.status(400).json({ message: 'Mã học sinh không được để trống.' });
  }
  if (db.members.some((m: any) => (m.id || '').trim().toUpperCase() === cleanId)) {
    return res.status(400).json({ message: `Mã học sinh ${cleanId} đã tồn tại trong hệ thống.` });
  }
  const email = formatGmail(student.email, cleanId);
  const cleanEmail = email.trim().toLowerCase();
  if (db.members.some((m: any) => (m.email || '').trim().toLowerCase() === cleanEmail)) {
    return res.status(400).json({ message: `Email ${cleanEmail} đã tồn tại trong hệ thống.` });
  }

  const rawPassword = (student.password || '').trim() || generateSecureRandomPassword(10);
  const newStudent = {
    ...student,
    id: cleanId,
    code: cleanId,
    email: cleanEmail,
    password: ensureSha1(rawPassword),
    role: 'student',
    className: student.className || ''
  };

  // Đồng bộ sang Spring Boot backend nếu online
  try {
    await fetch(`${BACKEND_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newStudent,
        code: cleanId,
        password: rawPassword
      })
    });
  } catch (_) {}

  db.members.push(newStudent);
  
  // Ensure default record in db.grades
  const targetId = cleanId.toLowerCase();
  const existingGrade = db.grades.find((g: any) => (g.studentId || '').trim().toLowerCase() === targetId);
  if (!existingGrade) {
    db.grades.push({
      studentId: cleanId,
      math: null,
      literature: null,
      english: null
    });
  }
  
  writeDb(db);
  console.log(`[DB Sync] Đã lưu học sinh ${cleanId} (${cleanEmail}) vào db.json thành công.`);
  res.status(201).json(newStudent);
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const updatedStudent = req.body || {};
  const db = readDb();
  const targetId = (id || '').trim().toUpperCase();
  const index = db.members.findIndex((m: any) => (m.id || '').trim().toUpperCase() === targetId);
  if (index !== -1) {
    const email = formatGmail(updatedStudent.email, targetId);
    const cleanEmail = email.trim().toLowerCase();

    const emailConflict = db.members.some((m: any, idx: number) => idx !== index && (m.email || '').trim().toLowerCase() === cleanEmail);
    if (emailConflict) {
      return res.status(400).json({ message: `Email ${cleanEmail} đã được sử dụng bởi tài khoản khác.` });
    }

    db.members[index] = {
      ...db.members[index],
      ...updatedStudent,
      id: targetId,
      code: targetId,
      email: cleanEmail,
      role: 'student',
      password: updatedStudent.password ? ensureSha1(updatedStudent.password) : db.members[index].password
    };

    if (!updatedStudent.className || updatedStudent.className.trim() === '') {
      const gTargetId = targetId.toLowerCase();
      const gradeIdx = db.grades.findIndex((g: any) => (g.studentId || '').trim().toLowerCase() === gTargetId);
      if (gradeIdx !== -1) {
        db.grades[gradeIdx] = {
          studentId: db.grades[gradeIdx].studentId || targetId,
          math: null, literature: null, english: null,
          math_oral: null, math_m15: null, math_mid: null, math_final: null,
          literature_oral: null, literature_m15: null, literature_mid: null, literature_final: null,
          english_oral: null, english_m15: null, english_mid: null, english_final: null
        };
      }
    }

    // Đồng bộ sang Spring Boot backend nếu online
    try {
      await fetch(`${BACKEND_URL}/api/students/${encodeURIComponent(targetId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db.members[index])
      });
    } catch (_) {}

    writeDb(db);
    console.log(`[DB Sync] Đã cập nhật học sinh ${targetId} (${cleanEmail}) trong db.json thành công.`);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy học sinh.' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const targetId = (id || '').trim().toUpperCase();
  const initialLength = db.members.length;
  db.members = db.members.filter((m: any) => (m.id || '').trim().toUpperCase() !== targetId);
  db.grades = db.grades.filter((g: any) => (g.studentId || '').trim().toUpperCase() !== targetId);
  writeDb(db);
  if (db.members.length < initialLength) {
    console.log(`[DB Sync] Đã xóa học sinh ${targetId} khỏi db.json.`);
    res.json({ message: 'Xóa học sinh thành công.' });
  } else {
    res.status(404).json({ message: 'Không tìm thấy học sinh với ID này.' });
  }
});

app.post('/api/members', (req, res) => {
  const member = req.body || {};
  const db = readDb();
  const cleanId = (member.id || '').trim().toUpperCase();
  if (!cleanId) {
    return res.status(400).json({ message: 'Mã thành viên không được để trống.' });
  }
  if (db.members.some((m: any) => (m.id || '').trim().toUpperCase() === cleanId)) {
    return res.status(400).json({ message: `Mã thành viên ${cleanId} đã tồn tại.` });
  }
  const cleanEmail = (member.email || `${cleanId.toLowerCase()}@school.com`).trim().toLowerCase();
  const newMember = {
    ...member,
    id: cleanId,
    email: cleanEmail,
    password: ensureSha1(member.password || '123')
  };
  db.members.push(newMember);
  writeDb(db);
  console.log(`[DB Sync] Đã lưu thành viên ${cleanId} (${cleanEmail}) vào db.json.`);
  res.status(201).json(newMember);
});

app.put('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const updated = req.body || {};
  const db = readDb();
  const targetId = (id || '').trim().toUpperCase();
  const index = db.members.findIndex((m: any) => (m.id || '').trim().toUpperCase() === targetId || (m.code || '').trim().toUpperCase() === targetId);
  if (index !== -1) {
    if (updated.password) {
      updated.password = ensureSha1(updated.password);
    }
    db.members[index] = { ...db.members[index], ...updated, id: db.members[index].id };
    writeDb(db);
    console.log(`[DB Sync] Đã cập nhật thành viên ${targetId} trong db.json.`);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy thành viên.' });
  }
});

app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const targetId = (id || '').trim().toUpperCase();
  const initialLength = db.members.length;
  db.members = db.members.filter((m: any) => (m.id || '').trim().toUpperCase() !== targetId);
  db.grades = db.grades.filter((g: any) => (g.studentId || '').trim().toUpperCase() !== targetId);
  writeDb(db);
  if (db.members.length < initialLength) {
    console.log(`[DB Sync] Đã xóa thành viên ${targetId} khỏi db.json.`);
    res.json({ message: 'Xóa thành viên thành công.' });
  } else {
    res.status(404).json({ message: 'Không tìm thấy thành viên.' });
  }
});

app.post('/api/classes', (req, res) => {
  const { id, name } = req.body;
  const db = readDb();
  if (db.classes.some((c: any) => c.id === id)) {
    return res.status(400).json({ message: 'Mã lớp này đã tồn tại trong hệ thống.' });
  }
  const newClass = { id, name };
  db.classes.push(newClass);
  writeDb(db);
  res.status(201).json(newClass);
});

app.delete('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const targetId = (id || '').trim().toLowerCase();
  const initialLength = db.classes.length;
  db.classes = db.classes.filter((c: any) => (c.id || '').trim().toLowerCase() !== targetId);
  db.members = db.members.map((m: any) => {
    if (m.role === 'student' && (m.className || '').trim().toLowerCase() === targetId) {
      return { ...m, className: '' };
    }
    if (m.role === 'teacher' && m.assignedClasses) {
      return { ...m, assignedClasses: m.assignedClasses.filter((c: string) => (c || '').trim().toLowerCase() !== targetId) };
    }
    return m;
  });
  writeDb(db);
  if (db.classes.length < initialLength) {
    res.json({ message: 'Xóa lớp học thành công.' });
  } else {
    res.status(404).json({ message: 'Không tìm thấy lớp học với ID này.' });
  }
});

app.post('/api/enroll/student', (req, res) => {
  const { id, className } = req.body;
  const db = readDb();
  const targetId = (id || '').trim().toLowerCase();
  const index = db.members.findIndex((m: any) => (m.id || '').trim().toLowerCase() === targetId);
  if (index !== -1) {
    db.members[index].className = className;
    writeDb(db);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy học sinh.' });
  }
});

app.post('/api/enroll/teacher', (req, res) => {
  const { id, className } = req.body;
  const db = readDb();
  const targetId = (id || '').trim().toLowerCase();
  const index = db.members.findIndex((m: any) => (m.id || '').trim().toLowerCase() === targetId);
  if (index !== -1) {
    const assigned = db.members[index].assignedClasses || [];
    if (!assigned.includes(className)) {
      db.members[index].assignedClasses = [...assigned, className];
    }
    writeDb(db);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
  }
});

app.post('/api/unenroll/student', (req, res) => {
  const { id } = req.body;
  const db = readDb();
  const targetId = (id || '').trim().toLowerCase();
  const index = db.members.findIndex((m: any) => (m.id || '').trim().toLowerCase() === targetId);
  if (index !== -1) {
    db.members[index].className = '';

    const gradeIdx = db.grades.findIndex((g: any) => (g.studentId || '').trim().toLowerCase() === targetId);
    if (gradeIdx !== -1) {
      db.grades[gradeIdx] = {
        studentId: db.grades[gradeIdx].studentId || db.members[index].id,
        math: null, literature: null, english: null,
        math_oral: null, math_m15: null, math_mid: null, math_final: null,
        literature_oral: null, literature_m15: null, literature_mid: null, literature_final: null,
        english_oral: null, english_m15: null, english_mid: null, english_final: null
      };
    }

    writeDb(db);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy học sinh.' });
  }
});

app.post('/api/unenroll/teacher', (req, res) => {
  const { id, className } = req.body;
  const db = readDb();
  const targetId = (id || '').trim().toLowerCase();
  const index = db.members.findIndex((m: any) => (m.id || '').trim().toLowerCase() === targetId);
  if (index !== -1) {
    const assigned = db.members[index].assignedClasses || [];
    db.members[index].assignedClasses = assigned.filter((c: string) => c !== className);
    writeDb(db);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
  }
});

app.put('/api/grades/:studentId', (req, res) => {
  const { studentId } = req.params;
  const {
    math, literature, english,
    math_oral, math_m15, math_mid, math_final,
    literature_oral, literature_m15, literature_mid, literature_final,
    english_oral, english_m15, english_mid, english_final,
    updatedBy
  } = req.body;
  const db = readDb();

  if (updatedBy) {
    const user = db.members.find((m: any) => m.id === updatedBy);
    if (user && user.role === 'teacher') {
      const teacherPerms = db.rolePermissions?.teacher || DEFAULT_ROLE_PERMISSIONS.teacher;
      if (teacherPerms.teacherEnterGrades === false) {
        return res.status(403).json({ message: 'Giáo viên chưa được cấp quyền nhập hoặc sửa điểm.' });
      }
    }
  }

  const targetId = (studentId || '').trim().toLowerCase();
  const index = db.grades.findIndex((g: any) => (g.studentId || '').trim().toLowerCase() === targetId);

  const existingGrade = index !== -1 ? db.grades[index] : {};

  const finalMath = (math_oral !== undefined || math_m15 !== undefined || math_mid !== undefined || math_final !== undefined)
    ? calculateSubjectGPA(
        math_oral !== undefined ? math_oral : existingGrade.math_oral,
        math_m15 !== undefined ? math_m15 : existingGrade.math_m15,
        math_mid !== undefined ? math_mid : existingGrade.math_mid,
        math_final !== undefined ? math_final : existingGrade.math_final
      )
    : (math !== undefined ? math : (existingGrade.math !== undefined ? existingGrade.math : null));

  const finalLiterature = (literature_oral !== undefined || literature_m15 !== undefined || literature_mid !== undefined || literature_final !== undefined)
    ? calculateSubjectGPA(
        literature_oral !== undefined ? literature_oral : existingGrade.literature_oral,
        literature_m15 !== undefined ? literature_m15 : existingGrade.literature_m15,
        literature_mid !== undefined ? literature_mid : existingGrade.literature_mid,
        literature_final !== undefined ? literature_final : existingGrade.literature_final
      )
    : (literature !== undefined ? literature : (existingGrade.literature !== undefined ? existingGrade.literature : null));

  const finalEnglish = (english_oral !== undefined || english_m15 !== undefined || english_mid !== undefined || english_final !== undefined)
    ? calculateSubjectGPA(
        english_oral !== undefined ? english_oral : existingGrade.english_oral,
        english_m15 !== undefined ? english_m15 : existingGrade.english_m15,
        english_mid !== undefined ? english_mid : existingGrade.english_mid,
        english_final !== undefined ? english_final : existingGrade.english_final
      )
    : (english !== undefined ? english : (existingGrade.english !== undefined ? existingGrade.english : null));

  const gradeObj = {
    studentId: index !== -1 ? db.grades[index].studentId : studentId,
    math: finalMath,
    literature: finalLiterature,
    english: finalEnglish,
    
    math_oral: math_oral !== undefined ? (math_oral === '' ? null : math_oral) : (existingGrade.math_oral !== undefined ? existingGrade.math_oral : null),
    math_m15: math_m15 !== undefined ? (math_m15 === '' ? null : math_m15) : (existingGrade.math_m15 !== undefined ? existingGrade.math_m15 : null),
    math_mid: math_mid !== undefined ? (math_mid === '' ? null : math_mid) : (existingGrade.math_mid !== undefined ? existingGrade.math_mid : null),
    math_final: math_final !== undefined ? (math_final === '' ? null : math_final) : (existingGrade.math_final !== undefined ? existingGrade.math_final : null),
    
    literature_oral: literature_oral !== undefined ? (literature_oral === '' ? null : literature_oral) : (existingGrade.literature_oral !== undefined ? existingGrade.literature_oral : null),
    literature_m15: literature_m15 !== undefined ? (literature_m15 === '' ? null : literature_m15) : (existingGrade.literature_m15 !== undefined ? existingGrade.literature_m15 : null),
    literature_mid: literature_mid !== undefined ? (literature_mid === '' ? null : literature_mid) : (existingGrade.literature_mid !== undefined ? existingGrade.literature_mid : null),
    literature_final: literature_final !== undefined ? (literature_final === '' ? null : literature_final) : (existingGrade.literature_final !== undefined ? existingGrade.literature_final : null),
    
    english_oral: english_oral !== undefined ? (english_oral === '' ? null : english_oral) : (existingGrade.english_oral !== undefined ? existingGrade.english_oral : null),
    english_m15: english_m15 !== undefined ? (english_m15 === '' ? null : english_m15) : (existingGrade.english_m15 !== undefined ? existingGrade.english_m15 : null),
    english_mid: english_mid !== undefined ? (english_mid === '' ? null : english_mid) : (existingGrade.english_mid !== undefined ? existingGrade.english_mid : null),
    english_final: english_final !== undefined ? (english_final === '' ? null : english_final) : (existingGrade.english_final !== undefined ? existingGrade.english_final : null),
    updatedBy: updatedBy || existingGrade.updatedBy || null
  };

  if (index !== -1) {
    db.grades[index] = gradeObj;
  } else {
    db.grades.push(gradeObj);
  }
  writeDb(db);

  let subject: string | null = null;
  if (updatedBy) {
    const user = db.members.find((m: any) => m.id === updatedBy);
    if (user && user.role === 'teacher') {
      subject = user.subject || null;
    }
  }

  let result = { ...gradeObj };
  if (subject) {
    const isMath = subject.toLowerCase() === 'math';
    const isLit = subject.toLowerCase() === 'literature';
    const isEng = subject.toLowerCase() === 'english';

    result = {
      studentId: gradeObj.studentId,
      math: isMath ? gradeObj.math : null,
      literature: isLit ? gradeObj.literature : null,
      english: isEng ? gradeObj.english : null,
      math_oral: isMath ? gradeObj.math_oral : null,
      math_m15: isMath ? gradeObj.math_m15 : null,
      math_mid: isMath ? gradeObj.math_mid : null,
      math_final: isMath ? gradeObj.math_final : null,
      literature_oral: isLit ? gradeObj.literature_oral : null,
      literature_m15: isLit ? gradeObj.literature_m15 : null,
      literature_mid: isLit ? gradeObj.literature_mid : null,
      literature_final: isLit ? gradeObj.literature_final : null,
      english_oral: isEng ? gradeObj.english_oral : null,
      english_m15: isEng ? gradeObj.english_m15 : null,
      english_mid: isEng ? gradeObj.english_mid : null,
      english_final: isEng ? gradeObj.english_final : null,
      updatedBy: gradeObj.updatedBy
    };
  }

  const cleanResult = Object.fromEntries(Object.entries(result).filter(([_, v]) => v !== null));
  res.json(cleanResult);
});

app.delete('/api/grades/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = readDb();
  const targetId = (studentId || '').trim().toLowerCase();
  const index = db.grades.findIndex((g: any) => (g.studentId || '').trim().toLowerCase() === targetId);
  if (index !== -1) {
    db.grades[index] = { studentId: db.grades[index].studentId || studentId, math: null, literature: null, english: null };
  }
  writeDb(db);
  res.json({ message: 'Xóa điểm thành công.' });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} không tồn tại.` });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares as any);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath) as any);
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
