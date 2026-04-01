<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentProfilingApiTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function loginAsAdminAndGetToken(string $email = 'mis.admin@school.edu', string $password = 'admin123'): string
    {
        $res = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $res->assertOk();
        $res->assertJsonStructure(['token', 'userType', 'user']);
        return $res->json('token');
    }

    public function test_student_signup_and_meta_endpoints_work()
    {
        $token = $this->loginAsAdminAndGetToken();

        $this->withToken($token)->getJson('/api/meta/departments')
            ->assertOk()
            ->assertJsonFragment(['departmentName' => 'Computer Science']);

        $this->withToken($token)->getJson('/api/meta/courses')
            ->assertOk()
            ->assertJsonFragment(['courseCode' => 'BSIT']);
    }

    public function test_skill_queries_work()
    {
        $token = $this->loginAsAdminAndGetToken();

        $basketball = $this->withToken($token)->getJson('/api/students?skill=Basketball')->assertOk()->json();
        $this->assertTrue(collect($basketball)->pluck('studentID')->contains(2));

        $programming = $this->withToken($token)->getJson('/api/students?skillCategory=Programming')->assertOk()->json();
        $ids = collect($programming)->pluck('studentID')->map(fn ($v) => (int) $v)->all();
        $this->assertContains(1, $ids);
        $this->assertContains(3, $ids);
    }

    public function test_profile_endpoint_returns_joined_sections()
    {
        $token = $this->loginAsAdminAndGetToken();

        $profile = $this->withToken($token)->getJson('/api/students/1')
            ->assertOk()
            ->json();

        $this->assertArrayHasKey('academicHistory', $profile);
        $this->assertArrayHasKey('medicalHistory', $profile);
        $this->assertArrayHasKey('guardians', $profile);
        $this->assertArrayHasKey('skills', $profile);
        $this->assertArrayHasKey('affiliations', $profile);
        $this->assertArrayHasKey('violations', $profile);
    }

    public function test_student_crud_works()
    {
        $token = $this->loginAsAdminAndGetToken();

        $created = $this->withToken($token)->postJson('/api/students', [
            'firstName' => 'Test',
            'middleName' => '',
            'lastName' => 'Student',
            'suffix' => '',
            'gender' => 'Male',
            'birthDate' => '2006-01-01',
            'birthPlace' => 'Manila',
            'nationality' => 'Filipino',
            'civilStatus' => 'Single',
            'contactNumber' => '9000000000',
            'email' => 'test.student@school.edu',
            'address' => 'Somewhere',
            'yearLevel' => 1,
            'section' => 'STEM-X',
            'studentType' => 'Regular',
            'enrollmentStatus' => 'Enrolled',
            'dateEnrolled' => '2024-06-01',
            'courseID' => 1,
            'departmentID' => 1,
        ])->assertCreated()->json();

        $sid = $created['studentID'];

        $this->withToken($token)->putJson("/api/students/{$sid}", [
            'section' => 'STEM-Y',
        ])->assertOk()->assertJsonFragment(['section' => 'STEM-Y']);

        $this->withToken($token)->deleteJson("/api/students/{$sid}")
            ->assertOk()
            ->assertJsonFragment(['ok' => true]);
    }
}

