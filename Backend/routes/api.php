<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\HomeAppointmentController;
use App\Http\Controllers\AuthenticatedSessionController;


Route::post('/login', [AuthenticatedSessionController::class, 'login']);
Route::middleware('auth:sanctum')->get('/user', [AuthenticatedSessionController::class, 'user']);
Route::middleware('auth:sanctum')->post('/logout', [AuthenticatedSessionController::class, 'logout']);

//Appointments Routes
Route::post('/appointments', [AppointmentsContoller::class, 'createAppointment']);
Route::get('/appointmnets', [AppointmentsContoller::class, 'showAppointments']);

//Blood donation Module
Route::middleware('auth:sanctum')->prefix('/blood')->group(function(){
    Route::get('/home_donation', [HomeAppointmentController::class, 'index']);
    Route::get('/home_donation/{id}', [HomeAppointmentController::class, 'show']);
});

Route::get('/test', function () {
    return response()->json(['message' => 'API connected successfully!']);
});