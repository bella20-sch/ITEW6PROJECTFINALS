<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Violation extends Model
{
    use HasFactory;

    protected $primaryKey = 'violationID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'violationID',
        'studentID',
        'violationType',
        'severityLevel',
        'description',
        'dateReported',
        'reportedBy',
        'actionTaken',
        'status',
        'resolutionDate',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentID', 'studentID');
    }
}
