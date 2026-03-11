import React from 'react'
import Modal from './Modal'

const defaultStudent = {
  firstName: '', middleName: '', lastName: '', suffix: '', gender: 'Male', birthDate: '', birthPlace: '',
  nationality: 'Filipino', civilStatus: 'Single', contactNumber: '', email: '', address: '',
  yearLevel: 1, section: '', studentType: 'Regular', enrollmentStatus: 'Enrolled', dateEnrolled: '',
  courseID: '', departmentID: '',
}

export default function StudentFormModal({ open, onClose, courses, departments, student, onSave }) {
  const isEdit = !!student
  const form = student ? { ...defaultStudent, ...student } : { ...defaultStudent, courseID: courses[0]?.courseID, departmentID: departments[0]?.departmentID }

  const [data, setData] = React.useState(form)
  React.useEffect(() => { setData(form) }, [open, student, courses, departments])

  const studentFields = ['firstName', 'middleName', 'lastName', 'suffix', 'gender', 'birthDate', 'birthPlace', 'nationality', 'civilStatus', 'contactNumber', 'email', 'address', 'yearLevel', 'section', 'studentType', 'enrollmentStatus', 'dateEnrolled', 'courseID', 'departmentID']
  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {}
    studentFields.forEach(f => {
      let v = data[f]
      if (f === 'courseID' || f === 'departmentID') v = Number(v)
      if (f === 'contactNumber' && v) v = Number(v)
      payload[f] = v
    })
    onSave(payload)
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Edit Student' : 'Add Student'} open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form form-wide">
        <div className="form-section">
          <h4>Basic Info</h4>
          <div className="form-row-2">
            <div><label>First Name *</label><input value={data.firstName} onChange={e => setData({ ...data, firstName: e.target.value })} required /></div>
            <div><label>Middle Name</label><input value={data.middleName} onChange={e => setData({ ...data, middleName: e.target.value })} /></div>
            <div><label>Last Name *</label><input value={data.lastName} onChange={e => setData({ ...data, lastName: e.target.value })} required /></div>
            <div><label>Suffix</label><input value={data.suffix} onChange={e => setData({ ...data, suffix: e.target.value })} placeholder="Jr., III" /></div>
          </div>
          <label>Gender</label>
          <select value={data.gender} onChange={e => setData({ ...data, gender: e.target.value })}>
            <option>Male</option><option>Female</option>
          </select>
          <div className="form-row-2">
            <div><label>Birth Date</label><input type="date" value={data.birthDate} onChange={e => setData({ ...data, birthDate: e.target.value })} /></div>
            <div><label>Birth Place</label><input value={data.birthPlace} onChange={e => setData({ ...data, birthPlace: e.target.value })} /></div>
          </div>
          <label>Nationality</label>
          <input value={data.nationality} onChange={e => setData({ ...data, nationality: e.target.value })} />
          <label>Civil Status</label>
          <select value={data.civilStatus} onChange={e => setData({ ...data, civilStatus: e.target.value })}>
            <option>Single</option><option>Married</option>
          </select>
        </div>
        <div className="form-section">
          <h4>Contact & Address</h4>
          <label>Email *</label>
          <input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} required />
          <label>Contact Number</label>
          <input type="number" value={data.contactNumber} onChange={e => setData({ ...data, contactNumber: e.target.value })} />
          <label>Address</label>
          <input value={data.address} onChange={e => setData({ ...data, address: e.target.value })} />
        </div>
        <div className="form-section">
          <h4>Enrollment</h4>
          <div className="form-row-2">
            <div><label>Year Level</label><input type="number" min="1" value={data.yearLevel} onChange={e => setData({ ...data, yearLevel: Number(e.target.value) })} /></div>
            <div><label>Section</label><input value={data.section} onChange={e => setData({ ...data, section: e.target.value })} /></div>
          </div>
          <label>Student Type</label>
          <select value={data.studentType} onChange={e => setData({ ...data, studentType: e.target.value })}>
            <option>Regular</option><option>Irregular</option><option>Transferee</option>
          </select>
          <label>Enrollment Status</label>
          <select value={data.enrollmentStatus} onChange={e => setData({ ...data, enrollmentStatus: e.target.value })}>
            <option>Enrolled</option><option>Dropped</option><option>Graduated</option>
          </select>
          <label>Date Enrolled</label>
          <input type="date" value={data.dateEnrolled} onChange={e => setData({ ...data, dateEnrolled: e.target.value })} />
          <label>Course</label>
          <select value={data.courseID} onChange={e => setData({ ...data, courseID: e.target.value })} required>
            {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseCode} - {c.courseName}</option>)}
          </select>
          <label>Department</label>
          <select value={data.departmentID} onChange={e => setData({ ...data, departmentID: e.target.value })} required>
            {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  )
}
