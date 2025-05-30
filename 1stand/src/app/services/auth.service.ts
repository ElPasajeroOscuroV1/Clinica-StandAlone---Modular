import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
//import { finalize } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';

// Agregar esta interfaz después de los imports
interface AuthResponse {
  token: string;
  // Agrega otros campos si la respuesta del backend incluye más información
}
//@Injectable({
//  providedIn: 'root'
//})
//
export const authGuard = () => {
  const router = inject(Router);

  if (localStorage.getItem('isLoggedIn') === 'true'){
    return true;
  }

  return router.navigate(['/login']);
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }
  /*
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }
  */
  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        if (response.token) {
          this.setSession(response);
        }
      }),
      catchError((error) => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }
  /*
  logout(): Observable<any> {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    return this.http.post(`${this.apiUrl}/auth/logout`, {});
  }
  */
  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('token');
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { headers }).pipe(
      finalize(() => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('token');
      })
    );
  }

  setSession(authResult: any) {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('isLoggedIn', 'true');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}