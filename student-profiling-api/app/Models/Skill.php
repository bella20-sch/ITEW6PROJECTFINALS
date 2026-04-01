<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;

    protected $primaryKey = 'skillID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'skillID',
        'studentID',
        'skillName',
        'category',
        'description',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'studentID', 'studentID');
    }
}
