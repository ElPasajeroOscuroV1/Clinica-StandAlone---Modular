import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Appointment {
  patient: any;
  patient_id: number;
  id?: number;
  ci: number; // Identificador único del paciente
  patient_name: string;
  doctor_id: number;
  doctor_name?: string;
  doctor?: {
    id: number;
    name: string;
    specialty: string;
  };
  date: string;
  time: string;
  reason: string;
  payment_status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api/appointments';

  constructor(private http: HttpClient) {}

  /**
   * Verifica la disponibilidad de un doctor.
   * NOTA: Este método carga todas las citas. Para una aplicación a gran escala,
   * se recomienda un endpoint en el backend que filtre por fecha y doctor.
   */
  checkDoctorAvailability(doctor_id: number, date: string, time: string): Observable<boolean> {
    return this.getAppointments().pipe(
      map(appointments => {
        console.log('doctor_id:', doctor_id);
        console.log('appointments:', appointments);

        const selectedTime = this.timeToMinutes(time);
        const doctorAppointments = appointments.filter(app =>  
          (app.doctor_id === doctor_id || app.doctor?.id === doctor_id) && app.date === date
        );
        console.log('doctorAppointments:', doctorAppointments);


        return !doctorAppointments.some(app => {
          const appointmentTime = this.timeToMinutes(app.time);
          const existingStart = appointmentTime;
          const existingEnd = appointmentTime + 90;
          const newStart = selectedTime;
          const newEnd = selectedTime + 90;

          return (newStart < existingEnd && newEnd > existingStart);
        });
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
   * Obtiene las cabeceras HTTP con el token de autenticación.
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Verifica la disponibilidad de un paciente.
   * NOTA: Similar al chequeo de doctores, un endpoint de backend sería más eficiente.
   */
  checkPatientAvailability(patientCi: number, date: string, time: string): Observable<boolean> {
    return this.getAppointments().pipe(
      map(appointments => {
        const patientAppointments = appointments.filter(app =>  
          app.ci === patientCi && app.date === date
        );

        if (patientAppointments.length === 0) return true;

        const [newHours, newMinutes] = time.split(':').map(Number);
        const newTimeInMinutes = newHours * 60 + newMinutes;
        const newEndTimeInMinutes = newTimeInMinutes + 90;

        return !patientAppointments.some(appointment => {
          const [existingHours, existingMinutes] = appointment.time.split(':').map(Number);
          const existingTimeInMinutes = existingHours * 60 + existingMinutes;
          const existingEndTimeInMinutes = existingTimeInMinutes + 90;

          return (newTimeInMinutes < existingEndTimeInMinutes && newEndTimeInMinutes > existingTimeInMinutes);
        });
      })
    );
  }

  getAppointments(): Observable<Appointment[]> {
    console.log('Llamando a GET /api/appointments con headers:', this.getHeaders());

    return this.http.get<Appointment[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment, { headers: this.getHeaders() });
  }

  updateAppointment(id: number, appointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment, { headers: this.getHeaders() });
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getAppointmentsByPatient(patientId: number) {
    const url = `${this.apiUrl}?patient_id=${patientId}`;
    console.log('Llamando a GET:', url, 'con headers:', this.getHeaders());
    return this.http.get<Appointment[]>(url, { headers: this.getHeaders() });
  }
  
}
