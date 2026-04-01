<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Student extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'studentID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'studentID',
        'firstName',
        'middleName',
        'lastName',
        'suffix',
        'gender',
        'birthDate',
        'birthPlace',
        'nationality',
        'civilStatus',
        'contactNumber',
        'email',
        'address',
        'yearLevel',
        'section',
        'studentType',
        'enrollmentStatus',
        'dateEnrolled',
        'courseID',
        'departmentID',
        'adviserFacultyID',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'courseID', 'courseID');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'departmentID', 'departmentID');
    }

    public function academicHistory()
    {
        return $this->hasMany(AcademicHistory::class, 'studentID', 'studentID');
    }

    public function medicalHistory()
    {
        return $this->hasMany(MedicalHistory::class, 'studentID', 'studentID');
    }

    public function guardians()
    {
        return $this->hasMany(Guardian::class, 'studentID', 'studentID');
    }

    public function skills()
    {
        return $this->hasMany(Skill::class, 'studentID', 'studentID');
    }

    public function affiliations()
    {
        return $this->hasMany(Affiliation::class, 'studentID', 'studentID');
    }

    public function violations()
    {
        return $this->hasMany(Violation::class, 'studentID', 'studentID');
    }
}
