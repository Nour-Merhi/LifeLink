<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        // IMPORTANT:
        // Do NOT force Sanctum's "stateful SPA" middleware onto all API routes.
        // When enabled, it boots sessions + CSRF for cross-site requests, which
        // breaks token-based auth flows (e.g. Vercel -> Railway) with 419 errors.
        // If you later host frontend+backend on the same top-level domain and want
        // cookie-based SPA auth, apply this middleware only to those routes.

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle exceptions for API routes to ensure CORS headers are sent
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('sanctum/*')) {
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                
                return response()->json([
                    'message' => $e->getMessage() ?: 'Server Error',
                    'error' => config('app.debug') ? [
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString()
                    ] : 'An error occurred'
                ], $statusCode)->header('Access-Control-Allow-Origin', $request->headers->get('Origin', '*'))
                  ->header('Access-Control-Allow-Credentials', 'true')
                  ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                  ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN');
            }
        });
    })->create();
