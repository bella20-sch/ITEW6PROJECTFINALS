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
        Schema::create('academic_histories', function (Blueprint $table) {
            $table->unsignedInteger('academicID')->primary();
            $table->unsignedInteger('studentID')->index();
            $table->string('schoolYear')->nullable();
            $table->string('semester')->nullable();
            $table->decimal('gpa', 3, 2)->nullable();
            $table->string('academicStanding')->nullable();
            $table->unsignedInteger('totalUnits')->nullable();
            $table->unsignedInteger('completedUnits')->nullable();
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
        Schema::dropIfExists('academic_histories');
    }
};
