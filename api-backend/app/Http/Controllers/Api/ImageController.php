<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    /**
     * Return a face image encoded as base64 so that the frontend can embed it without CORS errors.
     */
    public function showFace(string $filename): JsonResponse
    {
        // Prevent directory traversal
        $safeFilename = basename($filename);

        $diskPath = "faces/{$safeFilename}";

        if (!Storage::disk('public')->exists($diskPath)) {
            return response()->json([
                'message' => 'Image not found.',
            ], 404);
        }

        $fileContents = Storage::disk('public')->get($diskPath);
        $mimeType = Storage::disk('public')->mimeType($diskPath) ?? 'image/png';

        return response()->json([
            'base64' => 'data:' . $mimeType . ';base64,' . base64_encode($fileContents),
        ]);
    }
}
