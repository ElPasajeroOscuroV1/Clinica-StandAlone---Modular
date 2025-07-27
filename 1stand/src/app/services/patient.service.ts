import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../interfaces/patient.interface';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:8000/api/patients';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });
}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
  /*
  createPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient, { headers: this.getHeaders() });
  }

  updatePatient(id: number, patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient, { headers: this.getHeaders() });
  }
  */

  createPatient(patient: Patient, faceImage?: string): Observable<Patient> {
    const patientData = {
      ...patient,
      face_image: faceImage
    };
    return this.http.post<Patient>(this.apiUrl, patientData, { headers: this.getHeaders() });
  }

  updatePatient(id: number, patient: Patient, faceImage?: string): Observable<Patient> {
    const patientData = {
      ...patient,
      face_image: faceImage
    };
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patientData, { headers: this.getHeaders() });
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Nuevo método para obtener el historial clínico de un paciente
  getPatientMedicalHistory(patientId: number): Observable<any> {
    // Asume que tienes una ruta para obtener el historial de un paciente específico
    return this.http.get(`${this.apiUrl}/${patientId}/medical-history`);
  }

  // Nuevo método para actualizar (o crear si no existe) el historial clínico
  updatePatientMedicalHistory(patientId: number, historyData: any): Observable<any> {
    // Asume que tu API maneja PUT/PATCH para actualizar o POST para crear si no existe
    return this.http.put(`${this.apiUrl}/${patientId}/medical-history`, historyData);
    // O si tu backend lo crea si no existe: return this.http.post(`${this.apiUrl}/${patientId}/medical-history`, historyData);
  }

}