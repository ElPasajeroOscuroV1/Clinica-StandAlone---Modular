<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Doctor; // <-- Importar el modelo Doctor
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log; // <-- Importar el facade Log

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
            $rules = [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|in:doctor,administrador,recepcionista,patient', // Assuming these are the only roles
            ];

            // Add phone validation if role is 'doctor'
            if ($request->input('role') === 'doctor') {
                $rules['phone'] = 'required|string|max:20';
            } else {
                // Phone is optional for other roles, but let's ensure it's not present if not needed
                // or handle it as nullable if it can be provided for other roles.
                // For now, we'll make it nullable if not a doctor.
                $rules['phone'] = 'nullable|string|max:20';
            }

            $request->validate($rules);

            // Crear usuario
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role
            ]);

            // Si el rol es 'doctor', crear un registro en la tabla de doctores
            if ($request->role === 'doctor') {
                $doctor = new Doctor();
                $doctor->name = $user->name;
                $doctor->email = $user->email;
                $doctor->user_id = $user->id;
                // Asignar valores por defecto para campos no proporcionados en el registro
                $doctor->specialty = 'General'; // O un valor por defecto apropiado
                // Asegurarse de que phone sea un string o null, y que la columna en la BD sea nullable
                $doctor->phone = is_string($request->phone) ? $request->phone : null;
                $doctor->available = true; // Por defecto, el doctor está disponible
                $doctor->save();

                // Opcional: puedes querer asociar el doctor al usuario si la relación está definida
                // $user->doctor()->save($doctor); // Si la relación hasOne está configurada correctamente
            }

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
            // Log the error for debugging purposes
            Log::error('Error during registration process', [
                'message' => $e->getMessage(),
                'user_input' => $request->all(),
                'exception_details' => $e // Log the full exception object if possible
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error en el registro',
                'error' => $e->getMessage() // Expose the error message to the client for debugging
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
