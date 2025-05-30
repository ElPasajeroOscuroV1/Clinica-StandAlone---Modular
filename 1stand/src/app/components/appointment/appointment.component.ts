import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentService, Appointment } from '../../services/appointment.service';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AppointmentComponent implements OnInit {
  appointmentForm: FormGroup;
  //appointments: any[] = [];
  appointments: Appointment[] = []; // Tipado correcto

  constructor(private fb: FormBuilder, private appointmentService: AppointmentService) {
    this.appointmentForm = this.fb.group({
      patient_name: ['', Validators.required],
      doctor: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Cargar citas existentes
    this.loadAppointments();
  }

  loadAppointments(): void {
    // Aquí implementaremos la carga desde el backend
    this.appointmentService.getAppointments().subscribe({
      next: (data) => this.appointments = data,
      error: (error) => console.error('Error cargando citas:', error)
    });
  }
  //MENSAJES DE RETROALIMIENTACION
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  onSubmit(): void {
    if (this.appointmentForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const appointment: Appointment = this.appointmentForm.value;
      // Aquí implementaremos el guardado en el backend
      this.appointmentService.createAppointment(appointment).subscribe({
        next: (response) => {
          //this.appointments.push(response);
          // En lugar de hacer push, volvemos a cargar todas las citas
          this.loadAppointments();
          this.appointmentForm.reset();
          this.successMessage = 'Cita programada exitosamente';
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al crear cita:', error);
          this.errorMessage = 'Error al programar la cita. Por favor, intente nuevamente.';
          this.isLoading = false;
        }
      });
    }
  }

  deleteAppointment(index: number): void {
    // Aquí implementaremos el borrado en el backend
    //this.appointments.splice(index, 1);
    const appointment = this.appointments[index];
    if (appointment.id) {
      this.appointmentService.deleteAppointment(appointment.id).subscribe({
        next: () => {
          this.appointments.splice(index, 1);
        },
        error: (error) => console.error('Error al eliminar cita:', error)
      });
    }
  }
}