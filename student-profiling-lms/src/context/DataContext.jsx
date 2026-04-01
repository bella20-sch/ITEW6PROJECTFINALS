import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { token, isAuthenticated } = useAuth()

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
        setReady(false)
        setDepartments([])
        setCourses([])
        setFaculty([])
        setStudents([])
        setProfiles({})
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
      } catch {
        if (cancelled) return
        setReady(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [isAuthenticated, token])

  const fetchStudentProfile = async (studentID) => {
    const id = Number(studentID)
    const p = await apiFetch(`/api/students/${id}`, { token })
    setProfiles(prev => ({ ...prev, [id]: p }))
    return p
  }

  const crud = useMemo(() => ({
    departments: {
      getAll: () => departments,
      create: async (payload) => {
        const created = await apiFetch('/api/meta/departments', { token, method: 'POST', body: payload })
        setDepartments(prev => [...prev, created])
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/meta/departments/${Number(id)}`, { token, method: 'PUT', body: payload })
        setDepartments(prev => prev.map(d => d.departmentID === updated.departmentID ? updated : d))
        return updated
      },
      delete: async (id) => {
        const did = Number(id)
        await apiFetch(`/api/meta/departments/${did}`, { token, method: 'DELETE' })
        setDepartments(prev => prev.filter(d => d.departmentID !== did))
      },
    },
    courses: {
      getAll: () => courses,
      create: async (payload) => {
        const created = await apiFetch('/api/meta/courses', { token, method: 'POST', body: payload })
        setCourses(prev => [...prev, created])
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/meta/courses/${Number(id)}`, { token, method: 'PUT', body: payload })
        setCourses(prev => prev.map(c => c.courseID === updated.courseID ? updated : c))
        return updated
      },
      delete: async (id) => {
        const cid = Number(id)
        await apiFetch(`/api/meta/courses/${cid}`, { token, method: 'DELETE' })
        setCourses(prev => prev.filter(c => c.courseID !== cid))
      },
    },
    faculty: {
      getAll: () => faculty,
      create: async (payload) => {
        const created = await apiFetch('/api/meta/faculty', { token, method: 'POST', body: payload })
        setFaculty(prev => [...prev, created])
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/meta/faculty/${Number(id)}`, { token, method: 'PUT', body: payload })
        setFaculty(prev => prev.map(f => f.facultyID === updated.facultyID ? updated : f))
        return updated
      },
      delete: async (id) => {
        const fid = Number(id)
        await apiFetch(`/api/meta/faculty/${fid}`, { token, method: 'DELETE' })
        setFaculty(prev => prev.filter(f => f.facultyID !== fid))
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
        return created
      },
      update: async (id, payload) => {
        const updated = await apiFetch(`/api/students/${Number(id)}`, { token, method: 'PUT', body: payload })
        setStudents(prev => prev.map(s => s.studentID === updated.studentID ? updated : s))
        setProfiles(prev => ({ ...prev, [updated.studentID]: updated }))
        return updated
      },
      delete: async (id) => {
        const sid = Number(id)
        await apiFetch(`/api/students/${sid}`, { token, method: 'DELETE' })
        setStudents(prev => prev.filter(s => s.studentID !== sid))
        setProfiles(prev => {
          const next = { ...prev }
          delete next[sid]
          return next
        })
      },
    },
  }), [departments, courses, faculty, students, profiles, token])

  return (
    <DataContext.Provider value={{ ready, departments, courses, faculty, students, crud }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
