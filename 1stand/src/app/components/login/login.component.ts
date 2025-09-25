import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <form (ngSubmit)="onLogin()">
        <h2>Login</h2>
        <div class="form-group">
          <input type="email" [(ngModel)]="email" name="email" placeholder="Email" required>
        </div>
        <div class="form-group">
          <input type="password" [(ngModel)]="password" name="password" placeholder="Password" required>
        </div>
        <button type="submit">Login</button>
      </form>

      
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }

    form {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      width: 300px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    input {
      width: 95%;
      padding: 8px;
      
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    button {
      width: 101%;
      
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      background-color: #0056b3;
    }
  `]
})

/*
export class LoginComponent {
  email: string = "";
  password: string = "";

  constructor(private router: Router) {}

  onLogin() {
    //validacion
    if (this.email === "admin@adm.emi.edu.bo" && this.password === "admin123"){
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/home']);
    } else {
      alert('CREDENCIALES INCORRECTAS');
    }
  }
}
*/
export class LoginComponent implements OnInit {
  email: string = "";
  password: string = "";

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {}
/*
  onLogin() {
    if (this.email === "admin@adm.emi.edu.bo" && this.password === "admin123") {
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/home']);
    } else {
      alert('CREDENCIALES INCORRECTAS');
    }
  }
*/
  onLogin() {
    if (!this.email || !this.password) {
      alert('Por favor, complete todos los campos');
      return;
    }

    this.apiService.login({ email: this.email, password: this.password }).subscribe({
      
      next: (response: any) => {
        console.log('Usuario recibido:', response.user);
        console.log('RESPUESTA LOGIN:', response);
        if (response.status === 'success') {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user)); // Guardar datos del usuario si el backend los envía
          localStorage.setItem('role', response.user.role);
          this.router.navigate(['/home']);
        } else {
          alert('Credenciales incorrectas');
        }
      },
      error: (error: any) => {
        console.error('Error en el login:', error);
        alert('Error al intentar iniciar sesión: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  ngOnInit() {
    // Solo necesitamos esto si queremos verificar la conexión al iniciar
    this.apiService.getTest().subscribe({
      next: (response) => {
        console.log('API del servidor conectada correctamente:', response);
      },
      error: (err) => {
        console.error('Error en la petición API:', err);
      }
    });
  }
}