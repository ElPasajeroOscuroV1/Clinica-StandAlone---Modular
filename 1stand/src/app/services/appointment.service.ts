import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';  // Agregar esta importación

export interface Appointment {
  id?: number;
  //patientName: string;
  //patient_id: number;
  ci: number;
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

  // Método para verificar disponibilidad
  checkDoctorAvailability(doctor: string, date: string, time: string): Observable<boolean> {
    return this.getAppointments().pipe(
      map(appointments => {
        // Convertir la hora seleccionada a minutos desde medianoche
        const selectedTime = this.timeToMinutes(time);
        
        // Filtrar citas del mismo doctor y día
        const doctorAppointments = appointments.filter(app => 
          app.doctor === doctor && app.date === date
        );

        // Verificar si hay superposición con alguna cita existente
        return !doctorAppointments.some(app => {
          const appointmentTime = this.timeToMinutes(app.time);

          // Calcular el inicio y fin de la cita existente
          const existingStart = appointmentTime;
          const existingEnd = appointmentTime + 90;
          
          // Calcular el inicio y fin de la nueva cita
          const newStart = selectedTime;
          const newEnd = selectedTime + 90;

          // Verificar si hay superposición
          return (newStart < existingEnd && newEnd > existingStart);

          // Verificar si hay superposición considerando 90 minutos de duración
          //return Math.abs(appointmentTime - selectedTime) < 90;
        });
      })
    );
  }

  // Método para convertir hora a minutos// Método auxiliar para convertir hora a minutos
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  checkPatientAvailability(patientCi: number, date: string, time: string): Observable<boolean> {
    return this.getAppointments().pipe(
      map(appointments => {
        // Filtrar citas del mismo día y paciente
        const patientAppointments = appointments.filter(app => 
          app.ci === patientCi && 
          app.date === date
        );

        if (patientAppointments.length === 0) return true;

        // Convertir la hora de la nueva cita a minutos
        const [newHours, newMinutes] = time.split(':').map(Number);
        const newTimeInMinutes = newHours * 60 + newMinutes;

        // Calcular el tiempo de finalización (90 minutos después)
        const newEndTimeInMinutes = newTimeInMinutes + 90;

        // Verificar superposición con citas existentes
        return !patientAppointments.some(appointment => {
          const [existingHours, existingMinutes] = appointment.time.split(':').map(Number);
          const existingTimeInMinutes = existingHours * 60 + existingMinutes;
          const existingEndTimeInMinutes = existingTimeInMinutes + 90;

          // Hay superposición si la nueva cita comienza durante una existente
          // o si una cita existente comienza durante la nueva
          return (newTimeInMinutes < existingEndTimeInMinutes && 
                 newEndTimeInMinutes > existingTimeInMinutes);
        });
      })
    );
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
