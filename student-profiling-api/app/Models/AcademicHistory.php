<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicHistory extends Model
{
    use HasFactory;

    protected $primaryKey = 'academicID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'academicID',
        'studentID',
        'schoolYear',
        'semester',
        'gpa',
        'academicStanding',
        'totalUnits',
        'completedUnits',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentID', 'studentID');
    }
}
