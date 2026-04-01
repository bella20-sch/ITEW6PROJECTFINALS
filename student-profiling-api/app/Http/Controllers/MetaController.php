<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Admin;
use App\Models\FacultyCourseAssignment;
use Illuminate\Http\Request;

class MetaController extends Controller
{
    private function adminOnly(Request $request)
    {
        if (!($request->user() instanceof Admin)) {
            abort(403, 'Admin access required.');
        }
    }

    public function departments()
    {
        $u = request()->user();
        if ($u instanceof Faculty) {
            return Department::where('departmentID', $u->departmentID)->get();
        }
        return Department::orderBy('departmentName')->get();
    }

    public function createDepartment(Request $request)
    {
        $this->adminOnly($request);
        $data = $request->validate([
            'departmentName' => ['required', 'string'],
            'officeLocation' => ['nullable', 'string'],
            'contactNumber' => ['nullable', 'string'],
        ]);

        $nextId = (int) (Department::max('departmentID') ?? 0) + 1;
        $data['departmentID'] = $nextId;
        $d = Department::create($data);
        return response()->json($d, 201);
    }

    public function updateDepartment(Request $request, $id)
    {
        $this->adminOnly($request);
        $d = Department::where('departmentID', (int) $id)->first();
        if (!$d) return response()->json(['error' => 'Department not found'], 404);

        $data = $request->validate([
            'departmentName' => ['sometimes', 'string'],
            'officeLocation' => ['sometimes', 'nullable', 'string'],
            'contactNumber' => ['sometimes', 'nullable', 'string'],
        ]);
        $d->fill($data);
        $d->save();
        return $d;
    }

    public function deleteDepartment($id)
    {
        $this->adminOnly(request());
        $d = Department::where('departmentID', (int) $id)->first();
        if (!$d) return response()->json(['error' => 'Department not found'], 404);
        $d->delete();
        return response()->json(['ok' => true]);
    }

    public function courses()
    {
        $u = request()->user();
        if ($u instanceof Faculty) {
            $courseIds = FacultyCourseAssignment::where('facultyID', $u->facultyID)->pluck('courseID')->unique()->values();
            return Course::whereIn('courseID', $courseIds)->orderBy('courseCode')->get();
        }
        return Course::orderBy('courseCode')->get();
    }

    public function createCourse(Request $request)
    {
        $this->adminOnly($request);
        $data = $request->validate([
            'courseCode' => ['required', 'string'],
            'courseName' => ['required', 'string'],
            'totalUnits' => ['nullable', 'integer'],
            'departmentID' => ['required', 'integer'],
        ]);
        $nextId = (int) (Course::max('courseID') ?? 0) + 1;
        $data['courseID'] = $nextId;
        $c = Course::create($data);
        return response()->json($c, 201);
    }

    public function updateCourse(Request $request, $id)
    {
        $this->adminOnly($request);
        $c = Course::where('courseID', (int) $id)->first();
        if (!$c) return response()->json(['error' => 'Course not found'], 404);
        $data = $request->validate([
            'courseCode' => ['sometimes', 'string'],
            'courseName' => ['sometimes', 'string'],
            'totalUnits' => ['sometimes', 'nullable', 'integer'],
            'departmentID' => ['sometimes', 'integer'],
        ]);
        $c->fill($data);
        $c->save();
        return $c;
    }

    public function deleteCourse($id)
    {
        $this->adminOnly(request());
        $c = Course::where('courseID', (int) $id)->first();
        if (!$c) return response()->json(['error' => 'Course not found'], 404);
        $c->delete();
        return response()->json(['ok' => true]);
    }

    public function faculty()
    {
        $u = request()->user();
        if ($u instanceof Faculty) {
            return Faculty::where('facultyID', $u->facultyID)->get();
        }
        return Faculty::orderBy('lastName')->get();
    }

    public function createFaculty(Request $request)
    {
        $this->adminOnly($request);
        $data = $request->validate([
            'departmentID' => ['required', 'integer'],
            'firstName' => ['required', 'string'],
            'lastName' => ['required', 'string'],
            'position' => ['nullable', 'string'],
            'employmentStatus' => ['nullable', 'string'],
            'hireDate' => ['nullable', 'date'],
            'email' => ['required', 'email', 'unique:faculties,email'],
            'contactNumber' => ['nullable', 'string'],
            'officeLocation' => ['nullable', 'string'],
        ]);
        $nextId = (int) (Faculty::max('facultyID') ?? 0) + 1;
        $data['facultyID'] = $nextId;
        $f = Faculty::create($data);
        return response()->json($f, 201);
    }

    public function updateFaculty(Request $request, $id)
    {
        $this->adminOnly($request);
        $f = Faculty::where('facultyID', (int) $id)->first();
        if (!$f) return response()->json(['error' => 'Faculty not found'], 404);
        $data = $request->validate([
            'departmentID' => ['sometimes', 'integer'],
            'firstName' => ['sometimes', 'string'],
            'lastName' => ['sometimes', 'string'],
            'position' => ['sometimes', 'nullable', 'string'],
            'employmentStatus' => ['sometimes', 'nullable', 'string'],
            'hireDate' => ['sometimes', 'nullable', 'date'],
            'email' => ['sometimes', 'email', "unique:faculties,email,{$f->facultyID},facultyID"],
            'contactNumber' => ['sometimes', 'nullable', 'string'],
            'officeLocation' => ['sometimes', 'nullable', 'string'],
        ]);
        $f->fill($data);
        $f->save();
        return $f;
    }

    public function deleteFaculty($id)
    {
        $this->adminOnly(request());
        $f = Faculty::where('facultyID', (int) $id)->first();
        if (!$f) return response()->json(['error' => 'Faculty not found'], 404);
        $f->delete();
        return response()->json(['ok' => true]);
    }
}
