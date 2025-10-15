import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, EMPTY } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import { Appointment } from '../../interfaces/appointment.interface';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../services/doctor.service';
import { WorkScheduleService } from '../../services/work-schedule.service';
import { Patient } from '../../interfaces/patient.interface';
import { Doctor } from '../../interfaces/doctor.interface';


@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FullCalendarModule],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.css'
})
export class AppointmentComponent implements OnInit {
  appointmentForm: FormGroup;
  appointments: Appointment[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  availableTurns: any[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: []
  };

  private readonly paymentStatuses: Array<NonNullable<Appointment['payment_status']>> = ['Pendiente', 'Pagado', 'Cancelado'];
  private readonly attentionStatusConfig: Record<string, { label: string; className: string; order: number }> = {
    pending: { label: 'Pendiente', className: 'attention-status--pending', order: 0 },
    attended: { label: 'Atendida', className: 'attention-status--attended', order: 1 },
    cancelled: { label: 'Cancelada', className: 'attention-status--cancelled', order: 2 }
  };
  private selectedPatientCi: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly appointmentService: AppointmentService,
    private readonly patientService: PatientService,
    private readonly doctorService: DoctorService,
    private readonly workScheduleService: WorkScheduleService
  ) {
    this.appointmentForm = this.fb.group({
      patient_id: ['', Validators.required],
      doctor_id: ['', Validators.required],
      date: ['', Validators.required],
      turn: ['', Validators.required],
      reason: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  onPatientSelect(event: Event): void {
    const elementValue = (event.target as HTMLSelectElement).value;
    if (!elementValue) {
      this.selectedPatientCi = null;
      return;
    }

    const patientId = Number(elementValue);
    if (Number.isNaN(patientId)) {
      this.selectedPatientCi = null;
      return;
    }

    this.appointmentForm.patchValue({ patient_id: patientId });
    const patient = this.patients.find(p => p.id === patientId);
    this.selectedPatientCi = patient?.ci ?? null;
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos requeridos.';
      this.successMessage = null;
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const formValue = this.appointmentForm.value;
    const patientId = Number(formValue.patient_id);
    const doctorId = Number(formValue.doctor_id);
    const patient = this.patients.find(p => p.id === patientId);

    if (!patient) {
      this.errorMessage = 'El paciente seleccionado no es valido.';
      this.successMessage = null;
      return;
    }

    const patientCi = this.selectedPatientCi ?? patient.ci ?? '';
    if (!patientCi) {
      this.errorMessage = 'No se encontro un numero de documento para el paciente seleccionado.';
      this.successMessage = null;
      return;
    }

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    forkJoin({
      doctorAvailable: this.appointmentService.checkDoctorAvailability(doctorId, formValue.date, formValue.turn),
      patientAvailable: this.appointmentService.checkPatientAvailability(patientCi, formValue.date, formValue.turn)
    })
      .pipe(
        switchMap(({ doctorAvailable, patientAvailable }) => {
          if (!doctorAvailable) {
            this.errorMessage = 'El doctor seleccionado no esta disponible en ese horario.';
            return EMPTY;
          }
          if (!patientAvailable) {
            this.errorMessage = 'El paciente ya tiene una cita programada en ese horario.';
            return EMPTY;
          }

          const payload = {
            patient_id: patientId,
            doctor_id: doctorId,
            date: formValue.date,
            time: formValue.turn,
            reason: formValue.reason,
            payment_status: 'Pendiente'
          } as Appointment;

          return this.appointmentService.createAppointment(payload);
        }),
        catchError(error => {
          this.errorMessage = this.extractErrorMessage(error);
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Cita programada correctamente.';
          this.resetForm();
          this.loadAppointments();
        }
      });
  }

  deleteAppointment(appointmentId?: number): void {
    if (!appointmentId) {
      return;
    }

    this.errorMessage = null;
    this.appointmentService.deleteAppointment(appointmentId).subscribe({
      next: () => {
        this.successMessage = 'La cita fue cancelada.';
        this.loadAppointments();
      },
      error: error => {
        this.errorMessage = this.extractErrorMessage(error);
      }
    });
  }

  togglePaymentStatus(appointment: Appointment): void {
    const currentStatus = appointment.payment_status ?? 'Pendiente';
    const currentIndex = this.paymentStatuses.indexOf(currentStatus);
    const nextStatus = this.paymentStatuses[(currentIndex + 1) % this.paymentStatuses.length];

    const payload = {
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id ?? undefined,
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
      payment_status: nextStatus
    } as Appointment;

    this.errorMessage = null;
    this.appointmentService.updateAppointment(appointment.id, payload).subscribe({
      next: () => {
        appointment.payment_status = nextStatus;
        this.successMessage = 'Estado de pago actualizado.';
        this.refreshCalendarEvents();
      },
      error: error => {
        this.errorMessage = this.extractErrorMessage(error);
      }
    });
  }

  getAttentionStatusLabel(appointment: Appointment): string {
    const statusKey = this.getAttentionStatusKey(appointment.status);
    return this.attentionStatusConfig[statusKey]?.label ?? this.capitalize(statusKey);
  }

  onDoctorOrDateChange(): void {
    const formValue = this.appointmentForm.value;
    const doctorId = formValue.doctor_id;
    const date = formValue.date;

    if (doctorId && date) {
      // Limpiar mensajes de error previos al cargar turnos
      this.errorMessage = '';
      this.loadAvailableTurns(Number(doctorId), date);
    } else {
      // Si no hay doctor o fecha seleccionados, limpiar turnos y mostrar mensaje informativo
      this.availableTurns = [];
      this.appointmentForm.patchValue({ turn: '' });
    }
  }

  getAttentionStatusClass(appointment: Appointment): string {
    const statusKey = this.getAttentionStatusKey(appointment.status);
    const className = this.attentionStatusConfig[statusKey]?.className ?? 'attention-status--unknown';
    return `attention-status ${className}`;
  }

  private loadInitialData(): void {
    this.loadPatients();
    this.loadDoctors();
    this.loadAppointments();
  }

  private loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: patients => {
        this.patients = patients;
      },
      error: error => {
        this.errorMessage = this.extractErrorMessage(error);
      }
    });
  }

  private loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: doctors => {
        this.doctors = doctors;
      },
      error: error => {
        this.errorMessage = this.extractErrorMessage(error);
      }
    });
  }

  private loadAppointments(): void {
    this.appointmentService.getAppointments().subscribe({
      next: appointments => {
        this.appointments = appointments
          .map(appointment => this.normalizeAppointment(appointment))
          .sort((a, b) => this.compareAppointments(a, b));
        this.refreshCalendarEvents();
      },
      error: error => {
        this.errorMessage = this.extractErrorMessage(error);
      }
    });
  }

  private refreshCalendarEvents(): void {
    const events = this.appointments.map(appointment => ({
      id: String(appointment.id),
      title: this.buildEventTitle(appointment),
      start: this.buildEventStart(appointment.date, appointment.time)
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
  }

  private buildEventTitle(appointment: Appointment): string {
    const patientName = appointment.patient_name ?? 'Paciente';
    const doctorName = appointment.doctor?.name ?? appointment.doctor_name ?? 'Sin doctor asignado';
    const time = appointment.time?.slice(0, 5) ?? '';
    const statusKey = this.getAttentionStatusKey(appointment.status);
    const statusLabel = this.attentionStatusConfig[statusKey]?.label ?? this.capitalize(statusKey);
    const statusSuffix = statusKey === 'pending' ? '' : ` - ${statusLabel}`;
    return `${patientName} - ${doctorName} (${time})${statusSuffix}`;
  }

  private buildEventStart(date: string, time: string): string {
    const normalizedTime = time?.length === 5 ? `${time}:00` : time;
    return `${date}T${normalizedTime ?? '00:00:00'}`;
  }

  private normalizeAppointment(appointment: Appointment): Appointment {
    const statusKey = this.getAttentionStatusKey(appointment.status);
    return {
      ...appointment,
      payment_status: appointment.payment_status ?? 'Pendiente',
      status: statusKey,
      doctor_name: appointment.doctor_name ?? appointment.doctor?.name ?? null,
      doctor_specialty: appointment.doctor_specialty ?? appointment.doctor?.specialty ?? null
    };
  }

  private compareAppointments(a: Appointment, b: Appointment): number {
    const statusDiff = this.getAttentionStatusOrder(a.status) - this.getAttentionStatusOrder(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }

    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) {
      return dateDiff;
    }

    return (a.time ?? '').localeCompare(b.time ?? '');
  }

  private getAttentionStatusOrder(status?: string | null): number {
    const statusKey = this.getAttentionStatusKey(status);
    return this.attentionStatusConfig[statusKey]?.order ?? Number.MAX_SAFE_INTEGER;
  }

  private getAttentionStatusKey(status?: string | null): string {
    return (status ?? 'pending').toLowerCase();
  }

  private loadAvailableTurns(doctorId: number, date: string): void {
    this.availableTurns = [];
    this.workScheduleService.getAvailableTurns(doctorId, date).subscribe({
      next: turns => {
        this.availableTurns = turns;
      },
      error: error => {
        this.errorMessage = 'Error al cargar los turnos disponibles: ' + this.extractErrorMessage(error);
      }
    });
  }

  private capitalize(value: string): string {
    if (!value) {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private resetForm(): void {
    this.appointmentForm.reset({
      patient_id: '',
      doctor_id: '',
      date: '',
      turn: '',
      reason: ''
    });
    this.appointmentForm.markAsPristine();
    this.appointmentForm.markAsUntouched();
    this.selectedPatientCi = null;
    this.availableTurns = [];
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 422 && error.error?.errors) {
        const validationMessages = Object.values(error.error.errors)
          .flat()
          .join(' ');
        if (validationMessages) {
          return validationMessages;
        }
      }

      if (typeof error.error === 'string') {
        return error.error;
      }

      if (error.error?.message) {
        return error.error.message;
      }

      return `Error del servidor (${error.status}).`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Ocurrio un error inesperado. Intente nuevamente.';
  }
}
