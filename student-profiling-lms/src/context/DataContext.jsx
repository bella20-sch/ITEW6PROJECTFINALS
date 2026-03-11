import { createContext, useContext, useState } from 'react'
import {
  initialDepartments, initialCourses, initialFaculty, initialStudents,
  initialAcademicHistory, initialMedicalHistory, initialGuardians,
  initialSkills, initialAffiliations, initialViolations,
} from '../data/initialData'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [courses, setCourses] = useState(initialCourses)
  const [faculty, setFaculty] = useState(initialFaculty)
  const [students, setStudents] = useState(initialStudents)
  const [academicHistory, setAcademicHistory] = useState(initialAcademicHistory)
  const [medicalHistory, setMedicalHistory] = useState(initialMedicalHistory)
  const [guardians, setGuardians] = useState(initialGuardians)
  const [skills, setSkills] = useState(initialSkills)
  const [affiliations, setAffiliations] = useState(initialAffiliations)
  const [violations, setViolations] = useState(initialViolations)

  const nextId = (items, key) => Math.max(0, ...items.map(i => i[key])) + 1

  // Helpers to get related data for a student
  const getStudentProfile = (studentID) => {
    const student = students.find(s => s.studentID === Number(studentID))
    if (!student) return null
    return {
      ...student,
      academicHistory: academicHistory.filter(a => a.studentID === student.studentID),
      medicalHistory: medicalHistory.filter(m => m.studentID === student.studentID),
      guardians: guardians.filter(g => g.studentID === student.studentID),
      skills: skills.filter(s => s.studentID === student.studentID),
      affiliations: affiliations.filter(a => a.studentID === student.studentID),
      violations: violations.filter(v => v.studentID === student.studentID),
    }
  }

  const crud = {
    departments: {
      getAll: () => departments,
      create: (d) => setDepartments(prev => [...prev, { ...d, departmentID: nextId(prev, 'departmentID') }]),
      update: (id, d) => setDepartments(prev => prev.map(x => x.departmentID === id ? { ...x, ...d } : x)),
      delete: (id) => {
        setDepartments(prev => prev.filter(x => x.departmentID !== id))
        setCourses(prev => prev.filter(x => x.departmentID !== id))
        setFaculty(prev => prev.filter(x => x.departmentID !== id))
        setStudents(prev => prev.filter(x => x.departmentID !== id))
      },
    },
    courses: {
      getAll: () => courses,
      create: (c) => setCourses(prev => [...prev, { ...c, courseID: nextId(prev, 'courseID') }]),
      update: (id, c) => setCourses(prev => prev.map(x => x.courseID === id ? { ...x, ...c } : x)),
      delete: (id) => setCourses(prev => prev.filter(x => x.courseID !== id)),
    },
    faculty: {
      getAll: () => faculty,
      create: (f) => setFaculty(prev => [...prev, { ...f, facultyID: nextId(prev, 'facultyID') }]),
      update: (id, f) => setFaculty(prev => prev.map(x => x.facultyID === id ? { ...x, ...f } : x)),
      delete: (id) => setFaculty(prev => prev.filter(x => x.facultyID !== id)),
    },
    students: {
      getAll: () => students,
      getOne: (id) => getStudentProfile(id),
      create: (s) => setStudents(prev => [...prev, { ...s, studentID: nextId(prev, 'studentID') }]),
      update: (id, s) => setStudents(prev => prev.map(x => x.studentID === id ? { ...x, ...s } : x)),
      delete: (id) => {
        setStudents(prev => prev.filter(x => x.studentID !== id))
        setAcademicHistory(prev => prev.filter(x => x.studentID !== id))
        setMedicalHistory(prev => prev.filter(x => x.studentID !== id))
        setGuardians(prev => prev.filter(x => x.studentID !== id))
        setSkills(prev => prev.filter(x => x.studentID !== id))
        setAffiliations(prev => prev.filter(x => x.studentID !== id))
        setViolations(prev => prev.filter(x => x.studentID !== id))
      },
    },
    academicHistory: {
      add: (a) => setAcademicHistory(prev => [...prev, { ...a, academicID: nextId(prev, 'academicID') }]),
      update: (id, a) => setAcademicHistory(prev => prev.map(x => x.academicID === id ? { ...x, ...a } : x)),
      delete: (id) => setAcademicHistory(prev => prev.filter(x => x.academicID !== id)),
    },
    medicalHistory: {
      add: (m) => setMedicalHistory(prev => [...prev, { ...m, medicalID: nextId(prev, 'medicalID') }]),
      update: (id, m) => setMedicalHistory(prev => prev.map(x => x.medicalID === id ? { ...x, ...m } : x)),
      delete: (id) => setMedicalHistory(prev => prev.filter(x => x.medicalID !== id)),
    },
    guardians: {
      add: (g) => setGuardians(prev => [...prev, { ...g, guardianID: nextId(prev, 'guardianID') }]),
      update: (id, g) => setGuardians(prev => prev.map(x => x.guardianID === id ? { ...x, ...g } : x)),
      delete: (id) => setGuardians(prev => prev.filter(x => x.guardianID !== id)),
    },
    skills: {
      add: (s) => setSkills(prev => [...prev, { ...s, skillID: nextId(prev, 'skillID') }]),
      update: (id, s) => setSkills(prev => prev.map(x => x.skillID === id ? { ...x, ...s } : x)),
      delete: (id) => setSkills(prev => prev.filter(x => x.skillID !== id)),
    },
    affiliations: {
      add: (a) => setAffiliations(prev => [...prev, { ...a, affiliationID: nextId(prev, 'affiliationID') }]),
      update: (id, a) => setAffiliations(prev => prev.map(x => x.affiliationID === id ? { ...x, ...a } : x)),
      delete: (id) => setAffiliations(prev => prev.filter(x => x.affiliationID !== id)),
    },
    violations: {
      add: (v) => setViolations(prev => [...prev, { ...v, violationID: nextId(prev, 'violationID') }]),
      update: (id, v) => setViolations(prev => prev.map(x => x.violationID === id ? { ...x, ...v } : x)),
      delete: (id) => setViolations(prev => prev.filter(x => x.violationID !== id)),
    },
  }

  return (
    <DataContext.Provider value={{ departments, courses, faculty, students, academicHistory, medicalHistory, guardians, skills, affiliations, violations, crud }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
