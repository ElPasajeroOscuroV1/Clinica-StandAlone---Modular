import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importamos HttpClient para realizar peticiones HTTP
import { Observable } from 'rxjs'; // Para manejar respuestas asíncronas
import { tap } from 'rxjs/operators'; // Operador para efectos secundarios en el flujo de datos

// Definición de interfaces para tipar las respuestas del servidor
interface LoginResponse {
  status: string;    // Estado de la respuesta ('success' o 'error')
  user: any;         // Datos del usuario
  token?: string;    // Token de autenticación (opcional)
}

interface AuthResponse {
  message: string;   // Mensaje de la respuesta
  status: string;    // Estado de la respuesta
}

@Injectable({
  providedIn: 'root'  // Servicio disponible en toda la aplicación
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api';  // URL base del backend
  private token: string | null = null;           // Almacena el token de autenticación

  constructor(private http: HttpClient) {
    // Al iniciar el servicio, intenta recuperar el token almacenado
    this.token = localStorage.getItem('auth_token');
  }

  // Método privado para generar los headers de las peticiones HTTP
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'  // Establece el tipo de contenido como JSON
    });

    // Si existe un token, lo añade al header de autorización
    if (this.token) {
      headers = headers.set('Authorization', `Bearer ${this.token}`);
    }

    return headers;
  }

  // Método para probar la conexión con el backend
  getTest(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/test`, {
      headers: this.getHeaders()  // Incluye los headers de autorización
    });
  }

  // Método para realizar el login
  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          // Si la respuesta incluye un token, lo almacena
          if (response.token) {
            this.token = response.token;
            localStorage.setItem('auth_token', response.token);
          }
        })
      );
  }

  // Método para cerrar sesión
  logout(): void {
    this.token = null;  // Elimina el token del servicio
    // Limpia todos los datos de autenticación del localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.token;  // Convierte el token a booleano (true si existe, false si es null)
  }
  
}