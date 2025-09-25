<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function test()
    {
        // ... existing code ...
    }
    
    
    public function register(Request $request)
    {
        try {
            // Validación de datos
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed'
            ]);

            // Crear usuario
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role
            ]);

            // Generar token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Retornar respuesta
            return response()->json([
                'status' => 'success',
                'message' => 'Usuario registrado exitosamente',
                'user' => $user->only(['id', 'name', 'email', 'role']),
                'token' => $token
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error en el registro',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    public function login(Request $request)
    {
        try {
            // Validación básica
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => 'error', 
                    'message' => 'Credenciales inválidas'
                ], 401);
            }

            // Generar token de acceso
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login exitoso',
                'user' => $user->only(['id', 'name', 'email', 'role']),
                'token' => $token
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error en el proceso de login',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Revocar el token actual
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Sesión cerrada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al cerrar sesión',
                'error' => $e->getMessage()
            ], 400);
        }
    }
}