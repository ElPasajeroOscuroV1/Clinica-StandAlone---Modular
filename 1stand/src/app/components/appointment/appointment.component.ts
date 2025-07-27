import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../interfaces/doctor.interface';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../interfaces/patient.interface';

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
  doctors: Doctor[] = []; // Lista de doctores
  patients: Patient[] = []; // Agregamos la lista de pacientes

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private patientService: PatientService

    )
    {
    this.appointmentForm = this.fb.group({
      patient_name: ['', Validators.required], // Mantenemos este campo por compatibilidad
      patient_id: ['', Validators.required], // Agregamos el ID del paciente
      doctor: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      reason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Cargar citas existentes
    this.loadAppointments();
    this.loadDoctors(); // Cargar la lista de doctores
    this.loadPatients(); // Cargamos la lista de pacientes
  }

  loadAppointments(): void {
    // Aquí implementaremos la carga desde el backend
    this.appointmentService.getAppointments().subscribe({
      next: (data) => this.appointments = data,
      error: (error) => console.error('Error cargando citas:', error)
    });
  }
  // Agregamos el método para cargar doctores
  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (data) => this.doctors = data,
      error: (error) => console.error('Error cargando doctores:', error)
    });
  }

  // Agregamos el método para cargar pacientes
  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (data) => this.patients = data,
      error: (error) => console.error('Error cargando pacientes:', error)
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

      /* VERSION1
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
      */
     // Verificar disponibilidad antes de crear la cita
     // Primero verificar disponibilidad del doctor
     this.appointmentService.checkDoctorAvailability(
      //formData.doctor,
      //formData.date,
      //formData.time
      appointment.doctor,    // Cambiar formData por appointment
      appointment.date,     // Cambiar formData por appointment
      appointment.time      // Cambiar formData por appointment
    ).subscribe({
      next: (isDoctorAvailable) => {
        if (isDoctorAvailable) {
          // Si el doctor está disponible, verificar disponibilidad del paciente
          this.checkPatientAvailability(appointment);
          } else {
            this.errorMessage = 'El doctor no está disponible en ese horario. Por favor, seleccione otro horario (las citas duran 90 minutos).';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error verificando disponibilidad del doctor:', error);
           this.errorMessage = 'Error al verificar disponibilidad del doctor';
          this.isLoading = false;
        }
      });
    }
  }
  /*
          // Proceder con la creación de la cita
          this.createAppointment(appointment);// Cambiar formData por appointment
        } else {
          this.errorMessage = 'El doctor no está disponible en ese horario. Por favor, seleccione otro horario (las citas duran 90 minutos).';
          this.isLoading = false;  // Agregar esto para manejar el estado de carga
        }
      },
      error: (error) => {
        console.error('Error verificando disponibilidad:', error);
        this.errorMessage = 'Error al verificar disponibilidad del doctor';
        this.isLoading = false;
      }
    });
    }
  }
*/
private checkPatientAvailability(appointment: Appointment): void {
  this.appointmentService.checkPatientAvailability(
    appointment.ci,
    appointment.date,
    appointment.time
  ).subscribe({
    next: (isPatientAvailable) => {
      if (isPatientAvailable) {
        // Si tanto el doctor como el paciente están disponibles, crear la cita
        this.createAppointment(appointment);
      } else {
        this.errorMessage = 'El paciente ya tiene una cita programada en ese horario. Por favor, seleccione otro horario.';
        this.isLoading = false;
      }
    },
    error: (error) => {
      console.error('Error verificando disponibilidad del paciente:', error);
      this.errorMessage = 'Error al verificar disponibilidad del paciente';
      this.isLoading = false;
    }
  });
}
  // Dentro de la clase AppointmentComponent
  onPatientSelect(event: any): void {
    const selectedPatientId = event.target.value;
    const selectedPatient = this.patients.find(p => p.id === Number(selectedPatientId));
    if (selectedPatient) {
      this.appointmentForm.patchValue({
        patient_name: selectedPatient.name
      });
    }
  }

  private createAppointment(appointment: Appointment): void {
    this.isLoading = true;
    this.appointmentService.createAppointment(appointment).subscribe({
      next: (response) => {
        this.successMessage = 'Cita creada exitosamente';
        this.appointmentForm.reset();
        this.loadAppointments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creando cita:', error);
        this.errorMessage = 'Error al crear la cita';
        this.isLoading = false;
      }
    });
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