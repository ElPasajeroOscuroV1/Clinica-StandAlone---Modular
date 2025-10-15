import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor } from '../interfaces/doctor.interface';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:8000/api/doctors';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getDoctor(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createDoctor(doctor: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, doctor, { headers: this.getHeaders() });
  }

  updateDoctor(id: number, doctor: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, doctor, { headers: this.getHeaders() });
  }

  deleteDoctor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  /**
   * ✅ NUEVO MÉTODO:
   * Permite actualizar o guardar solo el horario de trabajo del médico (turnos)
   * desde el WorkScheduleModalComponent.
   */
  updateWorkSchedule(doctorId: number, workSchedule: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${doctorId}/schedule`,
      { schedule: workSchedule },
      { headers: this.getHeaders() }
    );
  }
}
