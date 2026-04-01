<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Affiliation extends Model
{
    use HasFactory;

    protected $primaryKey = 'affiliationID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'affiliationID',
        'studentID',
        'organizationName',
        'position',
        'dateJoined',
        'dateEnded',
        'status',
        'adviserName',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentID', 'studentID');
    }
}
