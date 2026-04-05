import React from 'react'
import Modal from './Modal'
import { useToast } from '../context/ToastContext'
import { PH_PROVINCES, citiesForProvince, provinceForMunicipality } from '../data/phProvinceCities'

const SUFFIXES = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V']
const NATIONALITIES = ['Filipino', 'American', 'Chinese', 'Japanese', 'Korean', 'Other']
const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated', 'Other']
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Other']

const defaultStudent = {
  studentNumber: '',
  firstName: '', middleName: '', lastName: '', suffix: '', gender: 'Male',
  birthDate: '', birthProvince: '', birthCity: '',
  nationality: 'Filipino', civilStatus: 'Single', contactNumber: '', email: '',
  streetAddress: '', addressProvince: '', municipality: '',
  yearLevel: 1, section: '', studentType: 'Regular', enrollmentStatus: 'Enrolled',
  dateEnrolled: '', courseID: '', departmentID: '', photo: '',
}

// Migrate old flat address/birthPlace to new fields
function migrateStudent(s) {
  if (!s) return null
  let birthProvince = s.birthProvince || ''
  let birthCity = s.birthCity || ''
  const flat = (s.birthPlace || '').trim()
  if (!birthCity && flat) birthCity = flat
  if (!birthProvince && flat.includes(',')) {
    const idx = flat.lastIndexOf(',')
    const maybeProvince = flat.slice(idx + 1).trim()
    const maybeCity = flat.slice(0, idx).trim()
    if (maybeProvince && PH_PROVINCES.includes(maybeProvince)) {
      birthProvince = maybeProvince
      birthCity = maybeCity
    }
  }
  let addressProvince = s.addressProvince || ''
  const municipality = s.municipality || ''
  if (!addressProvince && municipality) addressProvince = provinceForMunicipality(municipality)

  return {
    ...defaultStudent,
    ...s,
    streetAddress: s.streetAddress || s.address || '',
    municipality,
    addressProvince,
    birthProvince,
    birthCity,
  }
}

export default function StudentFormModal({ open, onClose, courses, departments, student, onSave }) {
  const isEdit = !!student
  const { showToast } = useToast()
  const [data, setData] = React.useState(migrateStudent(student) || { ...defaultStudent, courseID: courses[0]?.courseID, departmentID: departments[0]?.departmentID })
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const prevOpen = React.useRef(false)
  const photoRef = React.useRef(null)

  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setData(student
        ? migrateStudent(student)
        : { ...defaultStudent, courseID: courses[0]?.courseID, departmentID: departments[0]?.departmentID })
      setError('')
    }
    prevOpen.current = open
  }, [open, student, courses, departments])

  const set = (field) => (e) => setData(prev => ({ ...prev, [field]: e.target.value }))

  const birthCitiesForProvince = React.useMemo(
    () => citiesForProvince(data.birthProvince),
    [data.birthProvince],
  )
  const birthCityInList = !data.birthCity || birthCitiesForProvince.includes(data.birthCity)
  const birthCitySelectValue = !data.birthProvince ? '' : (!data.birthCity ? '' : (birthCityInList ? data.birthCity : '__OTHER__'))

  const addressCitiesForProvince = React.useMemo(
    () => citiesForProvince(data.addressProvince),
    [data.addressProvince],
  )
  const addressMuniInList = !data.municipality || addressCitiesForProvince.includes(data.municipality)
  const addressMuniSelectValue = !data.addressProvince ? '' : (!data.municipality ? '' : (addressMuniInList ? data.municipality : '__OTHER__'))

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Photo must be under 2MB.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setData(prev => ({ ...prev, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      ...data,
      address: [data.streetAddress, data.municipality, data.addressProvince].filter(Boolean).join(', '),
      birthPlace: [data.birthCity, data.birthProvince].filter(Boolean).join(', '),
      courseID: Number(data.courseID),
      departmentID: Number(data.departmentID),
    }
    try {
      await onSave(payload)
    } catch (err) {
      showToast(err?.message || 'Save failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Component for select with "Other" option logic
  const SelectWithOther = ({ label, field, options, required, placeholder }) => {
    // If the value is not in options (but not empty), it means "Other" was selected and a value was typed
    const isValueInOptions = options.includes(data[field]);
    const isOtherActive = (data[field] === '__OTHER__') || (!isValueInOptions && data[field] !== '');
    const selectValue = isOtherActive ? 'Other' : (data[field] || '');

    return (
      <div className="form-field" style={{ flex: 1 }}>
        <label>{label}{required ? ' *' : ''}</label>
        <select 
          value={selectValue} 
          onChange={e => {
            if (e.target.value === 'Other') setData(prev => ({ ...prev, [field]: '__OTHER__' }))
            else setData(prev => ({ ...prev, [field]: e.target.value }))
          }}
          required={required}
        >
          <option value="">— Select —</option>
          {options.map(o => {
            if (o === 'Other') return <option key={o} value="Other">Other (Please specify)</option>
            return <option key={o} value={o}>{o}</option>
          })}
        </select>
        {isOtherActive && (
          <input
            value={data[field] === '__OTHER__' ? '' : data[field]}
            onChange={e => setData(prev => ({ ...prev, [field]: e.target.value || '__OTHER__' }))}
            placeholder={placeholder || "Please specify..."}
            style={{ marginTop: 6 }}
            required={required}
            autoFocus
          />
        )}
      </div>
    )
  }

  return (
    <Modal title={isEdit ? 'Edit Student' : 'Add Student'} open={open} onClose={onClose} closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="form form-wide">

        <div className="form-section">
          <h4>Student Photo</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg, #fb923c, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, border: '2px solid #e5e7eb',
            }}>
              {data.photo
                ? <img src={data.photo} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                    {data.firstName?.[0] || '?'}{data.lastName?.[0] || ''}
                  </span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <button type="button" className="btn btn-outline" onClick={() => photoRef.current?.click()}>
                {data.photo ? 'Change Photo' : 'Upload Photo'}
              </button>
              {data.photo && (
                <button type="button" className="btn btn-danger" style={{ marginLeft: 8 }}
                  onClick={() => setData(prev => ({ ...prev, photo: '' }))}>
                  Remove
                </button>
              )}
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>JPG, PNG or GIF · Max 2MB</p>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Basic Info</h4>
          <label>Student Number *</label>
          <input 
            value={data.studentNumber} 
            onChange={set('studentNumber')} 
            placeholder="e.g. 2201631" 
            required 
          />

          <div className="form-row-2">
            <div><label>First Name *</label><input value={data.firstName} onChange={set('firstName')} required /></div>
            <div><label>Middle Name</label><input value={data.middleName} onChange={set('middleName')} /></div>
            <div><label>Last Name *</label><input value={data.lastName} onChange={set('lastName')} required /></div>
            <div>
              <label>Suffix</label>
              <select value={data.suffix} onChange={set('suffix')}>
                {SUFFIXES.map(s => <option key={s} value={s}>{s || '— None —'}</option>)}
              </select>
            </div>
          </div>

          <label>Gender *</label>
          <select value={data.gender} onChange={set('gender')} required>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <label>Birth Date *</label>
          <input type="date" value={data.birthDate} onChange={set('birthDate')} required />

          <div className="form-row-2">
            <div>
              <label>Birth Province *</label>
              <select
                value={data.birthProvince}
                onChange={(e) => {
                  const province = e.target.value
                  setData((prev) => {
                    const cities = citiesForProvince(province)
                    const keep = cities.includes(prev.birthCity)
                    return { ...prev, birthProvince: province, birthCity: keep ? prev.birthCity : '' }
                  })
                }}
                required
              >
                <option value="">— Select Province —</option>
                {PH_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>Birth City / Municipality *</label>
              {!data.birthProvince ? (
                <select disabled value="">
                  <option value="">Select province first</option>
                </select>
              ) : (
                <>
                  <select
                    value={birthCitySelectValue}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '__OTHER__') setData(prev => ({ ...prev, birthCity: '' }))
                      else setData(prev => ({ ...prev, birthCity: v }))
                    }}
                    required={birthCitySelectValue !== '__OTHER__'}
                  >
                    <option value="">— Select City / Municipality —</option>
                    {birthCitiesForProvince.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__OTHER__">Other (specify)</option>
                  </select>
                  {birthCitySelectValue === '__OTHER__' && (
                    <input
                      value={data.birthCity}
                      onChange={(e) => setData(prev => ({ ...prev, birthCity: e.target.value }))}
                      placeholder="City or municipality"
                      required
                      style={{ marginTop: 6 }}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <label>Nationality *</label>
          <select value={data.nationality} onChange={set('nationality')} required>
            <option value="">— Select Nationality —</option>
            {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <label>Civil Status *</label>
          <select value={data.civilStatus} onChange={set('civilStatus')} required>
            <option value="">— Select Status —</option>
            {CIVIL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-section">
          <h4>Contact & Address</h4>
          <label>Email *</label>
          <input type="email" value={data.email} onChange={set('email')} required />
          <label>Contact Number (11-digit or +63...) *</label>
          <input 
            type="tel" 
            value={data.contactNumber} 
            onChange={set('contactNumber')} 
            placeholder="09XXXXXXXXX" 
            pattern="^(09\d{9}|\+63\d{10})$" 
            title="Enter 11-digit number (09XXXXXXXXX) or +63 format" 
            required
          />
          <label>Street / Unit / House No. *</label>
          <input value={data.streetAddress} onChange={set('streetAddress')} placeholder="e.g. 123 Rizal St., Brgy. San Jose" required />
          <div className="form-row-2">
            <div>
              <label>Province *</label>
              <select
                value={data.addressProvince}
                onChange={(e) => {
                  const province = e.target.value
                  setData((prev) => {
                    const cities = citiesForProvince(province)
                    const keep = cities.includes(prev.municipality)
                    return { ...prev, addressProvince: province, municipality: keep ? prev.municipality : '' }
                  })
                }}
                required
              >
                <option value="">— Select Province —</option>
                {PH_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>Municipality / City *</label>
              {!data.addressProvince ? (
                <select disabled value="">
                  <option value="">Select province first</option>
                </select>
              ) : (
                <>
                  <select
                    value={addressMuniSelectValue}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '__OTHER__') setData(prev => ({ ...prev, municipality: '' }))
                      else setData(prev => ({ ...prev, municipality: v }))
                    }}
                    required={addressMuniSelectValue !== '__OTHER__'}
                  >
                    <option value="">— Select Municipality / City —</option>
                    {addressCitiesForProvince.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__OTHER__">Other (specify)</option>
                  </select>
                  {addressMuniSelectValue === '__OTHER__' && (
                    <input
                      value={data.municipality}
                      onChange={(e) => setData(prev => ({ ...prev, municipality: e.target.value }))}
                      placeholder="Municipality or city"
                      required
                      style={{ marginTop: 6 }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Enrollment</h4>
          <div className="form-row-2">
            <div>
              <label>Year Level *</label>
              <select value={data.yearLevel} onChange={e => setData(prev => ({ ...prev, yearLevel: Number(e.target.value) }))} required>
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
                <option value={5}>5th Year</option>
                <option value={6}>6th Year</option>
              </select>
            </div>
            <SelectWithOther label="Section" field="section" options={SECTIONS} required />
          </div>
          <label>Student Type *</label>
          <select value={data.studentType} onChange={set('studentType')} required>
            <option>Regular</option><option>Irregular</option><option>Transferee</option>
          </select>
          <label>Enrollment Status *</label>
          <select value={data.enrollmentStatus} onChange={set('enrollmentStatus')} required>
            <option>Enrolled</option><option>Dropped</option><option>Graduated</option><option>Leave of Absence</option>
          </select>
          <label>Date Enrolled *</label>
          <input type="date" value={data.dateEnrolled} onChange={set('dateEnrolled')} required />
          <label>Course *</label>
          <select value={data.courseID} onChange={set('courseID')} required>
            <option value="">— Select Course —</option>
            {courses.map(c => <option key={c.courseID} value={c.courseID}>{c.courseCode} - {c.courseName}</option>)}
          </select>
          <label>Department *</label>
          <select value={data.departmentID} onChange={set('departmentID')} required>
            <option value="">— Select Department —</option>
            {departments.map(d => <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>)}
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  )
}
