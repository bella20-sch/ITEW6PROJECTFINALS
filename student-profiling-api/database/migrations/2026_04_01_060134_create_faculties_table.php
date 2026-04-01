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
        Schema::create('faculties', function (Blueprint $table) {
            $table->unsignedInteger('facultyID')->primary();
            $table->unsignedInteger('departmentID')->index();
            $table->string('firstName');
            $table->string('lastName');
            $table->string('position')->nullable();
            $table->string('employmentStatus')->nullable();
            $table->date('hireDate')->nullable();
            $table->string('email')->unique();
            $table->string('contactNumber')->nullable();
            $table->string('officeLocation')->nullable();
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
        Schema::dropIfExists('faculties');
    }
};
