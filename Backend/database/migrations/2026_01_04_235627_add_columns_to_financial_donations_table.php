<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if table exists, if not create it
        if (!Schema::hasTable('financial_donations')) {
            Schema::create('financial_donations', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->foreignId('donor_id')->nullable()->references('id')->on('donors')->onDelete('set null');
                $table->string('name')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                $table->enum('donation_type', ['one time', 'monthly'])->default('one time');
                $table->decimal('donation_amount', 10, 2);
                $table->enum('recipient_chosen', ['general patient', 'specific patient'])->default('general patient');
                $table->unsignedBigInteger('patient_case_id')->nullable();
                $table->enum('payment_method', ['credit card', 'wish', 'paypal'])->default('credit card');
                $table->enum('preference', ['anonymous', 'stay_updated'])->nullable();
                $table->enum('status', ['pending', 'completed', 'failed', 'canceled'])->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        } else {
            // If table exists, add missing columns
            Schema::table('financial_donations', function (Blueprint $table) {
                if (!Schema::hasColumn('financial_donations', 'code')) {
                    $table->string('code')->unique()->after('id');
                }
                if (!Schema::hasColumn('financial_donations', 'donor_id')) {
                    $table->foreignId('donor_id')->nullable()->references('id')->on('donors')->onDelete('set null')->after('code');
                }
                if (!Schema::hasColumn('financial_donations', 'name')) {
                    $table->string('name')->nullable()->after('donor_id');
                }
                if (!Schema::hasColumn('financial_donations', 'email')) {
                    $table->string('email')->nullable()->after('name');
                }
                if (!Schema::hasColumn('financial_donations', 'phone')) {
                    $table->string('phone')->nullable()->after('email');
                }
                if (!Schema::hasColumn('financial_donations', 'address')) {
                    $table->text('address')->nullable()->after('phone');
                }
                if (!Schema::hasColumn('financial_donations', 'donation_type')) {
                    $table->enum('donation_type', ['one time', 'monthly'])->default('one time')->after('address');
                }
                if (!Schema::hasColumn('financial_donations', 'donation_amount')) {
                    $table->decimal('donation_amount', 10, 2)->after('donation_type');
                }
                if (!Schema::hasColumn('financial_donations', 'recipient_chosen')) {
                    $table->enum('recipient_chosen', ['general patient', 'specific patient'])->default('general patient')->after('donation_amount');
                }
                if (!Schema::hasColumn('financial_donations', 'patient_case_id')) {
                    $table->unsignedBigInteger('patient_case_id')->nullable()->after('recipient_chosen');
                }
                if (!Schema::hasColumn('financial_donations', 'payment_method')) {
                    $table->enum('payment_method', ['credit card', 'wish', 'paypal'])->default('credit card')->after('patient_case_id');
                }
                if (!Schema::hasColumn('financial_donations', 'preference')) {
                    $table->enum('preference', ['anonymous', 'stay_updated'])->nullable()->after('payment_method');
                }
                if (!Schema::hasColumn('financial_donations', 'status')) {
                    $table->enum('status', ['pending', 'completed', 'failed', 'canceled'])->default('pending')->after('preference');
                }
                if (!Schema::hasColumn('financial_donations', 'notes')) {
                    $table->text('notes')->nullable()->after('status');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only drop if we're sure it's safe
        // Schema::dropIfExists('financial_donations');
    }
};
