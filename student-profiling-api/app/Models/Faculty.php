<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Faculty extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'faculties';

    protected $primaryKey = 'facultyID';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'facultyID',
        'departmentID',
        'firstName',
        'lastName',
        'position',
        'employmentStatus',
        'hireDate',
        'email',
        'contactNumber',
        'officeLocation',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'departmentID', 'departmentID');
    }
}
