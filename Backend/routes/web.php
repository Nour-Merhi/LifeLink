<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

Route::get('/favicon.ico', fn () => response('', 204));

require __DIR__.'/auth.php';
