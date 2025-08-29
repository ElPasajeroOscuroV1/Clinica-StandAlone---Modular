import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentService, Appointment } from '../../services/appointment.service';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../interfaces/doctor.interface';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../interfaces/patient.interface';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs'; // 'forkJoin' se importa directamente de 'rxjs'

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // for dateClick, draggable events

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FullCalendarModule]//
})
export class AppointmentComponent implements OnInit {
  appointmentForm: FormGroup;
  appointments: Appointment[] = [];
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  selectedAppointment: Appointment | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
/* CALENDARIO */
  calendarOptions: any = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: [], // Aquí cargarás tus citas
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this) // for drag-and-drop
  };

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private patientService: PatientService
  ) {
    // Inicialización del formulario con un estado por defecto
    this.appointmentForm = this.fb.group({
      patient_name: ['', Validators.required],
      ci: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      doctor_id: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      reason: ['', Validators.required],
      payment_status: ['Pendiente']
    });
  }

  ngOnInit(): void {
    this.loadAllData();
    this.loadPatients();

    // Configurar los eventos del calendario después de cargar las citas
    // this.calendarOptions.events = this.appointments.map(app => ({
    //   id: app.id,
    //   title: `${app.patient_name} - ${app.reason}`,
    //   start: `${app.date}T${app.time}`,
    //   // Puedes añadir más propiedades si las necesitas, como color, etc.
    // }));
  }

  /**
   * Carga doctores y citas de manera concurrente para evitar llamadas anidadas.
   */
  loadAllData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    forkJoin({
      doctors: this.doctorService.getDoctors(),
      appointments: this.appointmentService.getAppointments()
    }).subscribe({
      next: ({ doctors, appointments }) => {
        this.doctors = doctors;
        // Mapea las citas para incluir el nombre del doctor
        this.appointments = appointments.map(app => {
          const doctor = this.doctors.find(d => d.id === app.doctor_id);
          return {
            ...app,
            doctor: {
              id: doctor?.id ?? 0,
              name: doctor?.name ?? 'Desconocido',
              specialty: doctor?.specialty ?? ''
            }
          };
        });
        this.isLoading = false;
        // Actualizar los eventos del calendario aquí
        /* CALENDARIO */
        this.calendarOptions.events = this.appointments.map(app => ({
          id: app.id,
          title: `${app.patient_name} - ${app.reason}`,
          start: `${app.date}T${app.time}`,
          // Puedes añadir más propiedades si las necesitas, como color, etc.
        }));
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.errorMessage = 'Error al cargar los doctores o las citas.';
        this.isLoading = false;
      }
    });
  }

  handleDateClick(arg: any) {
    alert('date click! ' + arg.dateStr);
    // Aquí puedes abrir un modal para crear una nueva cita en la fecha seleccionada
  }

  handleEventClick(arg: any) {
    alert('event click! ' + arg.event.title);
    // Aquí puedes abrir un modal para editar la cita seleccionada
  }

  handleEventDrop(arg: any) {
    // Lógica para actualizar la fecha/hora de la cita en el backend después de arrastrarla
    console.log('Event dropped:', arg.event);
    // Puedes llamar a tu appointmentService.updateAppointment aquí
  }

  /**
   * Carga la lista de pacientes para el selector.
   */
  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (data) => this.patients = data,
      error: (error) => console.error('Error cargando pacientes:', error)
    });
  }

  /**
   * Completa el formulario con los datos del paciente seleccionado.
   * @param event El evento de cambio del selector.
   */
  onPatientSelect(event: any): void {
    const selectedPatientCi = event.target.value;
    // Se corrige la comparación para asegurar que ambos valores son números
    const selectedPatient = this.patients.find(p => Number(p.ci) === Number(selectedPatientCi));
    if (selectedPatient) {
      this.appointmentForm.patchValue({
        patient_name: selectedPatient.name,
        ci: selectedPatient.ci,
      });
    }
  }

  /**
   * Envía el formulario para crear o actualizar una cita.
   */
  onSubmit(): void {
    if (this.appointmentForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      const appointment: Appointment = this.appointmentForm.value;

      // Asegura que doctorId es un número válido
      const doctorId = Number(appointment.doctor_id);
      console.log('Enviando a checkDoctorAvailability:', doctorId, appointment.date, appointment.time);
      // Cadena de verificación de disponibilidad usando switchMap
      this.appointmentService.checkDoctorAvailability(doctorId, appointment.date, appointment.time).pipe(
        tap(isDoctorAvailable => {
          if (!isDoctorAvailable) {
            this.errorMessage = 'El doctor ya tiene una cita programada en ese horario. Por favor, seleccione otro.';
            this.isLoading = false;
            throw new Error('El doctor no está disponible en ese horario. Por favor, seleccione otro.');
          }
        }),
        switchMap(() => this.appointmentService.checkPatientAvailability(appointment.ci, appointment.date, appointment.time)),
        tap(isPatientAvailable => {
          if (!isPatientAvailable) {
            this.errorMessage = 'El paciente ya tiene una cita programada en ese horario. Por favor, seleccione otro.';
            this.isLoading = false;
            throw new Error('El paciente ya tiene una cita programada en ese horario. Por favor, seleccione otro.');
          }
        }),
        switchMap(() => {
          if (this.selectedAppointment && this.selectedAppointment.id !== undefined) {
            return this.appointmentService.updateAppointment(this.selectedAppointment.id, appointment);
          } else {
            return this.appointmentService.createAppointment(appointment);
          }
        }),
        catchError(error => {
          this.errorMessage = error.message;
          this.isLoading = false;
          return of(null);
        })
      ).subscribe(result => {
        if (result) {
          this.successMessage = this.selectedAppointment ? 'Cita actualizada exitosamente.' : 'Cita creada exitosamente.';
          this.loadAllData();
          this.appointmentForm.reset();
          this.appointmentForm.get('payment_status')?.setValue('Pendiente');
          this.selectedAppointment = null;
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Alterna el estado de pago de una cita.
   * @param appointment La cita a actualizar.
   */
  togglePaymentStatus(appointment: Appointment): void {
    if (appointment.id === undefined) {
      this.errorMessage = 'Error: ID de cita no definido. No se puede actualizar el estado de pago.';
      return;
    }
    
    let newStatus: string;
    if (appointment.payment_status === 'Pagado') {
      newStatus = 'Cancelado';
    } else if (appointment.payment_status === 'Cancelado') {
      newStatus = 'Pendiente';
    } else {
      newStatus = 'Pagado';
    }

    const updatedAppointment = { ...appointment, payment_status: newStatus };

    this.appointmentService.updateAppointment(appointment.id, updatedAppointment).subscribe({
      next: () => {
        this.loadAllData();
        this.successMessage = 'Estado de pago actualizado exitosamente.';
      },
      error: (error) => {
        console.error('Error actualizando estado de pago:', error);
        this.errorMessage = 'Error al actualizar el estado de pago. Por favor, inténtelo de nuevo.';
      }
    });
  }

  /**
   * Carga una cita seleccionada en el formulario para su edición.
   * @param appointment La cita a editar.
   */
  onEdit(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.appointmentForm.patchValue({
      patient_name: appointment.patient_name,
      ci: appointment.ci,
      doctor_id: appointment.doctor_id,
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
      payment_status: appointment.payment_status
    });
  }

  /**
   * Cancela el modo de edición y resetea el formulario.
   */
  cancelEdit(): void {
    this.selectedAppointment = null;
    this.appointmentForm.reset();
    this.appointmentForm.get('payment_status')?.setValue('Pendiente');
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Elimina una cita.
   * @param id El ID de la cita a eliminar.
   */
  deleteAppointment(id: number | undefined): void {
    if (id === undefined) {
      console.error('Error: ID de cita no definido. No se puede eliminar.');
      return;
    }

    this.appointmentService.deleteAppointment(id).subscribe({
      next: () => {
        this.loadAllData();
        this.successMessage = 'Cita eliminada exitosamente.';
      },
      error: (error) => {
        console.error('Error al eliminar cita:', error);
        this.errorMessage = 'Error al eliminar la cita.';
      }
    });
  }
}
