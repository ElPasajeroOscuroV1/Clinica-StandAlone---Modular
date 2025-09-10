import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../interfaces/patient.interface';
import { Appointment } from '../interfaces/appointment.interface';
import { Treatment } from '../interfaces/treatment.interface';
import { MedicalAttention } from '../interfaces/medical-attention.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicalAttentionService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token'); // Ajusta según cómo almacenes el token
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/patients`, { headers: this.getAuthHeaders() });
  }

  getAppointmentsByPatient(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/patients/${patientId}/appointments`, {
      headers: this.getAuthHeaders()
    });
  }

  getDoctors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/doctors`, {
      headers: this.getAuthHeaders()
    });
  }

  getTreatments(): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${this.baseUrl}/treatments`, { headers: this.getAuthHeaders() });
  }

  getMedicalAttentions(): Observable<MedicalAttention[]> {
    return this.http.get<MedicalAttention[]>(`${this.baseUrl}/medical-attentions`, { headers: this.getAuthHeaders() });
  }

  getMedicalAttention(id: number): Observable<MedicalAttention> {
    return this.http.get<MedicalAttention>(`${this.baseUrl}/medical-attentions/${id}`, { headers: this.getAuthHeaders() });
  }

  createMedicalAttention(data: MedicalAttention): Observable<MedicalAttention> {
    return this.http.post<MedicalAttention>(`${this.baseUrl}/medical-attentions`, data, { headers: this.getAuthHeaders() });
  }

  updateMedicalAttention(id: number, data: MedicalAttention): Observable<MedicalAttention> {
    return this.http.put<MedicalAttention>(`${this.baseUrl}/medical-attentions/${id}`, data, { headers: this.getAuthHeaders() });
  }

  deleteMedicalAttention(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/medical-attentions/${id}`, { headers: this.getAuthHeaders() });
  }
}