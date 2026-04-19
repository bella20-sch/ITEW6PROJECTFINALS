const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'secret-key';
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
/* Default json limit is 100kb — base64 photos (students/faculty) exceed that and the body is rejected. */
app.use(express.json({ limit: '15mb' }));

// Load database helper (workspace collections optional in older JSON files)
const getDb = () => {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.teachingLoads) db.teachingLoads = [];
    if (!db.classActivities) db.classActivities = [];
    if (!db.classActivitySubmissions) db.classActivitySubmissions = [];
    if (!db.sectionMaterials) db.sectionMaterials = [];
    return db;
};
const saveDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');

const omitPassword = (row) => {
    if (!row || typeof row !== 'object') return row;
    const { password: _p, ...rest } = row;
    return rest;
};

// Fake Middleware for Token Checking 
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            req.user = decoded;
            return next();
        } catch(e) { /* ignore */ }
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role === 'Admin') return next();
    return res.status(403).json({ message: 'Admin only.' });
};

const requireFaculty = (req, res, next) => {
    if (req.user?.role === 'Faculty') return next();
    return res.status(403).json({ message: 'Faculty only.' });
};

const requireStudent = (req, res, next) => {
    if (req.user?.role === 'Student') return next();
    return res.status(403).json({ message: 'Student only.' });
};

const studentMatchesLoad = (student, load) => {
    if (!student || !load) return false;
    return (
        Number(student.courseID) === Number(load.courseID) &&
        String(student.section || '').trim() === String(load.section || '').trim()
    );
};

const nextAutoId = (arr, idKey) =>
    Array.isArray(arr) && arr.length ? Math.max(...arr.map((i) => Number(i[idKey]) || 0)) + 1 : 1;

const normEmail = (v) => String(v || '').trim().toLowerCase();

// --- AUTH ROUTE ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const em = normEmail(email);
    const db = getDb();

    const admin = db.admins.find((a) => normEmail(a.email) === em && a.password === password);
    if (admin) {
        const token = jwt.sign(
            { id: admin.adminID, role: 'Admin', email: admin.email },
            SECRET_KEY,
            { expiresIn: '1d' },
        );
        return res.json({
            token,
            user: {
                id: admin.adminID,
                role: 'Admin',
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                name: [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim(),
            },
        });
    }

    const faculty = db.faculty.find(
        (f) => normEmail(f.email) === em && f.password && String(f.password) === String(password),
    );
    if (faculty) {
        const token = jwt.sign(
            { id: faculty.facultyID, role: 'Faculty', email: faculty.email },
            SECRET_KEY,
            { expiresIn: '1d' },
        );
        return res.json({
            token,
            user: {
                id: faculty.facultyID,
                role: 'Faculty',
                email: faculty.email,
                firstName: faculty.firstName,
                lastName: faculty.lastName,
                name: [faculty.firstName, faculty.lastName].filter(Boolean).join(' ').trim(),
            },
        });
    }

    const student = db.students.find(
        (s) => normEmail(s.email) === em && s.password && String(s.password) === String(password),
    );
    if (student) {
        const token = jwt.sign(
            { id: student.studentID, role: 'Student', email: student.email },
            SECRET_KEY,
            { expiresIn: '1d' },
        );
        return res.json({
            token,
            user: {
                id: student.studentID,
                studentID: student.studentID,
                role: 'Student',
                email: student.email,
                firstName: student.firstName,
                lastName: student.lastName,
                name: [student.firstName, student.lastName].filter(Boolean).join(' ').trim(),
            },
        });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/api/auth/logout', authenticate, (req, res) => {
    return res.json({ ok: true });
});

app.get('/api/user', authenticate, (req, res) => res.json(req.user));


// --- META ENDPOINTS (Departments, Courses, Faculty) ---
app.get('/api/meta/:type', authenticate, (req, res) => {
    const db = getDb();
    const type = req.params.type;
    if (!db[type]) return res.status(404).json({ error: 'Not found' });
    if (type === 'faculty') {
        return res.json(db.faculty.map(omitPassword));
    }
    return res.json(db[type]);
});

app.post('/api/meta/:type', authenticate, (req, res) => {
    const db = getDb();
    const type = req.params.type;
    if (!db[type]) return res.status(404).json({ error: 'Not found' });
    
    const nextId = (db[type].length > 0 ? Math.max(...db[type].map(i => i.id || Object.values(i)[0])) : 0) + 1;
    // Assuming standard ID naming conventions like "departmentID" etc.
    // For simplicity just appending body
    const idKey = type.replace(/s$/, '') + 'ID';
    const newItem = { [idKey]: nextId, ...req.body };
    db[type].push(newItem);
    saveDb(db);
    return res.json(newItem);
});

app.put('/api/meta/:type/:id', authenticate, (req, res) => {
    const db = getDb();
    const { type, id } = req.params;
    if (!db[type]) return res.status(404).json({ error: 'Not found' });
    
    const idKey = type.replace(/s$/, '') + 'ID';
    const idx = db[type].findIndex(item => item[idKey] == id);
    if (idx === -1) return res.status(404).json({ error: 'Item not found' });
    
    db[type][idx] = { ...db[type][idx], ...req.body, [idKey]: Number(id) };
    saveDb(db);
    return res.json(db[type][idx]);
});

app.delete('/api/meta/:type/:id', authenticate, (req, res) => {
    const db = getDb();
    const { type, id } = req.params;
    if (!db[type]) return res.status(404).json({ error: 'Not found' });
    
    const idKey = type.replace(/s$/, '') + 'ID';
    db[type] = db[type].filter(item => item[idKey] != id);
    saveDb(db);
    return res.json({ ok: true });
});


// --- SUB-RECORD CRUD (skills, affiliations, violations, activities, medical, guardians, academic) ---
const subCollections = {
  skills:       { idKey: 'skillID',       parentKey: 'studentID' },
  affiliations: { idKey: 'affiliationID', parentKey: 'studentID' },
  violations:   { idKey: 'violationID',   parentKey: 'studentID' },
  activities:   { idKey: 'activityID',    parentKey: 'studentID' },
  medical:      { idKey: 'medicalID',     parentKey: 'studentID' },
  guardians:    { idKey: 'guardianID',    parentKey: 'studentID' },
  academic:     { idKey: 'academicID',    parentKey: 'studentID' },
};

app.post('/api/students/:studentId/:collection', authenticate, (req, res) => {
  const { studentId, collection } = req.params;
  const meta = subCollections[collection];
  if (!meta) return res.status(404).json({ error: 'Unknown collection' });
  const db = getDb();
  if (!db[collection]) db[collection] = [];
  const nextId = db[collection].length > 0 ? Math.max(...db[collection].map(i => i[meta.idKey] || 0)) + 1 : 1;
  const item = { [meta.idKey]: nextId, [meta.parentKey]: Number(studentId), ...req.body };
  db[collection].push(item);
  saveDb(db);
  return res.status(201).json(item);
});

app.put('/api/students/:studentId/:collection/:id', authenticate, (req, res) => {
  const { studentId, collection, id } = req.params;
  const meta = subCollections[collection];
  if (!meta) return res.status(404).json({ error: 'Unknown collection' });
  const db = getDb();
  const idx = (db[collection] || []).findIndex(i => i[meta.idKey] == id && i[meta.parentKey] == studentId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db[collection][idx] = { ...db[collection][idx], ...req.body, [meta.idKey]: Number(id), [meta.parentKey]: Number(studentId) };
  saveDb(db);
  return res.json(db[collection][idx]);
});

app.delete('/api/students/:studentId/:collection/:id', authenticate, (req, res) => {
  const { studentId, collection, id } = req.params;
  const meta = subCollections[collection];
  if (!meta) return res.status(404).json({ error: 'Unknown collection' });
  const db = getDb();
  db[collection] = (db[collection] || []).filter(i => !(i[meta.idKey] == id && i[meta.parentKey] == studentId));
  saveDb(db);
  return res.json({ ok: true });
});

// --- STUDENTS ENDPOINTS ---
app.get('/api/students', authenticate, (req, res) => {
    const db = getDb();
    let studs = [...db.students];
    const { search, section, courseID, skill, studentType } = req.query;

    if (search) {
        const sq = search.toLowerCase();
        studs = studs.filter(s => 
            s.firstName.toLowerCase().includes(sq) || 
            s.lastName.toLowerCase().includes(sq) ||
            s.email?.toLowerCase().includes(sq) ||
            String(s.studentID).includes(sq)
        );
    }
    if (section) studs = studs.filter(s => s.section === section);
    if (courseID) studs = studs.filter(s => String(s.courseID) === String(courseID));
    if (studentType) {
        studs = studs.filter(s => (s.studentType || 'Regular') === String(studentType));
    }

    if (skill) {
        const sq = skill.toLowerCase();
        const studentIdsWithSkill = new Set(
            db.skills.filter(sk => sk.skillName.toLowerCase().includes(sq)).map(sk => sk.studentID)
        );
        studs = studs.filter(s => studentIdsWithSkill.has(s.studentID));
    }

    return res.json(studs.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(omitPassword));
});

app.get('/api/students/:id', authenticate, (req, res) => {
    const db = getDb();
    const id = Number(req.params.id);
    const student = db.students.find(s => s.studentID === id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    return res.json({
        ...omitPassword(student),
        academicHistory: db.academic.filter(a => a.studentID === id),
        medicalHistory: db.medical.filter(m => m.studentID === id),
        activities: (db.activities || []).filter(ac => ac.studentID === id),
        guardians: db.guardians.filter(g => g.studentID === id),
        skills: db.skills.filter(sk => sk.studentID === id),
        affiliations: db.affiliations.filter(af => af.studentID === id),
        violations: db.violations.filter(v => v.studentID === id),
    });
});

app.post('/api/students', authenticate, (req, res) => {
    const db = getDb();
    const nextId = (db.students.length > 0 ? Math.max(...db.students.map(s => s.studentID)) : 0) + 1;
    const newStudent = { studentID: nextId, ...req.body };
    db.students.push(newStudent);
    saveDb(db);
    return res.status(201).json({
        ...newStudent, academicHistory: [], medicalHistory: [], guardians: [], skills: [], affiliations: [], violations: []
    });
});

app.put('/api/students/:id', authenticate, (req, res) => {
    const db = getDb();
    const id = Number(req.params.id);
    const idx = db.students.findIndex(s => s.studentID === id);
    if (idx === -1) return res.status(404).json({ error: 'Student not found' });

    db.students[idx] = { ...db.students[idx], ...req.body, studentID: id };
    saveDb(db);
    return res.json({
        ...db.students[idx],
        academicHistory: db.academic.filter(a => a.studentID === id),
        medicalHistory: db.medical.filter(m => m.studentID === id),
        guardians: db.guardians.filter(g => g.studentID === id),
        skills: db.skills.filter(sk => sk.studentID === id),
        affiliations: db.affiliations.filter(af => af.studentID === id),
        violations: db.violations.filter(v => v.studentID === id),
    });
});

app.delete('/api/students/:id', authenticate, (req, res) => {
    const db = getDb();
    const id = Number(req.params.id);
    db.students = db.students.filter(s => s.studentID !== id);
    db.academic = db.academic.filter(a => a.studentID !== id);
    db.medical = db.medical.filter(m => m.studentID !== id);
    db.guardians = db.guardians.filter(g => g.studentID !== id);
    db.skills = db.skills.filter(sk => sk.studentID !== id);
    db.affiliations = db.affiliations.filter(af => af.studentID !== id);
    db.violations = db.violations.filter(v => v.studentID !== id);
    if (db.classActivitySubmissions) {
        db.classActivitySubmissions = db.classActivitySubmissions.filter((x) => Number(x.studentID) !== id);
    }
    saveDb(db);
    return res.json({ ok: true });
});

// --- MIS ADMIN: provision accounts (used by LMS Admin page) ---
app.post('/api/admin/students', authenticate, requireAdmin, (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        departmentID,
        courseID,
        section,
        adviserFacultyID,
        studentType,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const dept = Number(departmentID);
    const crs = Number(courseID);
    const adv = Number(adviserFacultyID);
    const sec = String(section || '').trim();
    if (!dept || !crs || !sec || !adv) {
        return res.status(400).json({ message: 'Department, course, section, and adviser are required.' });
    }

    const db = getDb();
    const em = String(email).trim().toLowerCase();
    if (db.students.some(s => String(s.email || '').toLowerCase() === em)) {
        return res.status(409).json({ message: 'A student with this email already exists.' });
    }
    if (db.faculty.some(f => String(f.email || '').toLowerCase() === em)) {
        return res.status(409).json({ message: 'This email is already used by a faculty account.' });
    }

    const adviser = db.faculty.find(f => f.facultyID === adv);
    if (!adviser) return res.status(400).json({ message: 'Invalid faculty adviser.' });

    const allowedTypes = ['Regular', 'Irregular', 'Transferee'];
    const st = allowedTypes.includes(String(studentType || '').trim())
        ? String(studentType).trim()
        : 'Regular';

    const nextId = (db.students.length > 0 ? Math.max(...db.students.map(s => s.studentID)) : 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    const newStudent = {
        studentID: nextId,
        firstName: String(firstName).trim(),
        middleName: '',
        lastName: String(lastName).trim(),
        suffix: '',
        gender: '',
        birthDate: '',
        birthPlace: '',
        nationality: 'Filipino',
        civilStatus: 'Single',
        contactNumber: '',
        email: em,
        password: String(password),
        address: '',
        yearLevel: 1,
        section: sec,
        studentType: st,
        enrollmentStatus: 'Enrolled',
        dateEnrolled: today,
        courseID: crs,
        departmentID: dept,
        adviserFacultyID: adv,
    };
    db.students.push(newStudent);
    saveDb(db);
    return res.status(201).json(omitPassword(newStudent));
});

app.post('/api/admin/faculty', authenticate, requireAdmin, (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        departmentID,
        courseID,
        section,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const dept = Number(departmentID);
    const crs = Number(courseID);
    const sec = String(section || '').trim();
    if (!dept || !crs || !sec) {
        return res.status(400).json({ message: 'Department, course, and section are required.' });
    }

    const db = getDb();
    const em = String(email).trim().toLowerCase();
    if (db.faculty.some(f => String(f.email || '').toLowerCase() === em)) {
        return res.status(409).json({ message: 'A faculty member with this email already exists.' });
    }
    if (db.students.some(s => String(s.email || '').toLowerCase() === em)) {
        return res.status(409).json({ message: 'This email is already used by a student account.' });
    }

    const nextId = (db.faculty.length > 0 ? Math.max(...db.faculty.map(f => f.facultyID)) : 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    const newFaculty = {
        facultyID: nextId,
        departmentID: dept,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        middleName: '',
        position: 'Instructor',
        employmentStatus: 'Full-time',
        hireDate: today,
        email: em,
        password: String(password),
        contactNumber: '',
        officeLocation: '',
        courseID: crs,
        section: sec,
        photo: '',
    };
    db.faculty.push(newFaculty);
    saveDb(db);
    return res.status(201).json(omitPassword(newFaculty));
});

// --- LMS workspace: teaching loads, class activities, materials (faculty / student) ---

app.get('/api/me/assignments', authenticate, (req, res) => {
    const db = getDb();
    const role = req.user?.role;
    const uid = Number(req.user?.id);
    const students = db.students || [];
    if (role === 'Faculty') {
        const list = (db.teachingLoads || []).filter((t) => Number(t.facultyID) === uid);
        const out = list.map((t) => {
            const roster = students
                .filter((s) => studentMatchesLoad(s, t))
                .map(omitPassword);
            return {
                id: t.teachingLoadID,
                teachingLoadId: t.teachingLoadID,
                courseID: t.courseID,
                section: t.section,
                subjectCode: t.subjectCode || '',
                subjectTitle: t.subjectTitle || '',
                displayLabel: `${t.subjectTitle || 'Subject'} (${t.subjectCode || 'CODE'}) · Section ${t.section || '—'}`,
                students: roster,
            };
        });
        return res.json(out);
    }
    if (role === 'Student') {
        const me = students.find((s) => s.studentID === uid);
        const list = (db.teachingLoads || []).filter((tl) => me && studentMatchesLoad(me, tl));
        const out = list.map((t) => ({
            id: t.teachingLoadID,
            teachingLoadId: t.teachingLoadID,
            courseID: t.courseID,
            section: t.section,
            subjectCode: t.subjectCode || '',
            subjectTitle: t.subjectTitle || '',
            displayLabel: `${t.subjectTitle || 'Subject'} (${t.subjectCode || 'CODE'}) · Section ${t.section || '—'}`,
        }));
        return res.json(out);
    }
    return res.json([]);
});

app.post('/api/faculty/teaching-loads', authenticate, requireFaculty, (req, res) => {
    const db = getDb();
    const fid = Number(req.user.id);
    const f = db.faculty.find((x) => x.facultyID === fid);
    if (!f || !f.courseID || !String(f.section || '').trim()) {
        return res.status(400).json({ message: 'Your profile must have course and section set (MIS can update faculty).' });
    }
    const subjectCode = String(req.body?.subjectCode || '').trim();
    const subjectTitle = String(req.body?.subjectTitle || '').trim();
    if (!subjectCode || !subjectTitle) {
        return res.status(400).json({ message: 'Subject code and title are required.' });
    }
    const arr = db.teachingLoads;
    const row = {
        teachingLoadID: nextAutoId(arr, 'teachingLoadID'),
        facultyID: fid,
        courseID: Number(f.courseID),
        section: String(f.section).trim(),
        subjectCode,
        subjectTitle,
    };
    arr.push(row);
    saveDb(db);
    return res.status(201).json({
        id: row.teachingLoadID,
        teachingLoadId: row.teachingLoadID,
        ...row,
        displayLabel: `${subjectTitle} (${subjectCode}) · Section ${row.section}`,
        students: [],
    });
});

app.get('/api/me/activities', authenticate, (req, res) => {
    const db = getDb();
    const role = req.user?.role;
    const uid = Number(req.user?.id);
    const students = db.students || [];
    if (role === 'Faculty') {
        const acts = (db.classActivities || []).filter((a) => Number(a.facultyID) === uid);
        const subs = db.classActivitySubmissions || [];
        const out = acts.map((a) => {
            const related = subs.filter((s) => Number(s.classActivityID) === Number(a.classActivityID));
            const submissions = related.map((sub) => {
                const st = students.find((x) => x.studentID === sub.studentID);
                return {
                    ...sub,
                    studentName: st ? `${st.firstName} ${st.lastName}`.trim() : `Student #${sub.studentID}`,
                };
            });
            return {
                ...a,
                id: a.classActivityID,
                submissions,
            };
        });
        return res.json(out);
    }
    if (role === 'Student') {
        const me = students.find((s) => s.studentID === uid);
        if (!me) return res.json([]);
        const loadIds = new Set(
            (db.teachingLoads || []).filter((tl) => studentMatchesLoad(me, tl)).map((t) => Number(t.teachingLoadID)),
        );
        const acts = (db.classActivities || []).filter((a) => loadIds.has(Number(a.teachingLoadID)));
        const subs = db.classActivitySubmissions || [];
        const out = acts.map((a) => {
            const my = subs.find(
                (s) => Number(s.classActivityID) === Number(a.classActivityID) && Number(s.studentID) === uid,
            );
            return { ...a, id: a.classActivityID, mySubmission: my || null };
        });
        return res.json(out);
    }
    return res.json([]);
});

app.get('/api/me/materials', authenticate, (req, res) => {
    const db = getDb();
    const role = req.user?.role;
    const uid = Number(req.user?.id);
    const students = db.students || [];
    const mapMaterial = (m, tl) => ({
        ...m,
        id: m.sectionMaterialID,
        teachingLoadId: m.teachingLoadID,
        subjectCode: tl?.subjectCode || '',
        subjectTitle: tl?.subjectTitle || '',
        courseID: m.courseID,
        section: m.section,
    });
    if (role === 'Faculty') {
        const loads = db.teachingLoads || [];
        const list = (db.sectionMaterials || []).filter((m) => Number(m.facultyID) === uid);
        const out = list.map((m) => {
            const tl = loads.find((t) => Number(t.teachingLoadID) === Number(m.teachingLoadID));
            return mapMaterial(m, tl);
        });
        return res.json(out);
    }
    if (role === 'Student') {
        const me = students.find((s) => s.studentID === uid);
        if (!me) return res.json([]);
        const loadIds = new Set(
            (db.teachingLoads || []).filter((tl) => studentMatchesLoad(me, tl)).map((t) => Number(t.teachingLoadID)),
        );
        const list = (db.sectionMaterials || []).filter((m) => loadIds.has(Number(m.teachingLoadID)));
        const loads = db.teachingLoads || [];
        const out = list.map((m) => {
            const tl = loads.find((t) => Number(t.teachingLoadID) === Number(m.teachingLoadID));
            return mapMaterial(m, tl);
        });
        return res.json(out);
    }
    return res.json([]);
});

app.post('/api/faculty/activities', authenticate, requireFaculty, (req, res) => {
    const db = getDb();
    const fid = Number(req.user.id);
    const teachingLoadId = Number(req.body?.teachingLoadId || req.body?.teachingLoadID);
    const tl = (db.teachingLoads || []).find((t) => Number(t.teachingLoadID) === teachingLoadId);
    if (!tl || Number(tl.facultyID) !== fid) {
        return res.status(400).json({ message: 'Invalid teaching assignment.' });
    }
    const title = String(req.body?.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const arr = db.classActivities;
    const row = {
        classActivityID: nextAutoId(arr, 'classActivityID'),
        facultyID: fid,
        teachingLoadID: teachingLoadId,
        courseID: Number(tl.courseID),
        section: tl.section,
        subjectCode: tl.subjectCode || '',
        subjectTitle: tl.subjectTitle || '',
        title,
        description: String(req.body?.description || ''),
        deadline: req.body?.deadline ? String(req.body.deadline) : '',
        allow_late: !!req.body?.allow_late,
        maxScore: Number(req.body?.maxScore) > 0 ? Number(req.body.maxScore) : 100,
        createdAt: new Date().toISOString(),
    };
    arr.push(row);
    saveDb(db);
    return res.status(201).json({ ...row, id: row.classActivityID, submissions: [] });
});

app.post('/api/faculty/materials', authenticate, requireFaculty, (req, res) => {
    const db = getDb();
    const fid = Number(req.user.id);
    const teachingLoadId = Number(req.body?.teachingLoadId || req.body?.teachingLoadID);
    const tl = (db.teachingLoads || []).find((t) => Number(t.teachingLoadID) === teachingLoadId);
    if (!tl || Number(tl.facultyID) !== fid) {
        return res.status(400).json({ message: 'Invalid teaching assignment.' });
    }
    const title = String(req.body?.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const arr = db.sectionMaterials;
    const row = {
        sectionMaterialID: nextAutoId(arr, 'sectionMaterialID'),
        facultyID: fid,
        teachingLoadID: teachingLoadId,
        courseID: Number(tl.courseID),
        section: tl.section,
        title,
        content: String(req.body?.content || ''),
        link: String(req.body?.link || '').trim(),
        postedAt: new Date().toISOString(),
    };
    arr.push(row);
    saveDb(db);
    return res.status(201).json({ ...row, id: row.sectionMaterialID });
});

app.post('/api/student/activities/:id/submit', authenticate, requireStudent, (req, res) => {
    const db = getDb();
    const sid = Number(req.user.id);
    const actId = Number(req.params.id);
    const me = db.students.find((s) => s.studentID === sid);
    const act = (db.classActivities || []).find((a) => Number(a.classActivityID) === actId);
    if (!act || !me) return res.status(404).json({ message: 'Activity not found.' });
    const tl = (db.teachingLoads || []).find((t) => Number(t.teachingLoadID) === Number(act.teachingLoadID));
    if (!tl || !studentMatchesLoad(me, tl)) {
        return res.status(403).json({ message: 'You are not in this class section.' });
    }
    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Submission text is required.' });
    const arr = db.classActivitySubmissions;
    let sub = arr.find((s) => Number(s.classActivityID) === actId && Number(s.studentID) === sid);
    if (sub && sub.gradedAt) {
        return res.status(400).json({ message: 'This activity is already graded.' });
    }
    const now = new Date().toISOString();
    if (sub) {
        sub.content = content;
        sub.submittedAt = now;
    } else {
        sub = {
            submissionID: nextAutoId(arr, 'submissionID'),
            classActivityID: actId,
            studentID: sid,
            content,
            submittedAt: now,
            score: null,
            feedback: '',
            gradedAt: null,
        };
        arr.push(sub);
    }
    saveDb(db);
    return res.json(sub);
});

app.post('/api/faculty/activities/:id/grade', authenticate, requireFaculty, (req, res) => {
    const db = getDb();
    const fid = Number(req.user.id);
    const actId = Number(req.params.id);
    const act = (db.classActivities || []).find((a) => Number(a.classActivityID) === actId);
    if (!act || Number(act.facultyID) !== fid) {
        return res.status(403).json({ message: 'Not allowed.' });
    }
    const studentID = Number(req.body?.studentID);
    if (!studentID) return res.status(400).json({ message: 'studentID required.' });
    const arr = db.classActivitySubmissions || [];
    const sub = arr.find((s) => Number(s.classActivityID) === actId && Number(s.studentID) === studentID);
    if (!sub) return res.status(404).json({ message: 'No submission from this student.' });
    const max = Number(act.maxScore) > 0 ? Number(act.maxScore) : 100;
    let score = req.body?.score;
    if (score === '' || score === null || score === undefined) {
        return res.status(400).json({ message: 'Score is required to grade.' });
    }
    score = Number(score);
    if (Number.isNaN(score) || score < 0 || score > max) {
        return res.status(400).json({ message: `Score must be between 0 and ${max}.` });
    }
    sub.score = score;
    sub.feedback = String(req.body?.feedback || '');
    sub.gradedAt = new Date().toISOString();
    saveDb(db);
    return res.json(sub);
});

app.listen(PORT, () => {
    console.log(`Node/JSON Backend running on http://localhost:${PORT}`);
    console.log('MIS admin routes: POST /api/admin/students, POST /api/admin/faculty');
    console.log('Workspace: /api/me/assignments, /api/me/activities, /api/me/materials, …');
});
