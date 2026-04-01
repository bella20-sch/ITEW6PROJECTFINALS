import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentProfile from './pages/StudentProfile'
import Departments from './pages/Departments'
import Courses from './pages/Courses'
import Faculty from './pages/Faculty'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Admin from './pages/Admin'
import RequireAdmin from './components/RequireAdmin'
import Workspace from './pages/Workspace'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="departments" element={<Departments />} />
        <Route path="courses" element={<Courses />} />
        <Route path="faculty" element={<Faculty />} />
        <Route path="reports" element={<Reports />} />
        <Route path="workspace" element={<Workspace />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
      </Route>
    </Routes>
  )
}
