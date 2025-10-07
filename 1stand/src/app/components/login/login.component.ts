import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  template: `
  <div class="login-container">
    <div class="login-card">
      <div class="logo-container">
        <img src="assets/logo-diente.jpg" alt="Logo Clínica" class="logo" />
        <h2 class="title">Clínica Odontológica</h2>
        <p class="subtitle">Accede a tu cuenta</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
        <!-- Campo Email -->
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="ejemplo@correo.com"
            [class.invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
          />
          <small class="error" *ngIf="getFieldError('email')">
            {{ getFieldError('email') }}
          </small>
        </div>

        <!-- Campo Password -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            placeholder="••••••••"
            [class.invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
          />
          <small class="error" *ngIf="getFieldError('password')">
            {{ getFieldError('password') }}
          </small>
        </div>

        <!-- Botón -->
        <button
          type="submit"
          [disabled]="isLoading"
          class="btn-login"
          [attr.aria-busy]="isLoading ? 'true' : 'false'"
        >
          <span *ngIf="!isLoading">Iniciar sesión</span>
          <span *ngIf="isLoading" class="spinner"></span>
        </button>

        <!-- Error general -->
        <div class="error-message" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
      </form>

      <div class="footer-text">
        <p>© 2025 Clínica Odontológica | Todos los derechos reservados</p>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #0062ff, #00b4d8);
    }
    .login-card {
      background: #fff;
      border-radius: 20px;
      padding: 40px;
      width: 400px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      text-align: center;
    }
    .logo-container { margin-bottom: 25px; }
    .logo { width: 80px; margin-bottom: 10px; }
    .title { font-size: 24px; font-weight: bold; color: #333; }
    .subtitle { color: #777; font-size: 14px; }
    .login-form { display: flex; flex-direction: column; gap: 15px; text-align: left; }
    .form-group label { font-weight: 500; color: #333; }
    .form-group input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #ccc;
      transition: border-color 0.3s ease;
      font-size: 14px;
    }
    .form-group input:focus { border-color: #007bff; outline: none; }
    .form-group input.invalid { border-color: #e63946; }
    .error { color: #e63946; font-size: 12px; }
    .btn-login {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .btn-login:hover { background-color: #0056b3; }
    .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #fff;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error-message {
      background: #ffe5e5;
      color: #c0392b;
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      font-size: 14px;
      margin-top: 10px;
    }
    .footer-text { margin-top: 20px; font-size: 12px; color: #555; }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private apiService: ApiService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) this.router.navigate(['/home']);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    // Usamos ApiService para mantener la lógica de token y rol
    this.apiService.login({ email, password }).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('role', response.user.role || '');

          this.router.navigate(['/home'], { replaceUrl: true });
        } else {
          this.errorMessage = 'Credenciales incorrectas.';
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.errorMessage = 'Error de conexión con el servidor. Verifica que Laravel esté corriendo.';
        } else if (error.status === 401) {
          this.errorMessage = 'Credenciales incorrectas. Intenta nuevamente.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Intenta más tarde.';
        }
        console.error('Error en la petición API:', error);
        this.isLoading = false;
      },
      complete: () => this.isLoading = false
    });
  }

  getFieldError(field: string): string | null {
    const control = this.loginForm.get(field);
    if (control?.hasError('required')) return 'Este campo es obligatorio.';
    if (control?.hasError('email')) return 'Debe ser un correo válido.';
    if (control?.hasError('minlength')) return 'Debe tener al menos 6 caracteres.';
    return null;
  }
}
