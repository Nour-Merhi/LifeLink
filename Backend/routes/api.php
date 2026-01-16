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
use App\Http\Controllers\BloodHeroesController;
use App\Http\Controllers\LivingDonorController;
use App\Http\Controllers\AfterDeathPledgeController;
use App\Http\Controllers\HospitalsController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DonorDashboardController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\RewardsController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\NurseDashboardController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\FinancialDonationController;
use App\Http\Controllers\PatientCaseController;
use App\Http\Controllers\Admin\FinancialController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminAppointmentsController;
use App\Http\Controllers\HospitalDonorManagementController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\HomeAppointmentRatingController;


Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [AuthenticatedSessionController::class, 'login']);
Route::middleware('auth:sanctum')->get('/user', [AuthenticatedSessionController::class, 'user']);
Route::middleware('auth:sanctum')->post('/logout', [AuthenticatedSessionController::class, 'logout']);

// Donor Dashboard Routes
Route::middleware('auth:sanctum')->prefix('/donor')->group(function(){
    Route::get('/dashboard', [DonorDashboardController::class, 'index']);
    Route::get('/my-donations', [DonorDashboardController::class, 'myDonations']);
    Route::get('/my-appointments', [DonorDashboardController::class, 'myAppointments']);
    Route::get('/rewards', [RewardsController::class, 'index']);
    // Home appointment ratings (donor only)
    Route::get('/home-appointments/{homeAppointment}/rating', [HomeAppointmentRatingController::class, 'show']);
    Route::put('/home-appointments/{homeAppointment}/rating', [HomeAppointmentRatingController::class, 'upsert']);
});

// Nurse Dashboard Routes
Route::middleware('auth:sanctum')->prefix('/nurse')->group(function(){
    Route::get('/dashboard', [NurseDashboardController::class, 'index']);
    Route::get('/my-appointments', [NurseDashboardController::class, 'myAppointments']);
    Route::get('/donor-requests', [NurseDashboardController::class, 'donorRequests']);
    Route::get('/hospital-info', [NurseDashboardController::class, 'hospitalInfo']);
    Route::get('/manager-contact', [NurseDashboardController::class, 'managerContact']);
    Route::get('/messages', [NurseDashboardController::class, 'getMessages']);
    Route::post('/messages', [NurseDashboardController::class, 'sendMessage']);
    Route::post('/start-appointment/{appointmentId}', [NurseDashboardController::class, 'startAppointment']);
    Route::get('/leaderboard', [NurseDashboardController::class, 'leaderboard']);
});

// Hospital Dashboard Routes
Route::middleware('auth:sanctum')->prefix('/hospital/dashboard')->group(function(){
    Route::get('/overview/{hospitalId?}', [HospitalDashboardController::class, 'overview']);
    Route::get('/appointments/{hospitalId?}', [HospitalDashboardController::class, 'getAppointments']);
    Route::get('/urgent-requests', [HospitalAppointmentManagementController::class, 'getUrgentRequests']);
    Route::post('/appointments', [HospitalAppointmentManagementController::class, 'store']);
    Route::post('/generate-appointments/{hospitalId?}', [AppointmentsController::class, 'createHomeAppointments']);
    Route::post('/generate-hospital-appointments/{hospitalId?}', [AppointmentsController::class, 'createHospitalAppointments']);

    // More specific route first (with donorCode)
    Route::get('/donors/{hospitalId}/{donorCode}', [HospitalDonorManagementController::class, 'getDonor']);
    // Less specific route after (just hospitalId)
    Route::get('/donors/{hospitalId}', [HospitalDonorManagementController::class, 'getDonors']);
    // Update appointment status
    Route::put('/donors/{hospitalId}/{donorId}/appointments/status', [HospitalDonorManagementController::class, 'updateAppointmentStatus']);
    // Get latest appointment for a donor
    Route::get('/donors/{hospitalId}/{donorId}/latest-appointment', [HospitalDonorManagementController::class, 'getDonorLatestAppointment']);
});

//Admin Dashboard 
Route::middleware('auth:sanctum')->prefix('/admin/dashboard')->group(function(){
    //Hospital Routes
    Route::post('/add-hospital', [HospitalController::class, 'store']);
    Route::get('/get-hospitals', [HospitalController::class, 'index']);
    Route::get('/hospitals/{code}', [HospitalController::class, 'show']);
    Route::put('/hospitals/{code}', [HospitalController::class, 'update']);
    Route::delete('/hospitals/{code}', [HospitalController::class, 'destroy']);
    //Donor Routes
    Route::post('/add-donor', [DonorController::class, 'store']);
    Route::get('/get-donors', [DonorController::class, 'index']);
    Route::get('/donors/{code}', [DonorController::class, 'show']);
    Route::put('/donors/{code}', [DonorController::class, 'update']);
    Route::delete('/donors/{code}', [DonorController::class, 'destroy']);
    
    //Blood Types Route
    Route::get('/get-blood-types', [DonorController::class, 'getBloodTypes']);

    //Appointments Routes
    Route::post('/generate-appointments', [AppointmentsController::class, 'createHomeAppointments']);
    Route::post('/generate-hospital-appointments', [AppointmentsController::class, 'createHospitalAppointments']);
    Route::get('/appointments/{appointment}', [AppointmentsController::class, 'show']);
    Route::put('/appointments/{appointment}', [AppointmentsController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentsController::class, 'destroy']);

    //Phlebotomist Routes
    Route::get('/get-phlebotomists', [MobilePhlebotomistsController::class, 'index']);
    Route::get('/phlebotomists/{code}', [MobilePhlebotomistsController::class, 'show']);
    Route::put('/phlebotomists/{code}', [MobilePhlebotomistsController::class, 'update']);
    Route::delete('/phlebotomists/{code}', [MobilePhlebotomistsController::class, 'destroy']);
    Route::post('/add-phlebotomist', [MobilePhlebotomistsController::class, 'store']);

    //Home Visit Routes
    Route::get('/home-visit-orders', [HomeVisitController::class, 'getHomeVisitOrders']);
    Route::get('/home-visit-orders/{code}', [HomeVisitController::class, 'showHomeVisitOrder']);
    Route::put('/home-visit-orders/{code}', [HomeVisitController::class, 'updateHomeVisitOrder']);
    Route::delete('/home-visit-orders/{code}', [HomeVisitController::class, 'destroyHomeVisitOrder']);
    Route::get('/home-visit-appointments', [HomeVisitController::class, 'getHomeVisitAppointments']);
    Route::get('/home-visit-appointments/hospital/{hospitalId}', [HomeVisitController::class, 'getHospitalHomeVisitAppointments']);
    Route::post('/home-visit-orders/{orderCode}/assign-phlebotomist', [MobilePhlebotomistsController::class, 'assignPhlebotomist']);

    //Hospital Appointment Routes
    Route::get('/hospital-appointments', [HospitalAppointmentController::class, 'getHospitalAppointments']);
    Route::get('/hospital-appointments/{code}', [HospitalAppointmentController::class, 'showHospitalAppointment']);
    Route::put('/hospital-appointments/{code}', [HospitalAppointmentController::class, 'update']);
    Route::delete('/hospital-appointments/{code}', [HospitalAppointmentController::class, 'destroy']);
    Route::get('/hospital-visit-appointments', [HospitalAppointmentController::class, 'getHospitalVisitAppointments']);
    Route::get('/hospital-visit-appointments/hospital/{hospitalId?}', [HospitalAppointmentController::class, 'getHospitalAppointmentsForHospital']);
    
    //Critical/Urgent Appointments Routes
    Route::get('/critical-appointments', [AdminAppointmentsController::class, 'getCriticalAppointments']);

    //Living Donor Routes
    Route::get('/living-donors', [LivingDonorController::class, 'index']);

    //After Death Pledge Routes
    Route::get('/after-death-pledges', [AfterDeathPledgeController::class, 'index']);

    //Article Routes
    Route::get('/articles', [ArticleController::class, 'indexAdmin']);
    Route::post('/articles', [ArticleController::class, 'store']);
    Route::get('/articles/{code}', [ArticleController::class, 'show']);
    Route::put('/articles/{code}', [ArticleController::class, 'update']);
    Route::delete('/articles/{code}', [ArticleController::class, 'destroy']);

    //Financial Dashboard Routes
    Route::get('/financial/metrics', [FinancialController::class, 'getMetrics']);
    Route::get('/financial/top-donors', [FinancialController::class, 'getTopDonors']);
    Route::get('/financial/active-cases', [FinancialController::class, 'getActiveCases']);
    Route::get('/financial/patient-cases', [FinancialController::class, 'getAllPatientCases']);
    Route::post('/financial/patient-cases', [FinancialController::class, 'storePatientCase']);
    Route::get('/financial/patient-cases/{id}', [FinancialController::class, 'getPatientCaseDetails']);
    Route::put('/financial/patient-cases/{id}', [FinancialController::class, 'updatePatientCase']);
    Route::get('/financial/transactions', [FinancialController::class, 'getTransactions']);
    Route::put('/financial/transactions/{id}', [FinancialDonationController::class, 'update']); // Update transaction (admin only)
    Route::delete('/financial/transactions/{id}', [FinancialDonationController::class, 'destroy']); // Delete transaction (admin only)

    // Admin Settings Routes
    Route::get('/settings', [AdminSettingsController::class, 'getSettings']);
    Route::put('/settings/general', [AdminSettingsController::class, 'updateGeneralSettings']);
    Route::put('/settings/medical', [AdminSettingsController::class, 'updateMedicalSettings']);
});

//Quiz Routes (some public, some require auth)
Route::get('/quiz/leaderboard', [QuizController::class, 'getLeaderboard']); // Public leaderboard

//Quiz and Mini Game Routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
        //Quiz Routes
        Route::get('/quiz/questions/{level}', [QuizController::class, 'getQuestions']);
        Route::get('/quiz/progress', [QuizController::class, 'getProgress']);
        Route::get('/quiz/history', [QuizController::class, 'getQuizHistory']);
        Route::post('/quiz/answer-question', [QuizController::class, 'answerQuestion']);
        Route::post('/quiz/complete-level', [QuizController::class, 'completeLevel']);

    //Mini Game Routes
    Route::post('/mini-game/play', [MiniGameController::class, 'playGame']);
});


// Settings Routes (for all authenticated users)
Route::middleware('auth:sanctum')->prefix('/settings')->group(function(){
    // Get all settings at once (optimized)
    Route::get('/all', [SettingsController::class, 'getAll']);
    
    // Profile
    Route::get('/profile', [SettingsController::class, 'getProfile']);
    Route::put('/profile', [SettingsController::class, 'updateProfile']);
    
    // Medical Information
    Route::get('/medical', [SettingsController::class, 'getMedicalInfo']);
    Route::put('/medical', [SettingsController::class, 'updateMedicalInfo']);
    
    // Password
    Route::put('/password', [SettingsController::class, 'updatePassword']);
    
    // Notifications
    Route::get('/notifications', [SettingsController::class, 'getNotificationSettings']);
    Route::put('/notifications', [SettingsController::class, 'updateNotificationSettings']);
    
    // Communication Preferences
    Route::get('/communication', [SettingsController::class, 'getCommunicationPreferences']);
    Route::put('/communication', [SettingsController::class, 'updateCommunicationPreferences']);

    // Danger zone
    Route::delete('/account', [SettingsController::class, 'deleteAccount']);
});

// Support Routes
Route::prefix('/support')->group(function(){
    // Public route - anyone can submit a support ticket
    Route::post('/tickets', [SupportController::class, 'store']);
    
    // Protected routes - only authenticated users can view their tickets
    Route::middleware('auth:sanctum')->group(function(){
        Route::get('/tickets', [SupportController::class, 'index']);
        Route::get('/tickets/{id}', [SupportController::class, 'show']);
    });
});


//Blood donation Module - Public routes for viewing available appointments
Route::prefix('/blood')->group(function(){
    Route::get('/home_donation', [HomeAppointmentController::class, 'index']);
    Route::get('/home_donation/{id}', [HomeAppointmentController::class, 'show']);
    Route::post('/home_appointment', [HomeAppointmentController::class, 'store']);
    Route::get('/hospital_donation', [HospitalAppointmentController::class, 'index']);
    Route::get('/hospital_donation/{id}', [HospitalAppointmentController::class, 'show']);
    Route::post('/appointments', [AppointmentsController::class, 'createAppointment']);
    Route::get('/appointmnets', [AppointmentsController::class, 'showAppointments']);
});

Route::get('/test', function () {
    return response()->json(['message' => 'API connected successfully!']);
});

// Public route for blood types
Route::get('/blood-types', [DonorController::class, 'getBloodTypes']);

//Hospital Route
Route::get('/hospital', [HospitalController::class, 'index']);
Route::get('/hospital/{id}', [HospitalController::class, 'getHospital']);

//Living Organ Donation Routes - Public
Route::post('/organ/living-donor', [LivingDonorController::class, 'store']);

//After Death Organ Donation Routes - Public
Route::post('/organ/after-death-pledge', [AfterDeathPledgeController::class, 'store']);



//Appointments Routes
Route::get('/hospital', [HospitalsController::class, 'index']);
Route::get('/hospital/{id}', [HospitalsController::class, 'getHospital']);

// Public Article Routes
Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{id}', [ArticleController::class, 'show']);

// Public Blood Heroes Route
Route::get('/blood-heroes', [BloodHeroesController::class, 'index']);

//Hospital Appointment Route 
Route::post('/hospital/appointments', [HospitalAppointmentController::class, 'store']);

// Financial Donation Routes
Route::post('/financial-donations', [FinancialDonationController::class, 'store']); // Public route for submitting donations
Route::middleware('auth:sanctum')->group(function() {
    Route::get('/financial-donations', [FinancialDonationController::class, 'index']); // View donations (own or all if admin)
    Route::get('/financial-donations/{id}', [FinancialDonationController::class, 'show']); // View specific donation
});

// Patient Cases Routes (Public)
Route::get('/patient-cases', [PatientCaseController::class, 'index']); // Get active patient cases
Route::get('/patient-cases/{id}', [PatientCaseController::class, 'show']); // Get specific patient case