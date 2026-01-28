<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as Middleware;

class SanctumCsrfMiddleware extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Token-based login (Vercel -> Railway) must NOT require CSRF.
        // Even if SANCTUM_STATEFUL_DOMAINS is misconfigured and Sanctum treats
        // the request as "stateful", we want this endpoint to remain stateless.
        'api/mobile/login',
    ];

    /**
     * Determine if the request should be excluded from CSRF verification.
     * This runs before tokensMatch, so we can skip CSRF for certain routes if needed.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function inExceptArray($request)
    {
        return parent::inExceptArray($request);
    }

    /**
     * Determine if the session and input CSRF tokens match.
     * Override to allow cookie-only validation for Sanctum SPA cross-domain requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function tokensMatch($request)
    {
        $cookieToken = $request->cookie('XSRF-TOKEN');

        if ($cookieToken) {
            try {
                if ($request->hasSession()) {
                    $session = $request->session();

                    if ($session->isStarted() || $session->getId()) {
                        $sessionToken = $session->token();
                        $decodedCookieToken = urldecode($cookieToken);

                        if (hash_equals($sessionToken, $decodedCookieToken)) {
                            return true;
                        }
                    }
                }
            } catch (\Exception $e) {
                if (config('app.debug')) {
                    \Log::debug('CSRF cookie validation error (falling back to default):', [
                        'error' => $e->getMessage(),
                        'route' => $request->path()
                    ]);
                }
            }
        }

        // Fall back to Laravel's default CSRF validation
        return parent::tokensMatch($request);
    }
}