<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\MetaController;
use App\Http\Controllers\StudentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
});

Route::get('/health', function () {
    return response()->json(['ok' => true]);
});

Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    Route::post('/students', [AdminController::class, 'createStudent']);
    Route::post('/faculty', [AdminController::class, 'createFaculty']);
    Route::post('/faculty-assignments', [AdminController::class, 'assignFacultyCourse']);
    Route::put('/students/{studentId}/assignment', [AdminController::class, 'assignStudent']);
});

Route::prefix('meta')->middleware('auth:sanctum')->group(function () {
    Route::get('/departments', [MetaController::class, 'departments']);
    Route::get('/courses', [MetaController::class, 'courses']);
    Route::get('/faculty', [MetaController::class, 'faculty']);

    Route::post('/departments', [MetaController::class, 'createDepartment']);
    Route::put('/departments/{id}', [MetaController::class, 'updateDepartment']);
    Route::delete('/departments/{id}', [MetaController::class, 'deleteDepartment']);

    Route::post('/courses', [MetaController::class, 'createCourse']);
    Route::put('/courses/{id}', [MetaController::class, 'updateCourse']);
    Route::delete('/courses/{id}', [MetaController::class, 'deleteCourse']);

    Route::post('/faculty', [MetaController::class, 'createFaculty']);
    Route::put('/faculty/{id}', [MetaController::class, 'updateFaculty']);
    Route::delete('/faculty/{id}', [MetaController::class, 'deleteFaculty']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::get('/students/{id}', [StudentController::class, 'show']);
    Route::put('/students/{id}', [StudentController::class, 'update']);
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);

    Route::get('/me/assignments', [ActivityController::class, 'myAssignments']);
    Route::get('/me/activities', [ActivityController::class, 'myActivities']);
    Route::get('/me/materials', [ActivityController::class, 'myMaterials']);
    Route::post('/faculty/activities', [ActivityController::class, 'createActivity']);
    Route::post('/faculty/materials', [ActivityController::class, 'createMaterial']);
    Route::post('/student/activities/{activityId}/submit', [ActivityController::class, 'submit']);
});
