<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $primaryKey = 'departmentID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'departmentID',
        'departmentName',
        'officeLocation',
        'contactNumber',
    ];

    public function courses()
    {
        return $this->hasMany(Course::class, 'departmentID', 'departmentID');
    }

    public function faculty()
    {
        return $this->hasMany(Faculty::class, 'departmentID', 'departmentID');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'departmentID', 'departmentID');
    }
}
