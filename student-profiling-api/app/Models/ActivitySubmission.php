<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivitySubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'studentID',
        'content',
        'submitted_at',
        'is_late',
    ];
}
