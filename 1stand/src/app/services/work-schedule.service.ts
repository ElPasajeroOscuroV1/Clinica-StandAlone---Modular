import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkSchedule } from '../interfaces/work-schedule.interface';

@Injectable({
  providedIn: 'root'
})
export class WorkScheduleService {
  private apiUrl = 'http://localhost:8000/api/work-schedules';

  constructor(private http: HttpClient) {}

  // Obtener el horario de un doctor
  getByDoctor(doctorId: number): Observable<WorkSchedule[]> {
    return this.http.get<WorkSchedule[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  // Crear un nuevo horario
  create(schedule: WorkSchedule): Observable<WorkSchedule> {
    return this.http.post<WorkSchedule>(this.apiUrl, schedule);
  }

  // Eliminar un horario
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Obtener el horario de un doctor (método alternativo)
  getDoctorSchedule(doctorId: number): Observable<WorkSchedule[]> {
    return this.http.get<WorkSchedule[]>(`${this.apiUrl}/${doctorId}`);
  }

  // Guardar o actualizar horario (método alternativo)
  saveDoctorSchedule(doctorId: number, schedule: WorkSchedule[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${doctorId}`, { schedule });
  }

  // Obtener turnos disponibles para un doctor en una fecha específica
  getAvailableTurns(doctorId: number, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/doctor/${doctorId}/turns/${date}`);
  }
}
