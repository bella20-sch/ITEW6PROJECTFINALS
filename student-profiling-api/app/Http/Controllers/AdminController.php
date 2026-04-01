<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Faculty;
use App\Models\FacultyCourseAssignment;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    private function requireAdmin(Request $request): Admin
    {
        $u = $request->user();
        if (!$u || !($u instanceof Admin)) {
            throw ValidationException::withMessages([
                'auth' => ['Admin access required.'],
            ]);
        }
        return $u;
    }

    public function createStudent(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'email' => ['required', 'email', 'unique:students,email'],
            'password' => ['required', 'string', 'min:6'],
            'firstName' => ['required', 'string'],
            'lastName' => ['required', 'string'],
            'courseID' => ['required', 'integer'],
            'departmentID' => ['required', 'integer'],
        ]);

        $nextId = (int) (Student::max('studentID') ?? 0) + 1;
        $student = Student::create([
            'studentID' => $nextId,
            'email' => strtolower(trim($data['email'])),
            'password' => Hash::make($data['password']),
            'firstName' => $data['firstName'],
            'lastName' => $data['lastName'],
            'courseID' => (int) $data['courseID'],
            'departmentID' => (int) $data['departmentID'],
            'enrollmentStatus' => 'Enrolled',
            'studentType' => 'Regular',
            'yearLevel' => 1,
        ]);

        return response()->json($student, 201);
    }

    public function createFaculty(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'email' => ['required', 'email', 'unique:faculties,email'],
            'password' => ['required', 'string', 'min:6'],
            'firstName' => ['required', 'string'],
            'lastName' => ['required', 'string'],
            'departmentID' => ['required', 'integer'],
        ]);

        $nextId = (int) (Faculty::max('facultyID') ?? 0) + 1;
        $faculty = Faculty::create([
            'facultyID' => $nextId,
            'email' => strtolower(trim($data['email'])),
            'password' => Hash::make($data['password']),
            'firstName' => $data['firstName'],
            'lastName' => $data['lastName'],
            'departmentID' => (int) $data['departmentID'],
            'employmentStatus' => 'Full-time',
            'position' => 'Instructor',
        ]);

        return response()->json($faculty, 201);
    }

    public function assignFacultyCourse(Request $request)
    {
        $this->requireAdmin($request);
        $data = $request->validate([
            'facultyID' => ['required', 'integer'],
            'courseID' => ['required', 'integer'],
            'section' => ['nullable', 'string'],
        ]);

        $assign = FacultyCourseAssignment::updateOrCreate(
            [
                'facultyID' => (int) $data['facultyID'],
                'courseID' => (int) $data['courseID'],
                'section' => $data['section'] ?? null,
            ],
            []
        );

        return response()->json($assign, 201);
    }

    public function assignStudent(Request $request, $studentId)
    {
        $this->requireAdmin($request);
        $data = $request->validate([
            'departmentID' => ['required', 'integer'],
            'courseID' => ['required', 'integer'],
            'section' => ['nullable', 'string'],
        ]);
        $student = Student::where('studentID', (int) $studentId)->first();
        if (!$student) return response()->json(['error' => 'Student not found'], 404);

        $student->departmentID = (int) $data['departmentID'];
        $student->courseID = (int) $data['courseID'];
        if (array_key_exists('section', $data)) $student->section = $data['section'];
        $student->save();

        return response()->json($student);
    }
}
