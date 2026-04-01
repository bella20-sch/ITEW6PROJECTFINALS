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
        Schema::create('activity_submissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('activity_id')->index();
            $table->unsignedInteger('studentID')->index();
            $table->text('content')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->boolean('is_late')->default(false);
            $table->timestamps();
            $table->unique(['activity_id', 'studentID']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('activity_submissions');
    }
};
