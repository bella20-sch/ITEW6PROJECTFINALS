<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'facultyID',
        'courseID',
        'section',
        'title',
        'description',
        'deadline',
        'allow_late',
    ];
}
