import { apiFetch } from './api'

export async function fetchStudentClassroomFallback(token, teachingLoadId, courses) {
  const tlId = Number(teachingLoadId)
  const [assignments, materials, activities] = await Promise.all([
    apiFetch('/api/me/assignments', { token }),
    apiFetch('/api/me/materials', { token }),
    apiFetch('/api/me/activities', { token }),
  ])
  const asg = (assignments || []).find((a) => Number(a.teachingLoadId ?? a.id) === tlId)
  if (!asg) {
    throw new Error('Class not found or you are not enrolled.')
  }
  const crs = (courses || []).find((c) => Number(c.courseID) === Number(asg.courseID))
  const teachingLoad = {
    ...asg,
    id: tlId,
    teachingLoadID: tlId,
    courseCode: crs?.courseCode || '',
    courseName: crs?.courseName || '',
  }
  const mats = (materials || []).filter((m) => Number(m.teachingLoadId ?? m.teachingLoadID) === tlId)
  const acts = (activities || []).filter((a) => Number(a.teachingLoadID ?? a.teachingLoadId) === tlId)
  return {
    teachingLoad,
    classmates: [],
    materials: mats,
    activities: acts,
  }
}

export function isNotFoundError(err) {
  return err?.status === 404
}
