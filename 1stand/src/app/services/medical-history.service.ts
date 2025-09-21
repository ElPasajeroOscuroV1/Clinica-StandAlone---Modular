// medical-history.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MedicalHistory, ApiResponse } from '../interfaces/medical-history.interface';

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  private apiUrl = (environment.apiBaseUrl || 'http://localhost:8000') + '/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getAllMedicalHistories(): Observable<ApiResponse<MedicalHistory[]>> {
    return this.http.get<ApiResponse<MedicalHistory[]>>(
      `${this.apiUrl}/medical-histories`,
      { headers: this.getHeaders(), withCredentials: true }
    );
  }

  getMedicalHistoriesByPatient(patientId: number): Observable<ApiResponse<MedicalHistory[]>> {
    return this.http.get<ApiResponse<MedicalHistory[]>>(
      `${this.apiUrl}/patients/${patientId}/medical-histories`,
      { headers: this.getHeaders(), withCredentials: true }
    );
  }

  createMedicalHistory(patientId: number, data: any): Observable<ApiResponse<MedicalHistory>> {
    return this.http.post<ApiResponse<MedicalHistory>>(
      `${this.apiUrl}/patients/${patientId}/medical-history`,
      data,
      { headers: this.getHeaders(), withCredentials: true }
    );
  }

  updateMedicalHistory(historyId: number, historyData: any): Observable<ApiResponse<MedicalHistory>> {
    return this.http.put<ApiResponse<MedicalHistory>>(
      `${this.apiUrl}/medical-histories/${historyId}`,
      historyData,
      { headers: this.getHeaders(), withCredentials: true }
    );
  }

  deleteMedicalHistory(historyId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/medical-histories/${historyId}`,
      { headers: this.getHeaders(), withCredentials: true }
    );
  }
}
