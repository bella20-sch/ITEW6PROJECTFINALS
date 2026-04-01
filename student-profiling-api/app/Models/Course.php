<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $primaryKey = 'courseID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'courseID',
        'courseCode',
        'courseName',
        'totalUnits',
        'departmentID',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'departmentID', 'departmentID');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'courseID', 'courseID');
    }
}
