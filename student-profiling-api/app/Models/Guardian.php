<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guardian extends Model
{
    use HasFactory;

    protected $primaryKey = 'guardianID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'guardianID',
        'studentID',
        'guardianName',
        'relationship',
        'contactNumber',
        'email',
        'occupation',
        'address',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentID', 'studentID');
    }
}
