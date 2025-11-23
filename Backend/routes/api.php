<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\HomeAppointmentController;
use App\Http\Controllers\MobilePhlebotomistsController;
use App\Http\Controllers\AppointmentsController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\HospitalAppointmentController;
use App\Http\Controllers\HospitalController;
use App\Http\Controllers\DonorController;
use App\Http\Controllers\HospitalDashboardController;
use App\Http\Controllers\HospitalAppointmentManagementController;
use App\Http\Controllers\EmergencyRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\BloodInventoryController;
use App\Http\Controllers\HospitalSettingController;
use App\Http\Controllers\HomeVisitController;
use App\Http\Controllers\LivingDonorController;
use App\Http\Controllers\AfterDeathPledgeController;



Route::post('/login', [AuthenticatedSessionController::class, 'login']);
Route::middleware('auth:sanctum')->get('/user', [AuthenticatedSessionController::class, 'user']);
Route::middleware('auth:sanctum')->post('/logout', [AuthenticatedSessionController::class, 'logout']);

//Appointments Routes

//Blood donation Module - Public routes for viewing available appointments
Route::prefix('/blood')->group(function(){
    Route::get('/home_donation', [HomeAppointmentController::class, 'index']);
    Route::get('/home_donation/{id}', [HomeAppointmentController::class, 'show']);
    Route::post('/home_appointment', [HomeAppointmentController::class, 'store']);
});

Route::get('/test', function () {
    return response()->json(['message' => 'API connected successfully!']);
});

//Hospital Route
Route::get('/hospital', [HospitalController::class, 'index']);
Route::get('/hospital/{id}', [HospitalController::class, 'getHospital']);

//Hospital Appointment Route 
Route::post('/hospital/appointments', [HomeAppointmentController::class, 'store']);

//Living Organ Donation Routes - Public
Route::post('/organ/living-donor', [LivingDonorController::class, 'store']);

//After Death Organ Donation Routes - Public
Route::post('/organ/after-death-pledge', [AfterDeathPledgeController::class, 'store']);

//Admin Dashboard 
Route::prefix('/admin/dashboard')->group(function(){
    //Hospital Routes
    Route::post('/add-hospital', [HospitalController::class, 'store']);
    Route::get('/get-hospitals', [HospitalController::class, 'index']);
    //Donor Routes
    Route::post('/add-donor', [DonorController::class, 'store']);
    Route::get('/get-donors', [DonorController::class, 'index']);
    
    //Blood Types Route
    Route::get('/get-blood-types', [DonorController::class, 'getBloodTypes']);

    //Appointments Routes
    Route::post('/generate-appointments', [AppointmentsController::class, 'createHomeAppointments']);

    //Phlebotomist Routes
    Route::get('/get-phlebotomists', [MobilePhlebotomistsController::class, 'index']);
    Route::post('/add-phlebotomist', [MobilePhlebotomistsController::class, 'store']);

    //Home Visit Routes
    Route::get('/home-visit-orders', [HomeVisitController::class, 'getHomeVisitOrders']);
    Route::get('/home-visit-appointments', [HomeVisitController::class, 'getHomeVisitAppointments']);
    Route::post('/home-visit-orders/{orderCode}/assign-phlebotomist', [MobilePhlebotomistsController::class, 'assignPhlebotomist']);

    //Living Donor Routes
    Route::get('/living-donors', [LivingDonorController::class, 'index']);

    //After Death Pledge Routes
    Route::get('/after-death-pledges', [AfterDeathPledgeController::class, 'index']);
});

//Appointments Routes
