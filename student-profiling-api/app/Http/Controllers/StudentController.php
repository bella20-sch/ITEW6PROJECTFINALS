<?php

namespace App\Http\Controllers;

use App\Models\AcademicHistory;
use App\Models\Affiliation;
use App\Models\Guardian;
use App\Models\MedicalHistory;
use App\Models\Skill;
use App\Models\Student;
use App\Models\Violation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $q = Student::query();

        if ($request->filled('search')) {
            $search = strtolower(trim((string) $request->query('search')));
            $q->where(function ($qq) use ($search) {
                $qq->whereRaw('LOWER(firstName) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(lastName) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"])
                    ->orWhere('studentID', 'like', "%{$search}%");
            });
        }

        if ($request->filled('section')) {
            $q->where('section', $request->query('section'));
        }

        if ($request->filled('courseID')) {
            $q->where('courseID', (int) $request->query('courseID'));
        }

        if ($request->filled('skill') || $request->filled('skillCategory')) {
            $q->join('skills', 'skills.studentID', '=', 'students.studentID');

            if ($request->filled('skill')) {
                $skill = strtolower(trim((string) $request->query('skill')));
                $q->whereRaw('LOWER(skills.skillName) LIKE ?', ["%{$skill}%"]);
            }

            if ($request->filled('skillCategory')) {
                $cat = strtolower(trim((string) $request->query('skillCategory')));
                $q->whereRaw('LOWER(skills.category) LIKE ?', ["%{$cat}%"]);
            }

            $q->select('students.*')->distinct();
        }

        return $q->orderBy('lastName')->orderBy('firstName')->get();
    }

    public function show($id)
    {
        $student = Student::where('studentID', (int) $id)->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        return response()->json($this->profilePayload($student));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'firstName' => ['required', 'string'],
            'middleName' => ['nullable', 'string'],
            'lastName' => ['required', 'string'],
            'suffix' => ['nullable', 'string'],
            'gender' => ['nullable', 'string'],
            'birthDate' => ['nullable', 'date'],
            'birthPlace' => ['nullable', 'string'],
            'nationality' => ['nullable', 'string'],
            'civilStatus' => ['nullable', 'string'],
            'contactNumber' => ['nullable', 'string'],
            'email' => ['required', 'email', 'unique:students,email'],
            'address' => ['nullable', 'string'],
            'yearLevel' => ['nullable', 'integer'],
            'section' => ['nullable', 'string'],
            'studentType' => ['nullable', 'string'],
            'enrollmentStatus' => ['nullable', 'string'],
            'dateEnrolled' => ['nullable', 'date'],
            'courseID' => ['required', 'integer'],
            'departmentID' => ['required', 'integer'],
        ]);

        $nextId = (int) (Student::max('studentID') ?? 0) + 1;
        $data['studentID'] = $nextId;

        $student = Student::create($data);
        return response()->json($this->profilePayload($student), 201);
    }

    public function update(Request $request, $id)
    {
        $student = Student::where('studentID', (int) $id)->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        $data = $request->validate([
            'firstName' => ['sometimes', 'string'],
            'middleName' => ['sometimes', 'nullable', 'string'],
            'lastName' => ['sometimes', 'string'],
            'suffix' => ['sometimes', 'nullable', 'string'],
            'gender' => ['sometimes', 'nullable', 'string'],
            'birthDate' => ['sometimes', 'nullable', 'date'],
            'birthPlace' => ['sometimes', 'nullable', 'string'],
            'nationality' => ['sometimes', 'nullable', 'string'],
            'civilStatus' => ['sometimes', 'nullable', 'string'],
            'contactNumber' => ['sometimes', 'nullable', 'string'],
            'email' => ['sometimes', 'email', "unique:students,email,{$student->studentID},studentID"],
            'address' => ['sometimes', 'nullable', 'string'],
            'yearLevel' => ['sometimes', 'nullable', 'integer'],
            'section' => ['sometimes', 'nullable', 'string'],
            'studentType' => ['sometimes', 'nullable', 'string'],
            'enrollmentStatus' => ['sometimes', 'nullable', 'string'],
            'dateEnrolled' => ['sometimes', 'nullable', 'date'],
            'courseID' => ['sometimes', 'integer'],
            'departmentID' => ['sometimes', 'integer'],
        ]);

        $student->fill($data);
        $student->save();

        return response()->json($this->profilePayload($student));
    }

    public function destroy($id)
    {
        $student = Student::where('studentID', (int) $id)->first();
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        AcademicHistory::where('studentID', $student->studentID)->delete();
        MedicalHistory::where('studentID', $student->studentID)->delete();
        Guardian::where('studentID', $student->studentID)->delete();
        Skill::where('studentID', $student->studentID)->delete();
        Affiliation::where('studentID', $student->studentID)->delete();
        Violation::where('studentID', $student->studentID)->delete();
        $student->delete();

        return response()->json(['ok' => true]);
    }

    private function profilePayload(Student $student): array
    {
        $sid = (int) $student->studentID;

        return array_merge($student->toArray(), [
            'academicHistory' => AcademicHistory::where('studentID', $sid)->orderBy('academicID')->get()->toArray(),
            'medicalHistory' => MedicalHistory::where('studentID', $sid)->orderBy('medicalID')->get()->toArray(),
            'guardians' => Guardian::where('studentID', $sid)->orderBy('guardianID')->get()->toArray(),
            'skills' => Skill::where('studentID', $sid)->orderBy('skillID')->get()->toArray(),
            'affiliations' => Affiliation::where('studentID', $sid)->orderBy('affiliationID')->get()->toArray(),
            'violations' => Violation::where('studentID', $sid)->orderBy('violationID')->get()->toArray(),
        ]);
    }
}
