<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // ... existing code ...
    }

    public function boot()
    {
        Schema::defaultStringLength(191);
    }
}