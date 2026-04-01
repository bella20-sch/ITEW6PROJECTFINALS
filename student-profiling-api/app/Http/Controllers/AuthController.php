<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Faculty;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $email = strtolower(trim($data['email']));

        $userType = null;
        $user = Admin::where('email', $email)->first();
        if ($user) {
            $userType = 'admin';
        } else {
            $user = Faculty::where('email', $email)->first();
            if ($user) {
                $userType = 'faculty';
            } else {
                $user = Student::where('email', $email)->first();
                if ($user) {
                    $userType = 'student';
                }
            }
        }

        if (!$user || !$user->password || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'userType' => $userType,
            'user' => $this->userPayload($userType, $user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['ok' => true]);
    }

    private function userPayload(string $userType, $user): array
    {
        if ($userType === 'admin') {
            return [
                'id' => (int) $user->id,
                'firstName' => $user->firstName ?? 'MIS',
                'lastName' => $user->lastName ?? 'Admin',
                'email' => $user->email,
                'role' => 'Admin',
            ];
        }

        if ($userType === 'faculty') {
            return [
                'id' => (int) $user->facultyID,
                'firstName' => $user->firstName,
                'lastName' => $user->lastName,
                'email' => $user->email,
                'role' => 'Faculty',
            ];
        }

        return [
            'id' => (int) $user->studentID,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'email' => $user->email,
            'role' => 'Student',
        ];
    }
}
