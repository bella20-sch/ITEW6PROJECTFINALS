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
        Schema::create('medical_histories', function (Blueprint $table) {
            $table->unsignedInteger('medicalID')->primary();
            $table->unsignedInteger('studentID')->index();
            $table->string('bloodType')->nullable();
            $table->string('medicalConditions')->nullable();
            $table->string('emergencyContactName')->nullable();
            $table->string('emergencyContactRelationship')->nullable();
            $table->string('emergencyContactNumber')->nullable();
            $table->string('emergencyContactAddress')->nullable();
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
        Schema::dropIfExists('medical_histories');
    }
};
