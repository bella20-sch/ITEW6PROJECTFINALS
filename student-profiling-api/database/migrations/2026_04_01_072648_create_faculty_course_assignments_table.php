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
        Schema::create('faculty_course_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('facultyID')->index();
            $table->unsignedInteger('courseID')->index();
            $table->string('section')->nullable();
            $table->timestamps();
            $table->unique(['facultyID', 'courseID', 'section']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('faculty_course_assignments');
    }
};
