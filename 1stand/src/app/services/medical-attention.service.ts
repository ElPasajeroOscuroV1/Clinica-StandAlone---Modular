import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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

  //getMedicalAttentions(): Observable<MedicalAttention[]> {
  //  return this.http.get<MedicalAttention[]>(`${this.baseUrl}/medical-attentions`, { headers: this.getAuthHeaders() });
  //}
  /*
  getMedicalAttentions(): Observable<MedicalAttention[]> {
    return this.http.get<any[]>(`${this.baseUrl}/medical-attentions`).pipe(
      map(data =>
        data.map(att => ({
          ...att,
          diagnosis: att.diagnosis || att.diagnostico || '',
          preEnrollment: att.pre_enrollment,
          otherTreatments: att.other_treatments,
        }))
      )
    );
  }
  */
  getMedicalAttentions(): Observable<MedicalAttention[]> {
    return this.http.get<any[]>(`${this.baseUrl}/medical-attentions`, { headers: this.getAuthHeaders() }).pipe(
      map(data =>
        data.map(att => {
          const mh = (att as any).medicalHistory;
          return {
            ...att,
            // Lógica de sincronización: Prioriza los datos de la historia médica si existen.
            diagnosis: mh?.diagnosis ?? att.diagnosis ?? '',
            preEnrollment: mh?.pre_enrollment ?? att.pre_enrollment ?? '',
            otherTreatments: mh?.other_treatments ?? att.other_treatments ?? [],
            // Los tratamientos de la atención son la fuente principal
            treatments: att.treatments,
          };
        })
      )
    );
  }
  
  getMedicalAttention(id: number): Observable<MedicalAttention> {
    return this.http.get<MedicalAttention>(`${this.baseUrl}/medical-attentions/${id}`, { headers: this.getAuthHeaders() });
  }

  //createMedicalAttention(data: MedicalAttention): Observable<MedicalAttention> {
  //  return this.http.post<MedicalAttention>(`${this.baseUrl}/medical-attentions`, data, { headers: this.getAuthHeaders() });
  //}
  createMedicalAttention(attention: MedicalAttention) {
    const payload = {
      ...attention,
      diagnosis: attention.diagnosis,
      pre_enrollment: attention.preEnrollment,
      other_treatments: attention.otherTreatments,
      treatment_ids: attention.treatment_ids,
      medical_history_id: attention.medical_history_id, // Incluir medical_history_id
    };
    return this.http.post<MedicalAttention>(`${this.baseUrl}/medical-attentions`, payload, { headers: this.getAuthHeaders() });
  }

  updateMedicalAttention(id: number, data: MedicalAttention): Observable<MedicalAttention> {
    const payload = {
      ...data,
      pre_enrollment: data.preEnrollment,
      other_treatments: data.otherTreatments,
      treatment_ids: data.treatments?.map(t => t.id) || data.treatment_ids, // Asegurar que treatment_ids sea un array de IDs
      medical_history_id: data.medical_history_id, // Incluir medical_history_id
    };
    return this.http.put<MedicalAttention>(`${this.baseUrl}/medical-attentions/${id}`, payload, { headers: this.getAuthHeaders() });
  }

  deleteMedicalAttention(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/medical-attentions/${id}`, { headers: this.getAuthHeaders() });
  }

  getPatientsByDoctor(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/doctor/patients`, { headers: this.getAuthHeaders() });
  }
  
  getAppointmentsByDoctorPatient(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/patients/${patientId}/appointments`, { headers: this.getAuthHeaders() });
  }
  
}
