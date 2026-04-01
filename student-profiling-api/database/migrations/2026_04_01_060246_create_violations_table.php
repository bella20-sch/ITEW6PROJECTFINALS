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
        Schema::create('violations', function (Blueprint $table) {
            $table->unsignedInteger('violationID')->primary();
            $table->unsignedInteger('studentID')->index();
            $table->string('violationType')->nullable();
            $table->string('severityLevel')->nullable();
            $table->string('description')->nullable();
            $table->date('dateReported')->nullable();
            $table->string('reportedBy')->nullable();
            $table->string('actionTaken')->nullable();
            $table->string('status')->nullable();
            $table->date('resolutionDate')->nullable();
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
        Schema::dropIfExists('violations');
    }
};
