<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_unique(array_merge(
        [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://life-link-react-app.vercel.app',
        ],
        env('FRONTEND_URL') ? [
            parse_url(env('FRONTEND_URL'), PHP_URL_SCHEME) . '://' . parse_url(env('FRONTEND_URL'), PHP_URL_HOST)
        ] : []
    ))),

    'allowed_origins_patterns' => [
        '#^http://localhost:\d+$#',  // Allow any localhost port (for Flutter web)
        '#^http://127\.0\.0\.1:\d+$#',  // Allow any 127.0.0.1 port
        '#^https://.*\.vercel\.app$#',  // Allow any Vercel deployment
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Authorization'],

    'max_age' => 86400, // 24 hours

    'supports_credentials' => true,

];
