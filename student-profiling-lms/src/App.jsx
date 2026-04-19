import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import NonAdminLayout from './components/NonAdminLayout'
import MisLayout from './components/MisLayout'
import RequireAuth from './components/RequireAuth'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentAdd from './pages/StudentAdd'
import StudentEdit from './pages/StudentEdit'
import StudentProfile from './pages/StudentProfile'
import Courses from './pages/Courses'
import Faculty from './pages/Faculty'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Admin from './pages/Admin'
import RequireAdmin from './components/RequireAdmin'
import RequireRole from './components/RequireRole'
import Workspace from './pages/Workspace'
import FacultyMyClasses from './pages/FacultyMyClasses'
import FacultyClassSection from './pages/FacultyClassSection'
import FacultyClassActivity from './pages/FacultyClassActivity'
import FacultyClassStudent from './pages/FacultyClassStudent'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/mis"
        element={
          <RequireAuth>
            <RequireAdmin>
              <MisLayout />
            </RequireAdmin>
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="provision" element={<Admin />} />
        <Route path="students" element={<Students />} />
        <Route
          path="students/new"
          element={
            <RequireAdmin>
              <StudentAdd />
            </RequireAdmin>
          }
        />
        <Route
          path="students/:id/edit"
          element={
            <RequireAdmin>
              <StudentEdit />
            </RequireAdmin>
          }
        />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="courses" element={<Courses />} />
        <Route path="faculty/:id" element={<Faculty />} />
        <Route path="faculty" element={<Faculty />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <Navigate to="/mis/provision" replace />
            </RequireAdmin>
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <NonAdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route
          path="students/new"
          element={
            <RequireAdmin>
              <StudentAdd />
            </RequireAdmin>
          }
        />
        <Route
          path="students/:id/edit"
          element={
            <RequireAdmin>
              <StudentEdit />
            </RequireAdmin>
          }
        />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="courses" element={<RequireRole roles={['Admin', 'Faculty']}><Courses /></RequireRole>} />
        <Route path="faculty/:id" element={<RequireRole roles={['Admin', 'Faculty']}><Faculty /></RequireRole>} />
        <Route path="faculty" element={<RequireRole roles={['Admin', 'Faculty']}><Faculty /></RequireRole>} />
        <Route path="reports" element={<RequireRole roles={['Admin']}><Reports /></RequireRole>} />
        <Route path="workspace" element={<RequireRole roles={['Faculty', 'Student']}><Workspace /></RequireRole>} />
        <Route
          path="my-classes/:teachingLoadId/activities/:activityId"
          element={
            <RequireRole roles={['Faculty']}>
              <FacultyClassActivity />
            </RequireRole>
          }
        />
        <Route
          path="my-classes/:teachingLoadId/students/:studentId"
          element={
            <RequireRole roles={['Faculty']}>
              <FacultyClassStudent />
            </RequireRole>
          }
        />
        <Route
          path="my-classes/:teachingLoadId"
          element={
            <RequireRole roles={['Faculty']}>
              <FacultyClassSection />
            </RequireRole>
          }
        />
        <Route path="my-classes" element={<RequireRole roles={['Faculty']}><FacultyMyClasses /></RequireRole>} />
      </Route>
    </Routes>
  )
}
