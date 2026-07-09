import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Anti-cache middleware for API responses to bypass aggressive browser/Vite/CDN caching
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';

let lastBackendState: 'online' | 'offline' | 'error' | 'unknown' = 'unknown';
let lastErrorStatus: number | null = null;

// Try to proxy to Spring Boot first; if it fails (e.g., Connection Refused), fall back to local db.json mock handlers
app.use('/api', async (req, res, next) => {
  // If we are in production on Cloud Run and no explicit BACKEND_URL is set, we can skip proxy to avoid delays
  if (process.env.NODE_ENV === 'production' && !process.env.BACKEND_URL) {
    return next();
  }

  // Define a quick helper to fetch from backend
  const fetchFromBackend = async (subPath: string, options: any = {}) => {
    const targetUrl = `${BACKEND_URL}${subPath}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 seconds timeout
    
    try {
      const response = await fetch(targetUrl, {
        ...options,
        redirect: 'manual', // Prevent automatically following environment's redirect pages
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // If we got a redirect status (3xx), it is likely the environment's auth/cookie check page
      if (response.status >= 300 && response.status < 400) {
        throw new Error('Redirect detected (Likely environment auth/cookie check page)');
      }

      // If the response content is HTML instead of JSON, it is likely an Nginx redirect/error page
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
    // Intercept GET /api/classes/:classId/members since Spring Boot doesn't have a direct class members endpoint.
    // We will query Spring Boot's GET /api/members and filter.
    const classMembersMatch = req.path.match(/^\/classes\/([^/]+)\/members$/);
    if (req.method === 'GET' && classMembersMatch) {
      const classId = classMembersMatch[1];
      const response = await fetchFromBackend('/api/members');
      if (response.ok) {
        updateBackendState('online');
        const members = await response.json();
        const classMembers = members.filter((m: any) => 
          (m.role === 'student' && m.className === classId) ||
          (m.role === 'teacher' && m.assignedClasses?.includes(classId))
        );
        return res.json(classMembers);
      } else {
        updateBackendState('error', response.status);
        return next();
      }
    }

    // Forward standard requests to Spring Boot
    const targetUrl = `${BACKEND_URL}${req.originalUrl}`;
    const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0;
    const body = hasBody ? JSON.stringify(req.body) : undefined;
    
    const headers: any = {
      'Content-Type': 'application/json',
    };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetchFromBackend(req.originalUrl, {
      method: req.method,
      headers,
      body
    });
    
    // If the backend returns a non-OK status:
    // - On GET requests or 404: gracefully fall back to local db.json mock data
    // - On POST/PUT/DELETE with other status codes: forward the error to the client so business validation (e.g. login failures) works
    if (!response.ok) {
      updateBackendState('error', response.status);
      if (req.method === 'GET' || response.status === 404) {
        return next();
      }
      
      res.status(response.status);
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return res.json(data);
      } else {
        const text = await response.text();
        return res.send(text);
      }
    }

    updateBackendState('online');
    
    // Set response headers from backend
    res.status(response.status);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (error: any) {
    // If it is a connection failure or abort, gracefully fall back to local mock
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
      return next();
    }
    
    console.error('[Proxy Error]', error);
    return next();
  }
});

const DB_FILE = path.join(process.cwd(), 'db.json');

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading DB file:', error);
  }
  return { classes: [], members: [], grades: [] };
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB file:', error);
  }
}

// API Routes
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.members.find(
    (m: any) => m.email.toLowerCase() === email.trim().toLowerCase() && m.password === password
  );
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ message: 'Email hoặc mật khẩu không đúng từ server.' });
  }
});

app.get('/api/members', (req, res) => {
  const { page, size, role, search } = req.query;
  const db = readDb();
  let list = db.members;

  if (role) {
    list = list.filter((m: any) => m.role === role);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((m: any) => 
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  }

  if (page) {
    const p = parseInt(page as string) || 1;
    const s = parseInt(size as string) || 10;
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
  } else {
    res.json(db.members);
  }
});

app.get('/api/teachers', (req, res) => {
  const { page, size, search } = req.query;
  const db = readDb();
  let list = db.members.filter((m: any) => m.role === 'teacher');

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((m: any) => 
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  }

  if (page) {
    const p = parseInt(page as string) || 1;
    const s = parseInt(size as string) || 10;
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
  } else {
    res.json(list);
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

app.get('/api/grades', (req, res) => {
  const { page, size, search } = req.query;
  const db = readDb();
  
  const students = db.members.filter((m: any) => m.role === 'student');
  let records = students.map((s: any) => {
    const g = db.grades.find((g: any) => g.studentId === s.id) || { math: null, literature: null, english: null };
    const mathVal = g.math !== null ? parseFloat(g.math) : null;
    const litVal = g.literature !== null ? parseFloat(g.literature) : null;
    const engVal = g.english !== null ? parseFloat(g.english) : null;
    
    let gpa: number | null = null;
    let count = 0;
    let sum = 0;
    if (mathVal !== null) { sum += mathVal; count++; }
    if (litVal !== null) { sum += litVal; count++; }
    if (engVal !== null) { sum += engVal; count++; }
    if (count > 0) {
      gpa = Math.round((sum / count) * 100) / 100;
    }

    return {
      studentId: s.id,
      studentName: s.name,
      className: s.className || 'Chưa xếp lớp',
      email: s.email,
      math: mathVal,
      literature: litVal,
      english: engVal,
      gpa
    };
  });

  if (search) {
    const q = (search as string).toLowerCase();
    records = records.filter((r: any) => 
      r.studentId.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.className.toLowerCase().includes(q) ||
      (r.math !== null && r.math.toString().includes(q)) ||
      (r.literature !== null && r.literature.toString().includes(q)) ||
      (r.english !== null && r.english.toString().includes(q)) ||
      (r.gpa !== null && r.gpa.toString().includes(q))
    );
  }

  if (page) {
    const p = parseInt(page as string) || 1;
    const s = parseInt(size as string) || 10;
    const totalElements = records.length;
    const totalPages = Math.ceil(totalElements / s) || 1;
    const content = records.slice((p - 1) * s, p * s);
    res.json({
      content,
      totalElements,
      totalPages,
      page: p,
      size: s
    });
  } else {
    res.json(db.grades);
  }
});

app.post('/api/teachers', (req, res) => {
  const teacher = req.body;
  const db = readDb();
  if (db.members.some((m: any) => m.id === teacher.id)) {
    return res.status(400).json({ message: 'Mã giáo viên đã tồn tại.' });
  }
  const newTeacher = { ...teacher, role: 'teacher' };
  db.members.push(newTeacher);
  writeDb(db);
  res.status(201).json(newTeacher);
});

app.put('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const updatedTeacher = req.body;
  const db = readDb();
  const index = db.members.findIndex((m: any) => m.id === id);
  if (index !== -1) {
    db.members[index] = { ...db.members[index], ...updatedTeacher, role: 'teacher' };
    writeDb(db);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy giáo viên.' });
  }
});

app.delete('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.members = db.members.filter((m: any) => m.id !== id);
  writeDb(db);
  res.json({ message: 'Xóa giáo viên thành công.' });
});

app.post('/api/students', (req, res) => {
  const student = req.body;
  const db = readDb();
  if (db.members.some((m: any) => m.id === student.id)) {
    return res.status(400).json({ message: 'Mã học sinh đã tồn tại.' });
  }
  const newStudent = { ...student, role: 'student' };
  db.members.push(newStudent);
  
  // Also create grade record
  db.grades.push({
    studentId: student.id,
    math: null,
    literature: null,
    english: null
  });
  
  writeDb(db);
  res.status(201).json(newStudent);
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const updatedStudent = req.body;
  const db = readDb();
  const index = db.members.findIndex((m: any) => m.id === id);
  if (index !== -1) {
    db.members[index] = { ...db.members[index], ...updatedStudent, role: 'student' };
    writeDb(db);
    res.json(db.members[index]);
  } else {
    res.status(404).json({ message: 'Không tìm thấy học sinh.' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.members = db.members.filter((m: any) => m.id !== id);
  db.grades = db.grades.filter((g: any) => g.studentId !== id);
  writeDb(db);
  res.json({ message: 'Xóa học sinh thành công.' });
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
  db.classes = db.classes.filter((c: any) => c.id !== id);
  db.members = db.members.map((m: any) => {
    if (m.role === 'student' && m.className === id) {
      return { ...m, className: '' };
    }
    if (m.role === 'teacher' && m.assignedClasses) {
      return { ...m, assignedClasses: m.assignedClasses.filter((c: string) => c !== id) };
    }
    return m;
  });
  writeDb(db);
  res.json({ message: 'Xóa lớp học thành công.' });
});

app.post('/api/enroll/student', (req, res) => {
  const { id, className } = req.body;
  const db = readDb();
  const index = db.members.findIndex((m: any) => m.id === id);
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
  const index = db.members.findIndex((m: any) => m.id === id);
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

app.post('/api/unenroll/teacher', (req, res) => {
  const { id, className } = req.body;
  const db = readDb();
  const index = db.members.findIndex((m: any) => m.id === id);
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
  const { math, literature, english } = req.body;
  const db = readDb();
  const index = db.grades.findIndex((g: any) => g.studentId === studentId);
  if (index !== -1) {
    db.grades[index] = { studentId, math, literature, english };
  } else {
    db.grades.push({ studentId, math, literature, english });
  }
  writeDb(db);
  res.json({ studentId, math, literature, english });
});

app.delete('/api/grades/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = readDb();
  const index = db.grades.findIndex((g: any) => g.studentId === studentId);
  if (index !== -1) {
    db.grades[index] = { studentId, math: null, literature: null, english: null };
  }
  writeDb(db);
  res.json({ message: 'Xóa điểm thành công.' });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
