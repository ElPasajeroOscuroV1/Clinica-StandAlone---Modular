import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class HomeComponent {
  role: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      console.log('Usuario en Home:', parsedUser);
      this.role = parsedUser.role?.toLowerCase() || null;
      console.log('Rol asignado en Home:', this.role);
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        //localStorage.removeItem('role');
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión', error);
      }
    });
  }
}