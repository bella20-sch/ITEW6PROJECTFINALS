<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForceJsonResponse
{
    public function handle(Request $request, Closure $next)
    {
        // Ensures API routes never redirect with HTML on validation/auth errors.
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}

