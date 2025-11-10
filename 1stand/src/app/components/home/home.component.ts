import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { Appointment } from '../../interfaces/appointment.interface';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class HomeComponent implements OnInit {
  role: string | null = null;

  // Dashboard statistics
  stats = {
    appointmentsToday: 0,
    totalPatients: 0,
    activeDoctors: 0,
    pendingPayments: 0,
    todaysRevenue: 0,
    pendingAppointments: 0
  };

  isLoadingStats = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private doctorService: DoctorService
  ) {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      console.log('Usuario en Home:', parsedUser);
      this.role = parsedUser.role?.toLowerCase() || null;
      console.log('Rol asignado en Home:', this.role);
    }
  }

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  refreshStats(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.isLoadingStats = true;

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Load all statistics in parallel
    Promise.all([
      // Appointments today
      new Promise<number>((resolve) => {
        this.appointmentService.getAppointments().subscribe({
          next: (appointments) => {
            const todayAppointments = appointments.filter(app => app.date === todayString);
            resolve(todayAppointments.length);
          },
          error: () => resolve(0)
        });
      }),

      // Total patients
      new Promise<number>((resolve) => {
        this.patientService.getPatients().subscribe({
          next: (patients) => resolve(patients.length),
          error: () => resolve(0)
        });
      }),

      // Active doctors
      new Promise<number>((resolve) => {
        this.doctorService.getDoctors().subscribe({
          next: (doctors) => {
            const activeDoctors = doctors.filter(doctor => doctor.available);
            resolve(activeDoctors.length);
          },
          error: () => resolve(0)
        });
      }),

      // Pending appointments (future appointments)
      new Promise<number>((resolve) => {
        this.appointmentService.getAppointments().subscribe({
          next: (appointments) => {
            const pendingAppointments = appointments.filter(app => {
              const appointmentDate = new Date(app.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return appointmentDate >= today && app.status?.toLowerCase() === 'pending';
            });
            resolve(pendingAppointments.length);
          },
          error: () => resolve(0)
        });
      })

    ]).then(([appointmentsToday, totalPatients, activeDoctors, pendingAppointments]) => {
      this.stats.appointmentsToday = appointmentsToday;
      this.stats.totalPatients = totalPatients;
      this.stats.activeDoctors = activeDoctors;
      this.stats.pendingAppointments = pendingAppointments;

      // Calculate pending payments and today's revenue (these would need payment service integration)
      this.stats.pendingPayments = Math.floor(appointmentsToday * 0.3); // Estimate based on appointments
      this.stats.todaysRevenue = appointmentsToday * 150; // Estimate revenue

      this.isLoadingStats = false;
    }).catch((error) => {
      console.error('Error loading dashboard stats:', error);
      this.isLoadingStats = false;
    });
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
