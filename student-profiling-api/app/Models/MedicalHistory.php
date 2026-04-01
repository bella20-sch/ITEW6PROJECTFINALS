<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalHistory extends Model
{
    use HasFactory;

    protected $primaryKey = 'medicalID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'medicalID',
        'studentID',
        'bloodType',
        'medicalConditions',
        'emergencyContactName',
        'emergencyContactRelationship',
        'emergencyContactNumber',
        'emergencyContactAddress',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentID', 'studentID');
    }
}
