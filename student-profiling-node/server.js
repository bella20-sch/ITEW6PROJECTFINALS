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

/** Public liveness: process up + database file readable (used by LMS bootstrap / refresh). */
app.get('/api/health', (_req, res) => {
    try {
        JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        return res.json({ ok: true });
    } catch {
        return res.status(503).json({ ok: false, message: 'Database unavailable.' });
    }
});

// Load database helper (workspace collections optional in older JSON files)
const getDb = () => {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.teachingLoads) db.teachingLoads = [];
    if (!db.classActivities) db.classActivities = [];
    if (!db.classActivitySubmissions) db.classActivitySubmissions = [];
    if (!db.sectionMaterials) db.sectionMaterials = [];
    if (!db.facultyStudentPeriodGrades) db.facultyStudentPeriodGrades = [];
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

/** Course + section string for matching students to a faculty assignment. */
const sectionEnrollmentKey = (courseID, section) =>
    `${Number(courseID)}|${String(section || '').trim()}`;

const facultyManagedSectionKeys = (db, facultyId) => {
    const keys = new Set();
    const fac = db.faculty.find((f) => f.facultyID === Number(facultyId));
    if (fac && fac.courseID != null && String(fac.section || '').trim()) {
        keys.add(sectionEnrollmentKey(fac.courseID, fac.section));
    }
    (db.teachingLoads || []).forEach((tl) => {
        if (Number(tl.facultyID) === Number(facultyId) && tl.courseID != null && String(tl.section || '').trim()) {
            keys.add(sectionEnrollmentKey(tl.courseID, tl.section));
        }
    });
    return keys;
};

const studentInFacultyManagedSections = (student, keys) =>
    keys.size > 0 && keys.has(sectionEnrollmentKey(student.courseID, student.section));

const GRADING_PERIODS = new Set(['prelim', 'midterm', 'finals']);
const ASSESSMENT_KINDS = new Set(['activity', 'quiz', 'exam']);

const normActivityFields = (a) => {
    if (!a || typeof a !== 'object') return a;
    const p = String(a.gradingPeriod || 'prelim').toLowerCase();
    const k = String(a.assessmentKind || 'activity').toLowerCase();
    return {
        ...a,
        gradingPeriod: GRADING_PERIODS.has(p) ? p : 'prelim',
        assessmentKind: ASSESSMENT_KINDS.has(k) ? k : 'activity',
    };
};

/** Average percent (0–100) from graded submissions for items of `kind` in `period`; null if none graded. */
const computedAssessmentAveragePercent = (db, teachingLoadID, studentID, period, kind) => {
    const acts = (db.classActivities || [])
        .map(normActivityFields)
        .filter(
            (x) =>
                Number(x.teachingLoadID) === Number(teachingLoadID) &&
                x.gradingPeriod === period &&
                x.assessmentKind === kind,
        );
    if (!acts.length) return null;
    const subs = db.classActivitySubmissions || [];
    const vals = [];
    acts.forEach((act) => {
        const sub = subs.find(
            (s) =>
                Number(s.classActivityID) === Number(act.classActivityID) &&
                Number(s.studentID) === Number(studentID),
        );
        if (sub && sub.score != null && sub.gradedAt != null) {
            const max = Number(act.maxScore) > 0 ? Number(act.maxScore) : 100;
            vals.push((Number(sub.score) / max) * 100);
        }
    });
    if (!vals.length) return null;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return Math.round(avg * 100) / 100;
};

const periodWeightedTotal = (activityPct, attendancePct, quizPct, examPct) => {
    const na = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0);
    return (
        Math.round(
            (0.2 * na(activityPct) +
                0.1 * na(attendancePct) +
                0.2 * na(quizPct) +
                0.5 * na(examPct)) *
                100,
        ) / 100
    );
};

const assertFacultyOwnsTeachingLoad = (db, req, tlId) => {
    const tl = (db.teachingLoads || []).find((t) => Number(t.teachingLoadID) === Number(tlId));
    if (!tl) return { ok: false, status: 404, msg: 'Class not found.' };
    if (req.user?.role !== 'Faculty' || Number(tl.facultyID) !== Number(req.user.id)) {
        return { ok: false, status: 403, msg: 'You do not teach this class.' };
    }
    return { ok: true, tl };
};

const assertStudentEnrolledInTeachingLoad = (db, req, tlId) => {
    const tl = (db.teachingLoads || []).find((t) => Number(t.teachingLoadID) === Number(tlId));
    if (!tl) return { ok: false, status: 404, msg: 'Class not found.' };
    if (req.user?.role !== 'Student') return { ok: false, status: 403, msg: 'Students only.' };
    const me = (db.students || []).find((s) => Number(s.studentID) === Number(req.user.id));
    if (!me || !studentMatchesLoad(me, tl)) {
        return { ok: false, status: 403, msg: 'You are not enrolled in this class.' };
    }
    return { ok: true, tl };
};

const getPeriodGradeRow = (db, teachingLoadID, studentID, schoolYear, semester, period) => {
    const arr = db.facultyStudentPeriodGrades || [];
    return arr.find(
        (g) =>
            Number(g.teachingLoadID) === Number(teachingLoadID) &&
            Number(g.studentID) === Number(studentID) &&
            String(g.schoolYear) === String(schoolYear) &&
            Number(g.semester) === Number(semester) &&
            String(g.period) === String(period),
    );
};

const upsertPeriodGradeRow = (db, teachingLoadID, studentID, schoolYear, semester, period, patch) => {
    const arr = db.facultyStudentPeriodGrades || (db.facultyStudentPeriodGrades = []);
    let row = getPeriodGradeRow(db, teachingLoadID, studentID, schoolYear, semester, period);
    if (!row) {
        row = {
            facultyPeriodGradeID: nextAutoId(arr, 'facultyPeriodGradeID'),
            teachingLoadID: Number(teachingLoadID),
            studentID: Number(studentID),
            schoolYear: String(schoolYear),
            semester: Number(semester),
            period: String(period),
            attendancePct: 0,
            quizPct: 0,
            examPct: 0,
        };
        arr.push(row);
    }
    Object.assign(row, patch);
    return row;
};

const computeGradebookRowForStudent = (db, tl, st, schoolYear, semester) => {
    const sid = Number(st.studentID);
    const periods = ['prelim', 'midterm', 'finals'];
    const periodTotals = [];
    const byPeriod = {};
    periods.forEach((period) => {
        const activityPct =
            computedAssessmentAveragePercent(db, tl.teachingLoadID, sid, period, 'activity') ?? 0;
        const g = getPeriodGradeRow(db, tl.teachingLoadID, sid, schoolYear, semester, period);
        const attendancePct = g != null ? Number(g.attendancePct) || 0 : 0;
        const quizFromActs = computedAssessmentAveragePercent(db, tl.teachingLoadID, sid, period, 'quiz');
        const examFromActs = computedAssessmentAveragePercent(db, tl.teachingLoadID, sid, period, 'exam');
        const quizManualPct = Number(g?.quizPct) || 0;
        const examManualPct = Number(g?.examPct) || 0;
        const quizPct = quizFromActs != null ? quizFromActs : quizManualPct;
        const examPct = examFromActs != null ? examFromActs : examManualPct;
        const periodTotal = periodWeightedTotal(activityPct, attendancePct, quizPct, examPct);
        periodTotals.push(periodTotal);
        byPeriod[period] = {
            activityPct,
            attendancePct,
            quizPct,
            examPct,
            quizManualPct,
            examManualPct,
            quizFromPostedActivities: quizFromActs != null,
            examFromPostedActivities: examFromActs != null,
            periodTotal,
        };
    });
    const semesterAverage =
        periodTotals.length === 3
            ? Math.round(((periodTotals[0] + periodTotals[1] + periodTotals[2]) / 3) * 100) / 100
            : null;
    return {
        studentID: sid,
        studentName: `${st.lastName}, ${st.firstName}`.trim(),
        periods: byPeriod,
        semesterAverage,
    };
};

/** One row per class activity / quiz / exam for a single student (student gradebook detail). */
const computeStudentAssessmentItems = (db, tl, studentID) => {
    const sid = Number(studentID);
    const subs = db.classActivitySubmissions || [];
    const periodOrder = { prelim: 0, midterm: 1, finals: 2 };
    const kindOrder = { activity: 0, quiz: 1, exam: 2 };
    const acts = (db.classActivities || [])
        .filter((a) => Number(a.teachingLoadID) === Number(tl.teachingLoadID))
        .map(normActivityFields)
        .sort((a, b) => {
            const pa = periodOrder[a.gradingPeriod] ?? 9;
            const pb = periodOrder[b.gradingPeriod] ?? 9;
            if (pa !== pb) return pa - pb;
            const ka = kindOrder[a.assessmentKind] ?? 9;
            const kb = kindOrder[b.assessmentKind] ?? 9;
            if (ka !== kb) return ka - kb;
            return String(a.title || '').localeCompare(String(b.title || ''));
        });
    return acts.map((act) => {
        const sub = subs.find(
            (s) => Number(s.classActivityID) === Number(act.classActivityID) && Number(s.studentID) === sid,
        );
        const max = Number(act.maxScore) > 0 ? Number(act.maxScore) : 100;
        let score = null;
        let percent = null;
        let status = 'no_submission';
        if (sub) {
            if (sub.score != null && sub.gradedAt != null) {
                score = Number(sub.score);
                percent = Math.round((score / max) * 10000) / 100;
                status = 'graded';
            } else if (sub.submittedAt) {
                status = 'pending';
            }
        }
        return {
            classActivityID: act.classActivityID,
            title: act.title || 'Untitled',
            assessmentKind: act.assessmentKind || 'activity',
            gradingPeriod: act.gradingPeriod || 'prelim',
            maxScore: max,
            score,
            percent,
            status,
            submittedAt: sub?.submittedAt || null,
            gradedAt: sub?.gradedAt || null,
        };
    });
};

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
                photo: faculty.photo || '',
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
                photo: student.photo || '',
            },
        });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/api/auth/logout', authenticate, (req, res) => {
    return res.json({ ok: true });
});

app.get('/api/user', authenticate, (req, res) => res.json(req.user));

/** Must be registered before `/api/meta/:type` or `dashboard-insights` is captured as :type and 404s. */
app.get('/api/meta/dashboard-insights', authenticate, (req, res) => {
    const db = getDb();
    if (req.user?.role === 'Student') {
        return res.status(403).json({ message: 'Not available.' });
    }
    let studentIds;
    if (req.user?.role === 'Faculty') {
        const keys = facultyManagedSectionKeys(db, Number(req.user.id));
        if (!keys.size) {
            return res.json({
                topSkills: [],
                pendingViolations: 0,
                resolvedViolations: 0,
                recentViolations: [],
                totalViolations: 0,
            });
        }
        const studs = db.students.filter((s) => studentInFacultyManagedSections(s, keys));
        studentIds = new Set(studs.map((s) => s.studentID));
    } else {
        studentIds = new Set(db.students.map((s) => s.studentID));
    }

    const skillCounts = {};
    (db.skills || []).forEach((sk) => {
        if (!studentIds.has(sk.studentID)) return;
        const name = sk.skillName || sk.name || 'Unknown';
        skillCounts[name] = (skillCounts[name] || 0) + 1;
    });
    const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    const allViolations = [];
    (db.violations || []).forEach((v) => {
        if (!studentIds.has(v.studentID)) return;
        const st = db.students.find((s) => s.studentID === v.studentID);
        const studentName = st ? `${st.lastName}, ${st.firstName}` : `ID ${v.studentID}`;
        allViolations.push({ ...v, studentName });
    });
    const pendingViolations = allViolations.filter((v) => v.status === 'Pending').length;
    const resolvedViolations = allViolations.filter((v) => v.status === 'Resolved').length;
    const recentViolations = [...allViolations]
        .sort(
            (a, b) =>
                new Date(b.violationDate || b.dateReported || b.created_at || 0) -
                new Date(a.violationDate || a.dateReported || a.created_at || 0),
        )
        .slice(0, 3)
        .map((v) => ({
            violationID: v.violationID,
            studentID: v.studentID,
            studentName: v.studentName,
            violationType: v.violationType || v.type,
            severity: v.severity || v.severityLevel || 'Minor',
            status: v.status,
            violationDate: v.violationDate || v.dateReported,
            created_at: v.created_at,
        }));

    return res.json({
        topSkills,
        pendingViolations,
        resolvedViolations,
        recentViolations,
        totalViolations: allViolations.length,
    });
});

// --- META ENDPOINTS (Departments, Courses, Faculty) ---
app.get('/api/meta/:type', authenticate, (req, res) => {
    const db = getDb();
    const type = req.params.type;
    if (!db[type]) return res.status(404).json({ error: 'Not found' });
    if (type === 'faculty') {
        if (req.user?.role === 'Faculty') {
            const row = db.faculty.find((f) => f.facultyID === Number(req.user.id));
            return res.json(row ? [omitPassword(row)] : []);
        }
        return res.json(db.faculty.map(omitPassword));
    }
    if (type === 'courses' && req.user?.role === 'Faculty') {
        const allowed = new Set();
        const f = db.faculty.find((x) => x.facultyID === Number(req.user.id));
        if (f?.courseID != null) allowed.add(Number(f.courseID));
        (db.teachingLoads || []).forEach((tl) => {
            if (Number(tl.facultyID) === Number(req.user.id) && tl.courseID != null) {
                allowed.add(Number(tl.courseID));
            }
        });
        if (!allowed.size) return res.json([]);
        return res.json(db.courses.filter((c) => allowed.has(Number(c.courseID))));
    }
    if (type === 'departments' && req.user?.role === 'Faculty') {
        const f = db.faculty.find((x) => x.facultyID === Number(req.user.id));
        if (!f?.departmentID) return res.json([]);
        return res.json(db.departments.filter((d) => Number(d.departmentID) === Number(f.departmentID)));
    }
    return res.json(db[type]);
});

app.post('/api/meta/:type', authenticate, (req, res) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Only administrators can create directory records.' });
    }
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
    const { type, id } = req.params;
    if (req.user?.role === 'Student') {
        return res.status(403).json({ message: 'Not allowed.' });
    }
    if (req.user?.role === 'Faculty') {
        if (type !== 'faculty' || Number(id) !== Number(req.user.id)) {
            return res.status(403).json({ message: 'You can only update your own faculty profile.' });
        }
    }
    const db = getDb();
    if (!db[type]) return res.status(404).json({ error: 'Not found' });
    
    const idKey = type.replace(/s$/, '') + 'ID';
    const idx = db[type].findIndex(item => item[idKey] == id);
    if (idx === -1) return res.status(404).json({ error: 'Item not found' });

    let body = { ...req.body };
    if (req.user?.role === 'Faculty' && type === 'faculty' && Number(id) === Number(req.user.id)) {
        delete body.courseID;
        delete body.section;
        delete body.departmentID;
    }

    db[type][idx] = { ...db[type][idx], ...body, [idKey]: Number(id) };
    saveDb(db);
    return res.json(db[type][idx]);
});

app.delete('/api/meta/:type/:id', authenticate, (req, res) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Only administrators can delete directory records.' });
    }
    const db = getDb();
    const { type, id } = req.params;
    if (!db[type]) return res.status(404).json({ error: 'Not found' });
    
    const idKey = type.replace(/s$/, '') + 'ID';
    db[type] = db[type].filter(item => item[idKey] != id);
    saveDb(db);
    return res.json({ ok: true });
});

const assertFacultyMayAccessStudent = (db, req, studentId) => {
    if (req.user?.role !== 'Faculty') return { ok: true };
    const student = db.students.find((s) => s.studentID === Number(studentId));
    if (!student) return { ok: false, status: 404, msg: 'Student not found' };
    const keys = facultyManagedSectionKeys(db, Number(req.user.id));
    if (!keys.size || !studentInFacultyManagedSections(student, keys)) {
        return { ok: false, status: 403, msg: 'You can only access students in your assigned sections.' };
    }
    return { ok: true };
};

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
  const sid = Number(studentId);
  if (req.user?.role === 'Student' && Number(req.user.id) !== sid) {
    return res.status(403).json({ message: 'You can only update your own profile.' });
  }
  const facCheck = assertFacultyMayAccessStudent(db, req, studentId);
  if (!facCheck.ok) return res.status(facCheck.status).json({ error: facCheck.msg });
  if (req.user?.role === 'Faculty') {
    return res.status(403).json({ message: 'Faculty cannot add student sub-records.' });
  }
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
  const sid = Number(studentId);
  if (req.user?.role === 'Student' && Number(req.user.id) !== sid) {
    return res.status(403).json({ message: 'You can only update your own profile.' });
  }
  const facCheck = assertFacultyMayAccessStudent(db, req, studentId);
  if (!facCheck.ok) return res.status(facCheck.status).json({ error: facCheck.msg });
  if (req.user?.role === 'Faculty') {
    return res.status(403).json({ message: 'Faculty cannot edit student sub-records.' });
  }
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
  const sid = Number(studentId);
  if (req.user?.role === 'Student' && Number(req.user.id) !== sid) {
    return res.status(403).json({ message: 'You can only update your own profile.' });
  }
  const facCheck = assertFacultyMayAccessStudent(db, req, studentId);
  if (!facCheck.ok) return res.status(facCheck.status).json({ error: facCheck.msg });
  if (req.user?.role === 'Faculty') {
    return res.status(403).json({ message: 'Faculty cannot delete student sub-records.' });
  }
  db[collection] = (db[collection] || []).filter(i => !(i[meta.idKey] == id && i[meta.parentKey] == studentId));
  saveDb(db);
  return res.json({ ok: true });
});

// --- STUDENTS ENDPOINTS ---
app.get('/api/students', authenticate, (req, res) => {
    const db = getDb();
    if (req.user?.role === 'Student') {
        const me = db.students.find((s) => s.studentID === Number(req.user.id));
        const row = me ? omitPassword(me) : null;
        return res.json(row ? [row] : []);
    }
    let studs;
    if (req.user?.role === 'Faculty') {
        const keys = facultyManagedSectionKeys(db, Number(req.user.id));
        if (!keys.size) {
            return res.json([]);
        }
        studs = db.students.filter((s) => studentInFacultyManagedSections(s, keys));
    } else {
        studs = [...db.students];
    }
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
    if (req.user?.role === 'Student' && Number(req.user.id) !== id) {
        return res.status(403).json({ error: 'You can only view your own profile.' });
    }
    if (req.user?.role === 'Faculty') {
        const keys = facultyManagedSectionKeys(db, Number(req.user.id));
        if (!keys.size || !studentInFacultyManagedSections(student, keys)) {
            return res.status(403).json({ error: 'You can only view students in your assigned sections.' });
        }
    }

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
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Only administrators can create student records.' });
    }
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
    if (req.user?.role === 'Faculty') {
        return res.status(403).json({ message: 'Faculty cannot edit student directory records.' });
    }
    if (req.user?.role === 'Student') {
        return res.status(403).json({
            message: 'Students cannot edit full directory records here. Use profile sections or contact MIS.',
        });
    }
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
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Only administrators can delete student records.' });
    }
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

/** MIS assigns class lines (subject + program section) to a faculty member. */
app.post('/api/admin/teaching-loads', authenticate, requireAdmin, (req, res) => {
    const db = getDb();
    const facultyID = Number(req.body?.facultyID);
    const courseID = Number(req.body?.courseID);
    const section = String(req.body?.section || '').trim();
    const subjectCode = String(req.body?.subjectCode || '').trim();
    const subjectTitle = String(req.body?.subjectTitle || '').trim();
    const fac = db.faculty.find((f) => f.facultyID === facultyID);
    if (!fac) return res.status(400).json({ message: 'Faculty not found.' });
    if (!Number.isFinite(courseID)) return res.status(400).json({ message: 'Valid course (program) is required.' });
    if (!section) return res.status(400).json({ message: 'Section is required.' });
    if (!subjectCode || !subjectTitle) {
        return res.status(400).json({ message: 'Subject code and title are required.' });
    }
    const arr = db.teachingLoads || (db.teachingLoads = []);
    const row = {
        teachingLoadID: nextAutoId(arr, 'teachingLoadID'),
        facultyID,
        courseID,
        section,
        subjectCode,
        subjectTitle,
    };
    arr.push(row);
    saveDb(db);
    return res.status(201).json(row);
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

app.post('/api/faculty/teaching-loads', authenticate, (req, res) =>
    res.status(403).json({
        message: 'Only MIS/Admin can assign classes or subjects to faculty. Use the provisioning console.',
    }),
);

app.get('/api/me/activities', authenticate, (req, res) => {
    const db = getDb();
    const role = req.user?.role;
    const uid = Number(req.user?.id);
    const students = db.students || [];
    if (role === 'Faculty') {
        const myLoadIds = new Set(
            (db.teachingLoads || []).filter((t) => Number(t.facultyID) === uid).map((t) => Number(t.teachingLoadID)),
        );
        const acts = (db.classActivities || []).filter((a) => myLoadIds.has(Number(a.teachingLoadID)));
        const subs = db.classActivitySubmissions || [];
        const out = acts.map((a) => {
            const n = normActivityFields(a);
            const related = subs.filter((s) => Number(s.classActivityID) === Number(n.classActivityID));
            const submissions = related.map((sub) => {
                const st = students.find((x) => x.studentID === sub.studentID);
                return {
                    ...sub,
                    studentName: st ? `${st.firstName} ${st.lastName}`.trim() : `Student #${sub.studentID}`,
                };
            });
            return {
                ...n,
                id: n.classActivityID,
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
            const n = normActivityFields(a);
            const my = subs.find(
                (s) => Number(s.classActivityID) === Number(n.classActivityID) && Number(s.studentID) === uid,
            );
            return { ...n, id: n.classActivityID, mySubmission: my || null };
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
    const gp = String(req.body?.gradingPeriod || 'prelim').toLowerCase();
    const ak = String(req.body?.assessmentKind || 'activity').toLowerCase();
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
        gradingPeriod: GRADING_PERIODS.has(gp) ? gp : 'prelim',
        assessmentKind: ASSESSMENT_KINDS.has(ak) ? ak : 'activity',
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
    if (sub && sub.submittedAt) {
        return res.status(400).json({ message: 'You have already submitted. You cannot submit again.' });
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

app.get('/api/faculty/teaching-loads/:id/classroom', authenticate, requireFaculty, (req, res) => {
    const db = getDb();
    const chk = assertFacultyOwnsTeachingLoad(db, req, req.params.id);
    if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });
    const tl = chk.tl;
    const students = (db.students || []).filter((s) => studentMatchesLoad(s, tl)).map(omitPassword);
    const crs = db.courses.find((c) => Number(c.courseID) === Number(tl.courseID));
    const materials = (db.sectionMaterials || []).filter((m) => Number(m.teachingLoadID) === Number(tl.teachingLoadID));
    const subsAll = db.classActivitySubmissions || [];
    const activities = (db.classActivities || [])
        .filter((a) => Number(a.teachingLoadID) === Number(tl.teachingLoadID))
        .map((a) => {
            const n = normActivityFields(a);
            const related = subsAll.filter((s) => Number(s.classActivityID) === Number(n.classActivityID));
            const submissions = related.map((sub) => {
                const st = students.find((x) => x.studentID === sub.studentID);
                return {
                    ...sub,
                    studentName: st ? `${st.firstName} ${st.lastName}`.trim() : `Student #${sub.studentID}`,
                };
            });
            const rosterStatus = students.map((st) => {
                const sub = related.find((s) => Number(s.studentID) === Number(st.studentID));
                return {
                    studentID: st.studentID,
                    studentName: `${st.lastName}, ${st.firstName}`.trim(),
                    submitted: !!(sub && sub.submittedAt),
                    graded: !!(sub && sub.gradedAt),
                    score: sub?.score ?? null,
                };
            });
            return { ...n, id: n.classActivityID, submissions, rosterStatus };
        });
    return res.json({
        teachingLoad: {
            ...tl,
            id: tl.teachingLoadID,
            courseCode: crs?.courseCode || '',
            courseName: crs?.courseName || '',
        },
        students,
        materials,
        activities,
    });
});

app.get('/api/student/teaching-loads/:id/classroom', authenticate, requireStudent, (req, res) => {
    const db = getDb();
    const chk = assertStudentEnrolledInTeachingLoad(db, req, req.params.id);
    if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });
    const tl = chk.tl;
    const sid = Number(req.user.id);
    const crs = db.courses.find((c) => Number(c.courseID) === Number(tl.courseID));
    const materials = (db.sectionMaterials || []).filter((m) => Number(m.teachingLoadID) === Number(tl.teachingLoadID));
    const subsAll = db.classActivitySubmissions || [];
    const activities = (db.classActivities || [])
        .filter((a) => Number(a.teachingLoadID) === Number(tl.teachingLoadID))
        .map((a) => {
            const n = normActivityFields(a);
            const my = subsAll.find(
                (s) => Number(s.classActivityID) === Number(n.classActivityID) && Number(s.studentID) === sid,
            );
            return { ...n, id: n.classActivityID, mySubmission: my || null };
        });
    const classmates = (db.students || [])
        .filter((s) => studentMatchesLoad(s, tl))
        .map((s) => ({
            studentID: s.studentID,
            firstName: s.firstName,
            lastName: s.lastName,
        }))
        .sort((a, b) =>
            String(a.lastName).localeCompare(String(b.lastName)) || String(a.firstName).localeCompare(String(b.firstName)),
        );
    return res.json({
        teachingLoad: {
            ...tl,
            id: tl.teachingLoadID,
            courseCode: crs?.courseCode || '',
            courseName: crs?.courseName || '',
        },
        classmates,
        materials,
        activities,
    });
});

app.get('/api/faculty/teaching-loads/:id/gradebook', authenticate, requireFaculty, (req, res) => {
    const db = getDb();
    const chk = assertFacultyOwnsTeachingLoad(db, req, req.params.id);
    if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });
    const tl = chk.tl;
    const schoolYear = String(req.query.schoolYear || '2025-2026');
    const semester = Number(req.query.semester) === 2 ? 2 : 1;
    const students = (db.students || []).filter((s) => studentMatchesLoad(s, tl));
    const weights = { activity: 0.2, attendance: 0.1, quiz: 0.2, exam: 0.5 };
    const rows = students.map((st) => computeGradebookRowForStudent(db, tl, st, schoolYear, semester));
    return res.json({
        schoolYear,
        semester,
        weights,
        weightsNote:
            'Period grade = 20% activities + 10% attendance + 20% quizzes + 50% exams (each 0–100). Quiz/exam posted as graded activities override manual inputs when present.',
        students: rows,
    });
});

app.get('/api/student/teaching-loads/:id/gradebook', authenticate, requireStudent, (req, res) => {
    const db = getDb();
    const chk = assertStudentEnrolledInTeachingLoad(db, req, req.params.id);
    if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });
    const tl = chk.tl;
    const sid = Number(req.user.id);
    const me = (db.students || []).find((s) => Number(s.studentID) === sid);
    if (!me) return res.status(404).json({ message: 'Student not found.' });
    const schoolYear = String(req.query.schoolYear || '2025-2026');
    const semester = Number(req.query.semester) === 2 ? 2 : 1;
    const weights = { activity: 0.2, attendance: 0.1, quiz: 0.2, exam: 0.5 };
    const row = computeGradebookRowForStudent(db, tl, me, schoolYear, semester);
    const assessmentItems = computeStudentAssessmentItems(db, tl, sid);
    return res.json({
        schoolYear,
        semester,
        weights,
        weightsNote:
            'Period grade = 20% activities + 10% attendance + 20% quizzes + 50% exams (each 0–100). Quiz/exam posted as graded activities override manual inputs when present.',
        student: row,
        assessmentItems,
    });
});

app.put('/api/faculty/teaching-loads/:id/gradebook', authenticate, requireFaculty, (req, res) => {
    const db = getDb();
    const chk = assertFacultyOwnsTeachingLoad(db, req, req.params.id);
    if (!chk.ok) return res.status(chk.status).json({ message: chk.msg });
    const tlId = Number(req.params.id);
    const studentID = Number(req.body?.studentID);
    const schoolYear = String(req.body?.schoolYear || '2025-2026');
    const semester = Number(req.body?.semester) === 2 ? 2 : 1;
    const period = String(req.body?.period || '').toLowerCase();
    if (!studentID) return res.status(400).json({ message: 'studentID is required.' });
    if (!GRADING_PERIODS.has(period)) {
        return res.status(400).json({ message: 'period must be prelim, midterm, or finals.' });
    }
    const roster = (db.students || []).filter((s) => studentMatchesLoad(s, chk.tl));
    if (!roster.some((s) => Number(s.studentID) === studentID)) {
        return res.status(400).json({ message: 'Student is not in this class section.' });
    }
    const clamp = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.min(100, n));
    };
    const row = upsertPeriodGradeRow(db, tlId, studentID, schoolYear, semester, period, {
        attendancePct: clamp(req.body?.attendancePct),
        quizPct: clamp(req.body?.quizPct),
        examPct: clamp(req.body?.examPct),
    });
    saveDb(db);
    return res.json(row);
});

app.listen(PORT, () => {
    console.log(`Node/JSON Backend running on http://localhost:${PORT}`);
    console.log('MIS admin routes: POST /api/admin/students, POST /api/admin/faculty');
    console.log('Workspace: /api/me/assignments, /api/me/activities, /api/me/materials, …');
});
