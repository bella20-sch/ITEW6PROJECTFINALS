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
        Schema::create('affiliations', function (Blueprint $table) {
            $table->unsignedInteger('affiliationID')->primary();
            $table->unsignedInteger('studentID')->index();
            $table->string('organizationName');
            $table->string('position')->nullable();
            $table->date('dateJoined')->nullable();
            $table->date('dateEnded')->nullable();
            $table->string('status')->nullable();
            $table->string('adviserName')->nullable();
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
        Schema::dropIfExists('affiliations');
    }
};
