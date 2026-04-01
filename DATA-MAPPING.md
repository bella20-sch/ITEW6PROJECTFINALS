# Data Mapping and UML Notes

This file contains the project mapping/details moved out of `README.md` so the README stays command-focused.

## Project Structure (High-Level)

```text
student-profiling-lms/
  src/components/
  src/context/
  src/pages/
student-profiling-api/
  app/Http/Controllers/
  app/Models/
  database/migrations/
```

## Core Entity Mapping (High-Level)

| Entity | Main Storage | Main Backend Model | Main UI/Usage |
|---|---|---|---|
| Department | DB table: `departments` | `Department` | Departments, forms/dropdowns |
| Course | DB table: `courses` | `Course` | Courses, student/faculty assignment |
| Faculty | DB table: `faculties` | `Faculty` | Faculty page, admin creation |
| Student | DB table: `students` | `Student` | Students list/profile, admin creation |
| Activity | DB table: `activities` | `Activity` | Faculty workspace, student tasks |
| Submission | DB table: `activity_submissions` | `ActivitySubmission` | Student submissions |
| Material | DB table: `course_materials` | `CourseMaterial` | Faculty/student materials |

## Key Relationships

- Department `1..*` Courses
- Department `1..*` Faculty
- Department `1..*` Students
- Course `1..*` Students
- Faculty `*..*` Course/Section via `faculty_course_assignments`
- Student optional adviser/professor via `students.adviserFacultyID`

## Notes

- Authentication and roles are API-based (`admin`, `faculty`, `student`).
- Admin handles account creation for both faculty and students.
- Faculty and student access are filtered by assignments/ownership rules.
