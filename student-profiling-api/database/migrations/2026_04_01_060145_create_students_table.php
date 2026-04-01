<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->unsignedInteger('studentID')->primary();
            $table->string('firstName');
            $table->string('middleName')->nullable();
            $table->string('lastName');
            $table->string('suffix')->nullable();
            $table->string('gender')->nullable();
            $table->date('birthDate')->nullable();
            $table->string('birthPlace')->nullable();
            $table->string('nationality')->nullable();
            $table->string('civilStatus')->nullable();
            $table->string('contactNumber')->nullable();
            $table->string('email')->unique();
            $table->string('address')->nullable();
            $table->unsignedInteger('yearLevel')->nullable();
            $table->string('section')->nullable();
            $table->string('studentType')->nullable();
            $table->string('enrollmentStatus')->nullable();
            $table->date('dateEnrolled')->nullable();
            $table->unsignedInteger('courseID')->index();
            $table->unsignedInteger('departmentID')->index();
            $table->string('password')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('students');
    }
};
