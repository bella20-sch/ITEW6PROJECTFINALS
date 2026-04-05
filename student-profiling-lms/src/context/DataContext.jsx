import { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const { showToast } = useToast()

  const [ready, setReady] = useState(false)
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [faculty, setFaculty] = useState([])
  const [students, setStudents] = useState([])
  const [profiles, setProfiles] = useState({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!isAuthenticated || !token) {
        setReady(false); setDepartments([]); setCourses([])
        setFaculty([]); setStudents([]); setProfiles({})
        return
      }
      try {
        const [deps, crs, fac, studs] = await Promise.all([
          apiFetch('/api/meta/departments', { token }),
          apiFetch('/api/meta/courses', { token }),
          apiFetch('/api/meta/faculty', { token }),
          apiFetch('/api/students', { token }),
        ])
        if (cancelled) return
        setDepartments(Array.isArray(deps) ? deps : [])
        setCourses(Array.isArray(crs) ? crs : [])
        setFaculty(Array.isArray(fac) ? fac : [])
        setStudents(Array.isArray(studs) ? studs : [])
        setReady(true)
      } catch { if (!cancelled) setReady(false) }
    }
    load()
    return () => { cancelled = true }
  }, [isAuthenticated, token])

  const fetchStudentProfile = useCallback(async (studentID) => {
    const id = Number(studentID)
    const p = await apiFetch(`/api/students/${id}`, { token })
    setProfiles(prev => ({ ...prev, [id]: p }))
    return p
  }, [token])

  const updateProfileSub = useCallback((studentID, key, updater) => {
    const id = Number(studentID)
    setProfiles(prev => {
      const profile = prev[id]
      if (!profile) return prev
      return { ...prev, [id]: { ...profile, [key]: updater(profile[key] || []) } }
    })
  }, [])

  // Sub-record CRUD
  const subCrud = useMemo(() => {
    const make = (collection, idKey, profileKey, label) => ({
      create: async (studentID, payload) => {
        const item = await apiFetch(`/api/students/${studentID}/${collection}`, { token, method: 'POST', body: payload })
        updateProfileSub(studentID, profileKey, arr => [...arr, item])
        showToast(`${label} added`, 'success')
        return item
      },
      update: async (studentID, id, payload) => {
        const item = await apiFetch(`/api/students/${studentID}/${collection}/${id}`, { token, method: 'PUT', body: payload })
        updateProfileSub(studentID, profileKey, arr => arr.map(x => x[idKey] === item[idKey] ? item : x))
        showToast(`${label} updated`, 'success')
        return item
      },
      delete: async (studentID, id) => {
        await apiFetch(`/api/students/${studentID}/${collection}/${id}`, { token, method: 'DELETE' })
        updateProfileSub(studentID, profileKey, arr => arr.filter(x => x[idKey] !== Number(id)))
        showToast(`${label} deleted`, 'success')
      },
    })
    return {
      skills:       make('skills',       'skillID',       'skills',        'Skill'),
      affiliations: make('affiliations', 'affiliationID', 'affiliations',  'Affiliation'),
      violations:   make('violations',   'violationID',   'violations',    'Violation'),
      activities:   make('activities',   'activityID',    'activities',    'Activity'),
      medical:      make('medical',      'medicalID',     'medicalHistory','Medical record'),
      guardians:    make('guardians',    'guardianID',    'guardians',     'Guardian'),
      academic:     make('academic',     'academicID',    'academicHistory','Academic record'),
    }
  }, [token, showToast, updateProfileSub])

  const crud = useMemo(() => ({
    departments: {
      getAll: () => departments,
      create: async (payload) => {
        const created = await apiFetch('/api/meta/departments', { token, method: 'POST', body: payload })
        setDepartments(prev => [...prev, created])
        showToast('Department created successfully', 'success')
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/meta/departments/${Number(id)}`, { token, method: 'PUT', body: payload })
        setDepartments(prev => prev.map(d => d.departmentID === updated.departmentID ? updated : d))
        showToast('Department updated successfully', 'success')
        return updated
      },
      delete: async (id) => {
        await apiFetch(`/api/meta/departments/${Number(id)}`, { token, method: 'DELETE' })
        setDepartments(prev => prev.filter(d => d.departmentID !== Number(id)))
        showToast('Department deleted', 'success')
      },
    },
    courses: {
      getAll: () => courses,
      create: async (payload) => {
        const created = await apiFetch('/api/meta/courses', { token, method: 'POST', body: payload })
        setCourses(prev => [...prev, created])
        showToast('Course created successfully', 'success')
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/meta/courses/${Number(id)}`, { token, method: 'PUT', body: payload })
        setCourses(prev => prev.map(c => c.courseID === updated.courseID ? updated : c))
        showToast('Course updated successfully', 'success')
        return updated
      },
      delete: async (id) => {
        await apiFetch(`/api/meta/courses/${Number(id)}`, { token, method: 'DELETE' })
        setCourses(prev => prev.filter(c => c.courseID !== Number(id)))
        showToast('Course deleted', 'success')
      },
    },
    faculty: {
      getAll: () => faculty,
      create: async (payload) => {
        const created = await apiFetch('/api/meta/faculty', { token, method: 'POST', body: payload })
        setFaculty(prev => [...prev, created])
        showToast('Faculty created successfully', 'success')
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/meta/faculty/${Number(id)}`, { token, method: 'PUT', body: payload })
        setFaculty(prev => prev.map(f => f.facultyID === updated.facultyID ? updated : f))
        showToast('Faculty updated successfully', 'success')
        return updated
      },
      delete: async (id) => {
        await apiFetch(`/api/meta/faculty/${Number(id)}`, { token, method: 'DELETE' })
        setFaculty(prev => prev.filter(f => f.facultyID !== Number(id)))
        showToast('Faculty deleted', 'success')
      },
    },
    students: {
      getAll: () => students,
      getOne: (id) => profiles[Number(id)] || null,
      fetchOne: fetchStudentProfile,
      create: async (payload) => {
        const created = await apiFetch('/api/students', { token, method: 'POST', body: payload })
        setStudents(prev => [...prev, created])
        setProfiles(prev => ({ ...prev, [created.studentID]: created }))
        showToast('Student profile created successfully', 'success')
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/students/${Number(id)}`, { token, method: 'PUT', body: payload })
        setStudents(prev => prev.map(s => s.studentID === updated.studentID ? updated : s))
        setProfiles(prev => ({ ...prev, [updated.studentID]: updated }))
        showToast('Student profile updated successfully', 'success')
        return updated
      },
      delete: async (id) => {
        const sid = Number(id)
        await apiFetch(`/api/students/${sid}`, { token, method: 'DELETE' })
        setStudents(prev => prev.filter(s => s.studentID !== sid))
        setProfiles(prev => { const n = { ...prev }; delete n[sid]; return n })
        showToast('Student profile deleted', 'success')
      },
    },
  }), [departments, courses, faculty, students, profiles, token, fetchStudentProfile, showToast])

  return (
    <DataContext.Provider value={{ ready, departments, courses, faculty, students, crud, subCrud, profiles }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
