import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Appointment } from '../interfaces/appointment.interface';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api/appointments';

  constructor(private http: HttpClient) {}

  /**
   * Verifica la disponibilidad de un doctor.
   * NOTA: Este metodo carga todas las citas. Para una aplicacion a gran escala,
   * se recomienda un endpoint en el backend que filtre por fecha y doctor.
   */
  checkDoctorAvailability(doctor_id: number, date: string, time: string): Observable<boolean> {
    return this.getAppointments().pipe(
      map(appointments => {
        const selectedTime = this.timeToMinutes(time);
        const doctorAppointments = appointments.filter(app =>
          app.doctor_id === doctor_id && app.date === date && !this.isAppointmentAttended(app)
        );

        return !doctorAppointments.some(app => {
          if (!app.time) {
            return false;
          }
          const appointmentTime = this.timeToMinutes(app.time);
          const existingStart = appointmentTime;
          const existingEnd = appointmentTime + 90;
          const newStart = selectedTime;
          const newEnd = selectedTime + 90;

          return newStart < existingEnd && newEnd > existingStart;
        });
      }),
      catchError(error => {
        console.error('Error checking doctor availability:', error);
        return throwError(() => new Error('Could not check doctor availability.'));
      })
    );
  }

  /**
   * Convierte una hora en formato 'HH:mm' a minutos.
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Obtiene las cabeceras HTTP con el token de autenticacion.
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const headersConfig: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headersConfig);
  }

  /**
   * Verifica la disponibilidad de un paciente.
   * NOTA: Similar al chequeo de doctores, un endpoint de backend seria mas eficiente.
   */
  checkPatientAvailability(patientCi: number | string, date: string, time: string): Observable<boolean> {
    const patientCiStr = patientCi.toString();
    return this.getAppointments().pipe(
      map(appointments => {
        const patientAppointments = appointments.filter(app =>
          app.ci?.toString() === patientCiStr && app.date === date && !this.isAppointmentAttended(app)
        );

        if (patientAppointments.length === 0) {
          return true;
        }

        const [newHours, newMinutes] = time.split(':').map(Number);
        const newTimeInMinutes = newHours * 60 + newMinutes;
        const newEndTimeInMinutes = newTimeInMinutes + 90;

        return !patientAppointments.some(appointment => {
          if (!appointment.time) {
            return false;
          }
          const [existingHours, existingMinutes] = appointment.time.split(':').map(Number);
          const existingTimeInMinutes = existingHours * 60 + existingMinutes;
          const existingEndTimeInMinutes = existingTimeInMinutes + 90;

          return newTimeInMinutes < existingEndTimeInMinutes && newEndTimeInMinutes > existingTimeInMinutes;
        });
      }),
      catchError(error => {
        console.error('Error checking patient availability:', error);
        return throwError(() => new Error('Could not check patient availability.'));
      })
    );
  }

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(appointments => appointments.map(appointment => ({
        ...appointment,
        payment_status: appointment.payment_status ?? 'Pendiente',
        status: appointment.status ?? 'pending'
      }))),
      catchError(error => {
        console.error('Error fetching appointments:', error);
        return throwError(() => new Error('Could not fetch appointments.'));
      })
    );
  }

  createAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error creating appointment:', error);
        return throwError(() => new Error('Could not create appointment.'));
      })
    );
  }

  updateAppointment(id: number, appointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error updating appointment:', error);
        return throwError(() => new Error('Could not update appointment.'));
      })
    );
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error deleting appointment:', error);
        return throwError(() => new Error('Could not delete appointment.'));
      })
    );
  }

  getAppointmentsByPatient(patientId: number) {
    const url = `${this.apiUrl}?patient_id=${patientId}`;
    return this.http.get<Appointment[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error fetching appointments by patient:', error);
        return throwError(() => new Error('Could not fetch appointments by patient.'));
      })
    );
  }

  private isAppointmentAttended(appointment: Appointment | undefined): boolean {
    return (appointment?.status ?? 'pending').toLowerCase() === 'attended';
  }
}
