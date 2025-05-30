import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

export interface Appointment {
  id?: number;
  //patientName: string;
  patient_name: string;  // Cambiado para coincidir con el backend
  //doctorName: string;
  doctor: string;       // Cambiado para coincidir con el backend
  date: string;
  time: string;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api/appointments';
  //private appointments: Appointment[] = [];

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl, { headers: this.getHeaders() });
    // Temporalmente retornar datos locales
    //return of(this.appointments);
  }

  createAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment, { headers: this.getHeaders() });
    // Temporalmente guardar localmente
    //const newAppointment = { ...appointment, id: this.appointments.length + 1 };
    //this.appointments.push(newAppointment);
    //return of(newAppointment);
  }

  updateAppointment(id: number, appointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment, { headers: this.getHeaders() });
    // Temporalmente actualizar localmente
    //const index = this.appointments.findIndex(a => a.id === id);
    //if (index !== -1) {
    //  this.appointments[index] = { ...appointment, id };
    //  return of(this.appointments[index]);
    //}
    //return throwError(() => new Error('Appointment not found'));
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    // Temporalmente eliminar localmente
    //const index = this.appointments.findIndex(a => a.id === id);
    //if (index !== -1) {
    //  this.appointments.splice(index, 1);
    //  return of(void 0);
    //}
    //return throwError(() => new Error('Appointment not found'));
  }
}
