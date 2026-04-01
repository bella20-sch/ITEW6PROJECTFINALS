<?php

namespace Database\Seeders;

use App\Models\AcademicHistory;
use App\Models\Affiliation;
use App\Models\Course;
use App\Models\Department;
use App\Models\Admin;
use App\Models\Faculty;
use App\Models\Guardian;
use App\Models\MedicalHistory;
use App\Models\Skill;
use App\Models\Student;
use App\Models\Violation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FrontendInitialDataSeeder extends Seeder
{
    public function run()
    {
        // Default MIS/Admin account for provisioning users
        Admin::updateOrCreate(
            ['email' => 'mis.admin@school.edu'],
            [
                'firstName' => 'MIS',
                'lastName' => 'Admin',
                'password' => Hash::make('admin123'),
            ]
        );

        // Mirrors `student-profiling-lms/src/data/initialData.js`
        $departments = [
            ['departmentID' => 1, 'departmentName' => 'Computer Science', 'officeLocation' => 'Building A-201', 'contactNumber' => '1234567890'],
            ['departmentID' => 2, 'departmentName' => 'Engineering', 'officeLocation' => 'Building B-102', 'contactNumber' => '1234567891'],
            ['departmentID' => 3, 'departmentName' => 'Humanities', 'officeLocation' => 'Building C-301', 'contactNumber' => '1234567892'],
        ];

        $courses = [
            ['courseID' => 1, 'courseCode' => 'BSIT', 'courseName' => 'Bachelor of Science in Information Technology', 'totalUnits' => 180, 'departmentID' => 1],
            ['courseID' => 2, 'courseCode' => 'BSCS', 'courseName' => 'Bachelor of Science in Computer Science', 'totalUnits' => 185, 'departmentID' => 1],
            ['courseID' => 3, 'courseCode' => 'BSECE', 'courseName' => 'Bachelor of Science in Electronics Engineering', 'totalUnits' => 190, 'departmentID' => 2],
        ];

        $faculty = [
            ['facultyID' => 1, 'departmentID' => 1, 'firstName' => 'Dr. Ana', 'lastName' => 'Reyes', 'position' => 'Professor', 'employmentStatus' => 'Full-time', 'hireDate' => '2015-06-01', 'email' => 'ana.reyes@school.edu', 'contactNumber' => '9876543210', 'officeLocation' => 'A-201'],
            ['facultyID' => 2, 'departmentID' => 2, 'firstName' => 'Engr. Pedro', 'lastName' => 'Mendoza', 'position' => 'Associate Professor', 'employmentStatus' => 'Full-time', 'hireDate' => '2018-01-15', 'email' => 'pedro.mendoza@school.edu', 'contactNumber' => '9876543211', 'officeLocation' => 'B-102'],
        ];

        $students = [
            [
                'studentID' => 1, 'firstName' => 'Maria', 'middleName' => 'Cruz', 'lastName' => 'Santos', 'suffix' => '',
                'gender' => 'Female', 'birthDate' => '2006-03-15', 'birthPlace' => 'Manila', 'nationality' => 'Filipino', 'civilStatus' => 'Single',
                'contactNumber' => '9123456789', 'email' => 'maria.santos@school.edu', 'address' => '123 Main St, Manila',
                'yearLevel' => 3, 'section' => 'STEM-A', 'studentType' => 'Regular', 'enrollmentStatus' => 'Enrolled', 'dateEnrolled' => '2020-06-01',
                'courseID' => 1, 'departmentID' => 1,
            ],
            [
                'studentID' => 2, 'firstName' => 'James', 'middleName' => '', 'lastName' => 'Rodriguez', 'suffix' => 'Jr.',
                'gender' => 'Male', 'birthDate' => '2007-05-22', 'birthPlace' => 'Quezon City', 'nationality' => 'Filipino', 'civilStatus' => 'Single',
                'contactNumber' => '9123456790', 'email' => 'james.rodriguez@school.edu', 'address' => '456 Oak Ave, QC',
                'yearLevel' => 2, 'section' => 'STEM-B', 'studentType' => 'Regular', 'enrollmentStatus' => 'Enrolled', 'dateEnrolled' => '2021-06-01',
                'courseID' => 1, 'departmentID' => 1,
            ],
            [
                'studentID' => 3, 'firstName' => 'Sofia', 'middleName' => 'Lim', 'lastName' => 'Chen', 'suffix' => '',
                'gender' => 'Female', 'birthDate' => '2006-11-08', 'birthPlace' => 'Cebu City', 'nationality' => 'Filipino', 'civilStatus' => 'Single',
                'contactNumber' => '9123456791', 'email' => 'sofia.chen@school.edu', 'address' => '789 Pine Rd, Cebu',
                'yearLevel' => 3, 'section' => 'STEM-A', 'studentType' => 'Regular', 'enrollmentStatus' => 'Enrolled', 'dateEnrolled' => '2020-06-01',
                'courseID' => 2, 'departmentID' => 1,
            ],
        ];

        $academic = [
            ['academicID' => 1, 'studentID' => 1, 'schoolYear' => '2024-2025', 'semester' => '1st', 'gpa' => 3.85, 'academicStanding' => "Dean's Lister", 'totalUnits' => 24, 'completedUnits' => 24],
            ['academicID' => 2, 'studentID' => 2, 'schoolYear' => '2024-2025', 'semester' => '1st', 'gpa' => 3.45, 'academicStanding' => 'Good Standing', 'totalUnits' => 24, 'completedUnits' => 22],
            ['academicID' => 3, 'studentID' => 3, 'schoolYear' => '2024-2025', 'semester' => '1st', 'gpa' => 3.92, 'academicStanding' => "Dean's Lister", 'totalUnits' => 24, 'completedUnits' => 24],
        ];

        $medical = [
            ['medicalID' => 1, 'studentID' => 1, 'bloodType' => 'O+', 'medicalConditions' => 'None', 'emergencyContactName' => 'Juan Santos', 'emergencyContactRelationship' => 'Father', 'emergencyContactNumber' => '9111111111', 'emergencyContactAddress' => '123 Main St, Manila'],
            ['medicalID' => 2, 'studentID' => 2, 'bloodType' => 'A+', 'medicalConditions' => 'Asthma', 'emergencyContactName' => 'Maria Rodriguez', 'emergencyContactRelationship' => 'Mother', 'emergencyContactNumber' => '9111111112', 'emergencyContactAddress' => '456 Oak Ave, QC'],
        ];

        $guardians = [
            ['guardianID' => 1, 'studentID' => 1, 'guardianName' => 'Juan Santos', 'relationship' => 'Father', 'contactNumber' => '9111111111', 'email' => 'juan.santos@email.com', 'occupation' => 'Engineer', 'address' => '123 Main St, Manila'],
            ['guardianID' => 2, 'studentID' => 2, 'guardianName' => 'Maria Rodriguez', 'relationship' => 'Mother', 'contactNumber' => '9111111112', 'email' => 'maria.rodriguez@email.com', 'occupation' => 'Teacher', 'address' => '456 Oak Ave, QC'],
        ];

        $skills = [
            ['skillID' => 1, 'studentID' => 1, 'skillName' => 'Python', 'category' => 'Programming', 'description' => 'Web development and data analysis'],
            ['skillID' => 2, 'studentID' => 1, 'skillName' => 'JavaScript', 'category' => 'Programming', 'description' => 'Frontend development'],
            ['skillID' => 3, 'studentID' => 2, 'skillName' => 'Basketball', 'category' => 'Sports', 'description' => 'Varsity player'],
            ['skillID' => 4, 'studentID' => 3, 'skillName' => 'C++', 'category' => 'Programming', 'description' => 'Competitive programming'],
        ];

        $affiliations = [
            ['affiliationID' => 1, 'studentID' => 1, 'organizationName' => 'Science Club', 'position' => 'President', 'dateJoined' => '2023-06-01', 'dateEnded' => null, 'status' => 'Active', 'adviserName' => 'Dr. Ana Reyes'],
            ['affiliationID' => 2, 'studentID' => 2, 'organizationName' => 'Basketball Varsity', 'position' => 'Point Guard', 'dateJoined' => '2023-09-01', 'dateEnded' => null, 'status' => 'Active', 'adviserName' => 'Engr. Pedro Mendoza'],
            ['affiliationID' => 3, 'studentID' => 3, 'organizationName' => 'Programming Club', 'position' => 'Vice President', 'dateJoined' => '2023-07-01', 'dateEnded' => null, 'status' => 'Active', 'adviserName' => 'Dr. Ana Reyes'],
        ];

        $violations = [
            ['violationID' => 1, 'studentID' => 2, 'violationType' => 'Tardiness', 'severityLevel' => 'Minor', 'description' => '3 late arrivals', 'dateReported' => '2024-02-10', 'reportedBy' => 'Faculty', 'actionTaken' => 'Verbal warning', 'status' => 'Resolved', 'resolutionDate' => '2024-02-15'],
        ];

        foreach ($departments as $d) {
            Department::updateOrCreate(['departmentID' => $d['departmentID']], $d);
        }
        foreach ($courses as $c) {
            Course::updateOrCreate(['courseID' => $c['courseID']], $c);
        }
        foreach ($faculty as $f) {
            Faculty::updateOrCreate(['facultyID' => $f['facultyID']], $f);
        }
        foreach ($students as $s) {
            Student::updateOrCreate(['studentID' => $s['studentID']], $s);
        }
        foreach ($academic as $a) {
            AcademicHistory::updateOrCreate(['academicID' => $a['academicID']], $a);
        }
        foreach ($medical as $m) {
            MedicalHistory::updateOrCreate(['medicalID' => $m['medicalID']], $m);
        }
        foreach ($guardians as $g) {
            Guardian::updateOrCreate(['guardianID' => $g['guardianID']], $g);
        }
        foreach ($skills as $sk) {
            Skill::updateOrCreate(['skillID' => $sk['skillID']], $sk);
        }
        foreach ($affiliations as $af) {
            Affiliation::updateOrCreate(['affiliationID' => $af['affiliationID']], $af);
        }
        foreach ($violations as $v) {
            Violation::updateOrCreate(['violationID' => $v['violationID']], $v);
        }
    }
}

