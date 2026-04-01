# Student Profiling LMS

**ITEW6 REVISED** — Bella, Mourine Kate; Borabo, Nicole; Lorica, Ken Eubert; Mendoza, Mayen Sofia

A comprehensive student profiling and learning management system (LMS) built with React, implementing the full UML Class Diagram for student data, academic records, affiliations, violations, and more.

---

## Quick Start (After Clone)

Run these from the **project root** (`ITEW6PROJECTFINALS`):

```bat
setup.bat
start-dev.bat
```

What these do:
- `setup.bat`
  - installs frontend dependencies in `student-profiling-lms`
  - installs backend dependencies in `student-profiling-api`
  - runs backend migration + seed
- `start-dev.bat`
  - opens one terminal for Laravel API
  - opens one terminal for React Vite app

URLs:
- Frontend: `http://localhost:5173`
- Backend health check: `http://127.0.0.1:8000/api/health`

Default MIS/Admin login:
- Email: `mis.admin@school.edu`
- Password: `admin123`

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [UML Implementation Map](#uml-implementation-map)
3. [Entities, Attributes & File Locations](#entities-attributes--file-locations)
4. [Relationships & Multiplicities](#relationships--multiplicities)
5. [Navigability & How Components Connect](#navigability--how-components-connect)
6. [CRUD Operations](#crud-operations)
7. [Getting Started](#getting-started)

---

## Project Structure

```
student-profiling-lms/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Header.jsx     # Page header with burger menu
│   │   ├── Layout.jsx     # Main layout wrapper
│   │   ├── Modal.jsx      # Modal dialog
│   │   ├── Sidebar.jsx    # Navigation sidebar
│   │   └── StudentFormModal.jsx
│   ├── context/
│   │   └── DataContext.jsx  # Central state & CRUD (implements UML relationships)
│   ├── data/
│   │   └── initialData.js   # Seed data for all 10 UML entities
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Departments.jsx  # Department CRUD
│   │   ├── Courses.jsx      # Course CRUD
│   │   ├── Faculty.jsx      # Faculty CRUD
│   │   ├── Students.jsx     # Student list & add
│   │   ├── StudentProfile.jsx  # Full student profile (all related entities)
│   │   └── Reports.jsx      # Query reports
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── README.md
└── package.json
```

---

## UML Implementation Map

| UML Entity         | Data Location             | CRUD Location              | UI Display                          |
|--------------------|---------------------------|----------------------------|-------------------------------------|
| **Department**     | `initialData.js`          | `DataContext` + `Departments.jsx` | Departments page, Course/Faculty forms |
| **Course**         | `initialData.js`          | `DataContext` + `Courses.jsx`     | Courses page, Student form          |
| **Faculty**        | `initialData.js`          | `DataContext` + `Faculty.jsx`     | Faculty page                        |
| **Student**        | `initialData.js`          | `DataContext` + `Students.jsx`, `StudentProfile.jsx` | Students list, Student profile |
| **AcademicHistory**| `initialData.js`          | `DataContext`              | StudentProfile → Academic History   |
| **MedicalHistory** | `initialData.js`          | `DataContext`              | StudentProfile → Medical History    |
| **Guardian**       | `initialData.js`          | `DataContext`              | StudentProfile → Guardians          |
| **Skill**          | `initialData.js`          | `DataContext`              | StudentProfile → Skills             |
| **Affiliation**    | `initialData.js`          | `DataContext`              | StudentProfile → Affiliations       |
| **Violation**      | `initialData.js`          | `DataContext`              | StudentProfile → Violations         |

---

## Entities, Attributes & File Locations

### 1. Department

| Attribute      | Type   | Location              |
|----------------|--------|------------------------|
| departmentID   | Int (PK) | `initialData.js`, `DataContext` |
| departmentName | String | `initialData.js`       |
| officeLocation | String | `initialData.js`       |
| contactNumber  | String | `initialData.js` (UML specifies String) |

**Where used:** `Departments.jsx` (CRUD), `Courses.jsx` (dropdown), `Faculty.jsx` (dropdown), `StudentProfile.jsx` (via course → department).

---

### 2. Course

| Attribute    | Type   | Location |
|--------------|--------|----------|
| courseID     | Int (PK) | `initialData.js` |
| courseCode   | String | `initialData.js` |
| courseName   | String | `initialData.js` |
| totalUnits   | Int    | `initialData.js` |
| departmentID | Int (FK) | `initialData.js` → references Department |

**Where used:** `Courses.jsx` (CRUD), `StudentFormModal.jsx` (course dropdown), `Students.jsx` (shows courseCode), `StudentProfile.jsx` (shows course).

---

### 3. Faculty

| Attribute        | Type   | Location |
|------------------|--------|----------|
| facultyID        | Int (PK) | `initialData.js` |
| departmentID     | Int (FK) | `initialData.js` → references Department |
| firstName        | String | `initialData.js` |
| lastName         | String | `initialData.js` |
| position         | String | `initialData.js` |
| employmentStatus | String | `initialData.js` |
| hireDate         | Date   | `initialData.js` |
| email            | String | `initialData.js` |
| contactNumber    | Int    | `initialData.js` |
| officeLocation   | String | `initialData.js` |

**Where used:** `Faculty.jsx` (CRUD), `DataContext` links faculty to department.

---

### 4. Student

| Attribute        | Type   | Location |
|------------------|--------|----------|
| studentID        | Int (PK) | `initialData.js` |
| firstName        | String | `initialData.js` |
| middleName       | String | `initialData.js` |
| lastName         | String | `initialData.js` |
| suffix           | String | `initialData.js` |
| gender           | String | `initialData.js` |
| birthDate        | Date   | `initialData.js` |
| birthPlace       | String | `initialData.js` |
| nationality      | String | `initialData.js` |
| civilStatus      | String | `initialData.js` |
| contactNumber    | Int    | `initialData.js` |
| email            | String | `initialData.js` |
| address          | String | `initialData.js` |
| yearLevel        | Int    | `initialData.js` |
| section          | String | `initialData.js` |
| studentType      | String | `initialData.js` |
| enrollmentStatus | String | `initialData.js` |
| dateEnrolled     | Date   | `initialData.js` |
| courseID         | Int (FK) | `initialData.js` → references Course |
| departmentID     | Int (FK) | `initialData.js` → references Department |

**Where used:** `Students.jsx`, `StudentProfile.jsx`, `StudentFormModal.jsx`, `Reports.jsx`.

---

### 5. AcademicHistory

| Attribute        | Type   | Location |
|------------------|--------|----------|
| academicID       | Int (PK) | `initialData.js` |
| studentID        | Int (FK) | `initialData.js` → references Student |
| schoolYear       | String | `initialData.js` |
| semester         | String | `initialData.js` |
| gpa              | double | `initialData.js` |
| academicStanding | String | `initialData.js` |
| totalUnits       | Int    | `initialData.js` |
| completedUnits   | Int    | `initialData.js` |

**Where used:** `DataContext.getStudentProfile()` joins by `studentID`; `StudentProfile.jsx` displays in Academic History section.

---

### 6. MedicalHistory

| Attribute                   | Type   | Location |
|----------------------------|--------|----------|
| medicalID                  | Int (PK) | `initialData.js` |
| studentID                  | Int (FK) | `initialData.js` → references Student |
| bloodType                  | String | `initialData.js` |
| medicalConditions          | String | `initialData.js` |
| emergencyContactName       | String | `initialData.js` |
| emergencyContactRelationship | String | `initialData.js` |
| emergencyContactNumber     | Int    | `initialData.js` |
| emergencyContactAddress    | String | `initialData.js` |

**Where used:** `StudentProfile.jsx` → Medical History section.

---

### 7. Guardian

| Attribute      | Type   | Location |
|----------------|--------|----------|
| guardianID     | Int (PK) | `initialData.js` |
| studentID      | Int (FK) | `initialData.js` → references Student |
| guardianName   | String | `initialData.js` |
| relationship   | String | `initialData.js` |
| contactNumber  | Int    | `initialData.js` |
| email          | String | `initialData.js` |
| occupation     | String | `initialData.js` |
| address        | String | `initialData.js` |

**Where used:** `StudentProfile.jsx` → Guardians section.

---

### 8. Skill

| Attribute  | Type   | Location |
|------------|--------|----------|
| skillID    | Int (PK) | `initialData.js` |
| studentID  | Int (FK) | `initialData.js` → references Student |
| skillName  | String | `initialData.js` |
| category   | String | `initialData.js` |
| description| String | `initialData.js` |

**Where used:** `StudentProfile.jsx` → Skills section, `Reports.jsx` (programming/basketball queries).

---

### 9. Affiliation

| Attribute         | Type   | Location |
|-------------------|--------|----------|
| affiliationID     | Int (PK) | `initialData.js` |
| studentID         | Int (FK) | `initialData.js` → references Student |
| organizationName  | String | `initialData.js` |
| position          | String | `initialData.js` |
| dateJoined        | Date   | `initialData.js` |
| dateEnded         | Date   | `initialData.js` |
| status            | String | `initialData.js` |
| adviserName       | String | `initialData.js` |

**Where used:** `StudentProfile.jsx` → Affiliations section.

---

### 10. Violation

| Attribute      | Type   | Location |
|----------------|--------|----------|
| violationID    | Int (PK) | `initialData.js` |
| studentID      | Int (FK) | `initialData.js` → references Student |
| violationType  | String | `initialData.js` |
| severityLevel  | String | `initialData.js` |
| description    | String | `initialData.js` |
| dateReported   | Date   | `initialData.js` |
| reportedBy     | String | `initialData.js` |
| actionTaken    | String | `initialData.js` |
| status         | String | `initialData.js` |
| resolutionDate | Date   | `initialData.js` |

**Where used:** `StudentProfile.jsx` → Violations section, `Reports.jsx` (honor roll excludes major violations).

---

## Relationships & Multiplicities

From the UML Class Diagram:

| Relationship        | Multiplicity   | Meaning                                      | Implementation |
|---------------------|----------------|----------------------------------------------|----------------|
| **Department → Course**   | 1 to 0..*  | 1 Department has 0+ Courses; each Course → 1 Department | `Course.departmentID` FK |
| **Department → Faculty**  | 1 to 0..*  | 1 Department has 0+ Faculty; each Faculty → 1 Department | `Faculty.departmentID` FK |
| **Department → Student**  | 1 to 0..*  | 1 Department has 0+ Students; each Student → 1 Department | `Student.departmentID` FK |
| **Course → Student**      | 1 to 0..*  | 1 Course has 0+ Students; each Student → 1 Course | `Student.courseID` FK |
| **Student → AcademicHistory** | 1 to 0..* | 1 Student has 0+ AcademicHistory; each → 1 Student | `AcademicHistory.studentID` FK |
| **Student → MedicalHistory** | 1 to 0..* | 1 Student has 0+ MedicalHistory; each → 1 Student | `MedicalHistory.studentID` FK |
| **Student → Guardian**    | 1 to 0..*  | 1 Student has 0+ Guardians; each → 1 Student | `Guardian.studentID` FK |
| **Student → Skill**       | 1 to 0..*  | 1 Student has 0+ Skills; each → 1 Student | `Skill.studentID` FK |
| **Student → Affiliation** | 1 to 0..*  | 1 Student has 0+ Affiliations; each → 1 Student | `Affiliation.studentID` FK |
| **Student → Violation**   | 1 to 0..*  | 1 Student has 0+ Violations; each → 1 Student | `Violation.studentID` FK |

**Implementation in `DataContext.jsx`:**

- Relationships are enforced via foreign keys in the data and join logic in `getStudentProfile()`.
- Cascade deletes respect multiplicities: deleting a Department removes its Courses, Faculty, and Students; deleting a Student removes AcademicHistory, MedicalHistory, Guardians, Skills, Affiliations, and Violations.

---

## Navigability & How Components Connect

### Navigability (from UML arrows)

| Arrow direction        | Meaning                             | How we implement it |
|------------------------|-------------------------------------|----------------------|
| **Student → Course**   | Can navigate from Student to Course | `courses.find(c => c.courseID === student.courseID)` in UI |
| **AcademicHistory → Student** | Can navigate from record to Student | `getStudentProfile()` returns student + joined data |
| **MedicalHistory → Student** | Same as above              | Same `getStudentProfile()` |
| **Guardian → Student** | Same as above                       | Same `getStudentProfile()` |
| **Skill → Student**    | Same as above                       | Same `getStudentProfile()` |
| **Affiliation → Student** | Same as above                    | Same `getStudentProfile()` |
| **Violation → Student**| Same as above                       | Same `getStudentProfile()` |

**Bidirectional associations** (Department ↔ Course, Department ↔ Faculty, Department ↔ Student):

- No explicit arrow in the UML usually means bidirectional or simple association.
- Implemented both ways: e.g. `Course` holds `departmentID`, and we query `departments.find(d => d.departmentID === course.departmentID)` when displaying.

### Data flow

1. **`DataContext`** holds all entities in React state and exposes `crud` + raw arrays.
2. **`getStudentProfile(studentID)`** joins Student with AcademicHistory, MedicalHistory, Guardians, Skills, Affiliations, Violations using `studentID`.
3. **Pages** use `useData()` and call `crud.*` for reads/writes.
4. **Navigation**: React Router links (`/students`, `/students/:id`, etc.) connect pages; sidebar `NavLink` components handle routes.

### Component connections

```
Layout
├── Sidebar (nav links)
└── main
    ├── Header (page title, burger menu)
    └── content-area
        └── <Outlet /> (Dashboard | Students | StudentProfile | Departments | Courses | Faculty | Reports)
                │
                └── All pages use useData() → DataContext
                    - Departments, Courses, Faculty: crud.departments, crud.courses, crud.faculty
                    - Students: crud.students, courses, departments
                    - StudentProfile: crud.students.getOne(id) → returns student + all related entities
                    - Reports: crud.students.getOne per student, filter by query
```

---

## CRUD Operations

| Entity           | Create        | Read         | Update       | Delete       |
|------------------|---------------|--------------|--------------|--------------|
| Department       | Departments   | All pages    | Departments  | Departments (cascades) |
| Course           | Courses       | Courses, Students, Forms | Courses | Courses |
| Faculty          | Faculty       | Faculty      | Faculty      | Faculty      |
| Student          | Students      | Students, StudentProfile | StudentProfile | StudentProfile (cascades) |
| AcademicHistory  | DataContext   | StudentProfile | DataContext | DataContext |
| MedicalHistory   | DataContext   | StudentProfile | DataContext | DataContext |
| Guardian         | DataContext   | StudentProfile | DataContext | DataContext |
| Skill            | DataContext   | StudentProfile | DataContext | DataContext |
| Affiliation      | DataContext   | StudentProfile | DataContext | DataContext |
| Violation        | DataContext   | StudentProfile | DataContext | DataContext |

---

## Getting Started

```bash
# Terminal A (backend)
cd student-profiling-api
composer install
php artisan migrate
php artisan db:seed
serve.bat

# Terminal B (frontend)
cd student-profiling-lms
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Required Commands by Directory

From root:

```bat
setup.bat
start-dev.bat
```

From `student-profiling-api`:

```bash
composer install
php artisan migrate
php artisan db:seed
serve.bat
```

From `student-profiling-lms`:

```bash
npm install
npm run dev
```
