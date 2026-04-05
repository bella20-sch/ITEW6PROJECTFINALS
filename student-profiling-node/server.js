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
app.use(express.json());

// Load database helper
const getDb = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const saveDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');

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

// --- AUTH ROUTE ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDb();
    const admin = db.admins.find(a => a.email === email && a.password === password);
    if (admin) {
        const token = jwt.sign({ id: admin.adminID, role: 'Admin', email: admin.email }, SECRET_KEY, { expiresIn: '1d' });
        return res.json({ token, user: { id: admin.adminID, name: admin.firstName, role: 'Admin' } });
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
    if (db[type]) return res.json(db[type]);
    return res.status(404).json({ error: 'Not found' });
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
    const { search, section, courseID, skill } = req.query;

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

    if (skill) {
        const sq = skill.toLowerCase();
        const studentIdsWithSkill = new Set(
            db.skills.filter(sk => sk.skillName.toLowerCase().includes(sq)).map(sk => sk.studentID)
        );
        studs = studs.filter(s => studentIdsWithSkill.has(s.studentID));
    }

    return res.json(studs.sort((a,b) => a.lastName.localeCompare(b.lastName)));
});

app.get('/api/students/:id', authenticate, (req, res) => {
    const db = getDb();
    const id = Number(req.params.id);
    const student = db.students.find(s => s.studentID === id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    return res.json({
        ...student,
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
    saveDb(db);
    return res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`Node/JSON Backend running on http://localhost:${PORT}`);
});
