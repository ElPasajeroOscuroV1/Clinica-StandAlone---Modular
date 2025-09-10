import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  private apiUrl = 'http://localhost:8000/api';
  //private apiUrl = environment.apiBaseUrl; // ejemplo: http://localhost:8000/api

  constructor(private http: HttpClient) {}

  getMedicalHistories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medical-histories`);
  }

  getAllMedicalHistories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medical-histories`, { withCredentials: true });
  }

  createMedicalHistory(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/patients/${data.patient_id}/medical-history`, data, { withCredentials: true });
  }

  
}
