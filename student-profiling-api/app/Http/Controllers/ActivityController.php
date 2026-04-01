<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivitySubmission;
use App\Models\Admin;
use App\Models\CourseMaterial;
use App\Models\Faculty;
use App\Models\FacultyCourseAssignment;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ActivityController extends Controller
{
    private function role(Request $request): string
    {
        $u = $request->user();
        if ($u instanceof Admin) return 'admin';
        if ($u instanceof Faculty) return 'faculty';
        if ($u instanceof Student) return 'student';
        return 'unknown';
    }

    public function myAssignments(Request $request)
    {
        $u = $request->user();
        $role = $this->role($request);

        if ($role === 'faculty') {
            return FacultyCourseAssignment::where('facultyID', $u->facultyID)->get();
        }
        if ($role === 'student') {
            return FacultyCourseAssignment::where('courseID', $u->courseID)
                ->where(function ($q) use ($u) {
                    $q->whereNull('section')->orWhere('section', $u->section);
                })->get();
        }
        return [];
    }

    public function myActivities(Request $request)
    {
        $u = $request->user();
        $role = $this->role($request);

        if ($role === 'faculty') {
            return Activity::where('facultyID', $u->facultyID)->orderByDesc('id')->get();
        }
        if ($role === 'student') {
            return Activity::where('courseID', $u->courseID)
                ->where(function ($q) use ($u) {
                    $q->whereNull('section')->orWhere('section', $u->section);
                })->orderByDesc('id')->get();
        }
        return Activity::orderByDesc('id')->get();
    }

    public function myMaterials(Request $request)
    {
        $u = $request->user();
        $role = $this->role($request);

        if ($role === 'faculty') {
            return CourseMaterial::where('facultyID', $u->facultyID)->orderByDesc('id')->get();
        }
        if ($role === 'student') {
            return CourseMaterial::where('courseID', $u->courseID)
                ->where(function ($q) use ($u) {
                    $q->whereNull('section')->orWhere('section', $u->section);
                })->orderByDesc('id')->get();
        }
        return CourseMaterial::orderByDesc('id')->get();
    }

    public function createActivity(Request $request)
    {
        $u = $request->user();
        if (!($u instanceof Faculty)) {
            throw ValidationException::withMessages(['auth' => ['Faculty access required.']]);
        }

        $data = $request->validate([
            'courseID' => ['required', 'integer'],
            'section' => ['nullable', 'string'],
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'allow_late' => ['nullable', 'boolean'],
        ]);

        $assigned = FacultyCourseAssignment::where('facultyID', $u->facultyID)
            ->where('courseID', (int) $data['courseID'])
            ->where(function ($q) use ($data) {
                if (!empty($data['section'])) $q->where('section', $data['section']);
                else $q->whereNull('section');
            })
            ->exists();

        if (!$assigned) {
            throw ValidationException::withMessages(['courseID' => ['Course/section is not assigned to this faculty.']]);
        }

        return Activity::create([
            'facultyID' => $u->facultyID,
            'courseID' => (int) $data['courseID'],
            'section' => $data['section'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'deadline' => $data['deadline'] ?? null,
            'allow_late' => (bool) ($data['allow_late'] ?? false),
        ]);
    }

    public function createMaterial(Request $request)
    {
        $u = $request->user();
        if (!($u instanceof Faculty)) {
            throw ValidationException::withMessages(['auth' => ['Faculty access required.']]);
        }
        $data = $request->validate([
            'courseID' => ['required', 'integer'],
            'section' => ['nullable', 'string'],
            'title' => ['required', 'string'],
            'content' => ['nullable', 'string'],
            'link' => ['nullable', 'string'],
        ]);

        return CourseMaterial::create([
            'facultyID' => $u->facultyID,
            'courseID' => (int) $data['courseID'],
            'section' => $data['section'] ?? null,
            'title' => $data['title'],
            'content' => $data['content'] ?? null,
            'link' => $data['link'] ?? null,
        ]);
    }

    public function submit(Request $request, $activityId)
    {
        $u = $request->user();
        if (!($u instanceof Student)) {
            throw ValidationException::withMessages(['auth' => ['Student access required.']]);
        }
        $activity = Activity::find($activityId);
        if (!$activity) return response()->json(['error' => 'Activity not found'], 404);

        $data = $request->validate([
            'content' => ['required', 'string'],
        ]);

        $late = false;
        if ($activity->deadline) {
            $deadlineTs = strtotime($activity->deadline);
            $nowTs = time();
            $late = $nowTs > $deadlineTs;
            if ($late && !$activity->allow_late) {
                throw ValidationException::withMessages(['content' => ['Deadline has passed and late submissions are disabled.']]);
            }
        }

        return ActivitySubmission::updateOrCreate(
            ['activity_id' => $activity->id, 'studentID' => $u->studentID],
            [
                'content' => $data['content'],
                'submitted_at' => now(),
                'is_late' => $late,
            ]
        );
    }
}
