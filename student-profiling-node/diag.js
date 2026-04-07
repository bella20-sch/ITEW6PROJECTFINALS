const fs = require('fs');
const path = require('path');
const db = JSON.parse(fs.readFileSync('database.json', 'utf8'));

const studs = db.students.map(s => ({
    ...s,
    skills: (db.skills || []).filter(sk => sk.studentID === s.studentID),
    violations: (db.violations || []).filter(v => v.studentID === s.studentID),
}));

const s2 = studs.find(x => x.studentID === 2);
console.log('Student 2:', JSON.stringify(s2, null, 2));

const allViolations = [];
studs.forEach(p => {
    (p.violations || []).forEach(v => {
        allViolations.push({ ...v, studentID: p.studentID, studentName: `${p.lastName}, ${p.firstName}` });
    });
});
console.log('Total Violations:', allViolations.length);
