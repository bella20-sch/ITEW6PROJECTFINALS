/**
 * Initial data matching ITEW6 REVISED ERD schema
 */

/* UML: Department.contactNumber is String per diagram */
export const initialDepartments = [
  { departmentID: 1, departmentName: 'Computer Science', officeLocation: 'Building A-201', contactNumber: '1234567890' },
  { departmentID: 2, departmentName: 'Engineering', officeLocation: 'Building B-102', contactNumber: '1234567891' },
  { departmentID: 3, departmentName: 'Humanities', officeLocation: 'Building C-301', contactNumber: '1234567892' },
]

export const initialCourses = [
  { courseID: 1, courseCode: 'BSIT', courseName: 'Bachelor of Science in Information Technology', totalUnits: 180, departmentID: 1 },
  { courseID: 2, courseCode: 'BSCS', courseName: 'Bachelor of Science in Computer Science', totalUnits: 185, departmentID: 1 },
  { courseID: 3, courseCode: 'BSECE', courseName: 'Bachelor of Science in Electronics Engineering', totalUnits: 190, departmentID: 2 },
]

export const initialFaculty = [
  { facultyID: 1, departmentID: 1, firstName: 'Dr. Ana', lastName: 'Reyes', position: 'Professor', employmentStatus: 'Full-time', hireDate: '2015-06-01', email: 'ana.reyes@school.edu', contactNumber: 9876543210, officeLocation: 'A-201' },
  { facultyID: 2, departmentID: 2, firstName: 'Engr. Pedro', lastName: 'Mendoza', position: 'Associate Professor', employmentStatus: 'Full-time', hireDate: '2018-01-15', email: 'pedro.mendoza@school.edu', contactNumber: 9876543211, officeLocation: 'B-102' },
]

export const initialStudents = [
  {
    studentID: 1, firstName: 'Maria', middleName: 'Cruz', lastName: 'Santos', suffix: '',
    gender: 'Female', birthDate: '2006-03-15', birthPlace: 'Manila', nationality: 'Filipino', civilStatus: 'Single',
    contactNumber: 9123456789, email: 'maria.santos@school.edu', address: '123 Main St, Manila',
    yearLevel: 3, section: 'STEM-A', studentType: 'Regular', enrollmentStatus: 'Enrolled', dateEnrolled: '2020-06-01',
    courseID: 1, departmentID: 1,
  },
  {
    studentID: 2, firstName: 'James', middleName: '', lastName: 'Rodriguez', suffix: 'Jr.',
    gender: 'Male', birthDate: '2007-05-22', birthPlace: 'Quezon City', nationality: 'Filipino', civilStatus: 'Single',
    contactNumber: 9123456790, email: 'james.rodriguez@school.edu', address: '456 Oak Ave, QC',
    yearLevel: 2, section: 'STEM-B', studentType: 'Regular', enrollmentStatus: 'Enrolled', dateEnrolled: '2021-06-01',
    courseID: 1, departmentID: 1,
  },
  {
    studentID: 3, firstName: 'Sofia', middleName: 'Lim', lastName: 'Chen', suffix: '',
    gender: 'Female', birthDate: '2006-11-08', birthPlace: 'Cebu City', nationality: 'Filipino', civilStatus: 'Single',
    contactNumber: 9123456791, email: 'sofia.chen@school.edu', address: '789 Pine Rd, Cebu',
    yearLevel: 3, section: 'STEM-A', studentType: 'Regular', enrollmentStatus: 'Enrolled', dateEnrolled: '2020-06-01',
    courseID: 2, departmentID: 1,
  },
]

export const initialAcademicHistory = [
  { academicID: 1, studentID: 1, schoolYear: '2024-2025', semester: '1st', gpa: 3.85, academicStanding: 'Dean\'s Lister', totalUnits: 24, completedUnits: 24 },
  { academicID: 2, studentID: 2, schoolYear: '2024-2025', semester: '1st', gpa: 3.45, academicStanding: 'Good Standing', totalUnits: 24, completedUnits: 22 },
  { academicID: 3, studentID: 3, schoolYear: '2024-2025', semester: '1st', gpa: 3.92, academicStanding: 'Dean\'s Lister', totalUnits: 24, completedUnits: 24 },
]

export const initialMedicalHistory = [
  { medicalID: 1, studentID: 1, bloodType: 'O+', medicalConditions: 'None', emergencyContactName: 'Juan Santos', emergencyContactRelationship: 'Father', emergencyContactNumber: 9111111111, emergencyContactAddress: '123 Main St, Manila' },
  { medicalID: 2, studentID: 2, bloodType: 'A+', medicalConditions: 'Asthma', emergencyContactName: 'Maria Rodriguez', emergencyContactRelationship: 'Mother', emergencyContactNumber: 9111111112, emergencyContactAddress: '456 Oak Ave, QC' },
]

export const initialGuardians = [
  { guardianID: 1, studentID: 1, guardianName: 'Juan Santos', relationship: 'Father', contactNumber: 9111111111, email: 'juan.santos@email.com', occupation: 'Engineer', address: '123 Main St, Manila' },
  { guardianID: 2, studentID: 2, guardianName: 'Maria Rodriguez', relationship: 'Mother', contactNumber: 9111111112, email: 'maria.rodriguez@email.com', occupation: 'Teacher', address: '456 Oak Ave, QC' },
]

export const initialSkills = [
  { skillID: 1, studentID: 1, skillName: 'Python', category: 'Programming', description: 'Web development and data analysis' },
  { skillID: 2, studentID: 1, skillName: 'JavaScript', category: 'Programming', description: 'Frontend development' },
  { skillID: 3, studentID: 2, skillName: 'Basketball', category: 'Sports', description: 'Varsity player' },
  { skillID: 4, studentID: 3, skillName: 'C++', category: 'Programming', description: 'Competitive programming' },
]

export const initialAffiliations = [
  { affiliationID: 1, studentID: 1, organizationName: 'Science Club', position: 'President', dateJoined: '2023-06-01', dateEnded: null, status: 'Active', adviserName: 'Dr. Ana Reyes' },
  { affiliationID: 2, studentID: 2, organizationName: 'Basketball Varsity', position: 'Point Guard', dateJoined: '2023-09-01', dateEnded: null, status: 'Active', adviserName: 'Engr. Pedro Mendoza' },
  { affiliationID: 3, studentID: 3, organizationName: 'Programming Club', position: 'Vice President', dateJoined: '2023-07-01', dateEnded: null, status: 'Active', adviserName: 'Dr. Ana Reyes' },
]

export const initialViolations = [
  { violationID: 1, studentID: 2, violationType: 'Tardiness', severityLevel: 'Minor', description: '3 late arrivals', dateReported: '2024-02-10', reportedBy: 'Faculty', actionTaken: 'Verbal warning', status: 'Resolved', resolutionDate: '2024-02-15' },
]
