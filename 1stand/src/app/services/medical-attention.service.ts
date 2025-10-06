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

  getMedicalAttentions(): Observable<MedicalAttention[]> {
    return this.http.get<any[]>(`${this.baseUrl}/medical-attentions`, { headers: this.getAuthHeaders() }).pipe(
      map(data =>
        data.map(att => {
          const mh = (att as any).medicalHistory;
          // Ensure appointment is mapped correctly
          const appointmentData = att.appointment || null; // Directly use the appointment data from the response

          // normalizar doctor_id desde varias posibles ubicaciones
          const doctor_id = appointmentData
            ? (appointmentData.doctor_id ?? appointmentData.doctor?.id ?? att.doctor_id ?? null)
            : null;

          const appointment = appointmentData ? {
            id: appointmentData.id,
            date: appointmentData.date,
            time: appointmentData.time,
            doctor_id, // ya normalizado
            reason: appointmentData.reason ?? null,
            status: appointmentData.status ?? null,
            payment_status: appointmentData.payment_status ?? null
          } : undefined;

          return {
            ...att,
            // Lógica de sincronización: Prioriza los datos de la historia médica si existen.
            diagnosis: mh?.diagnosis ?? att.diagnosis ?? '',
            preEnrollment: mh?.pre_enrollment ?? att.pre_enrollment ?? att.preEnrollment ?? '',
            otherTreatments: mh?.other_treatments ?? att.other_treatments ?? att.otherTreatments ?? [],
            // Los tratamientos de la atención son la fuente principal
            treatments: att.treatments,
            // Map the appointment data
            appointment,
            appointment_status: appointment?.status ?? null,
            medical_history_id: mh?.id ?? att.medical_history_id ?? (att.medicalHistory?.id ?? undefined)
          };
        })
      )
    );
  }
  
  getMedicalAttention(id: number): Observable<MedicalAttention> {
    return this.http
      .get<any>(`${this.baseUrl}/medical-attentions/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(attention => {
          const appointmentData = attention.appointment || null;
          const doctor_id = appointmentData
            ? (appointmentData.doctor_id ?? appointmentData.doctor?.id ?? attention.doctor_id ?? null)
            : null;
          const appointment = appointmentData
            ? {
                id: appointmentData.id,
                date: appointmentData.date,
                time: appointmentData.time,
                doctor_id,
                reason: appointmentData.reason ?? null,
                status: appointmentData.status ?? null,
                payment_status: appointmentData.payment_status ?? null
              }
            : undefined;

          return {
            ...attention,
            diagnosis: attention.diagnosis ?? '',
            preEnrollment: attention.pre_enrollment ?? attention.preEnrollment ?? '',
            otherTreatments: attention.other_treatments ?? attention.otherTreatments ?? [],
            treatments: attention.treatments ?? [],
            appointment,
            appointment_status: appointment?.status ?? null,
            medical_history_id: attention.medical_history_id ?? attention.medicalHistory?.id ?? undefined
          } as MedicalAttention;
        })
      );
  }

  createMedicalAttention(attention: MedicalAttention) {
    const normalizedPreEnrollment = attention.preEnrollment ?? (attention as any).pre_enrollment ?? null;
    const normalizedOtherTreatments = attention.otherTreatments ?? (attention as any).other_treatments ?? [];
    const normalizedTreatments = attention.treatments ?? [];
    const normalizedTreatmentIds = this.normalizeTreatmentIds(normalizedTreatments.length ? normalizedTreatments : (attention as any).treatment_ids ?? attention.treatment_ids);

    const payload = {
      ...attention,
      diagnosis: attention.diagnosis,
      pre_enrollment: normalizedPreEnrollment,
      other_treatments: normalizedOtherTreatments,
      treatment_ids: normalizedTreatmentIds,
      medical_history_id: attention.medical_history_id ?? (attention as any).medical_history_id ?? null,
    };
    return this.http.post<MedicalAttention>(`${this.baseUrl}/medical-attentions`, payload, { headers: this.getAuthHeaders() });
  }

  updateMedicalAttention(id: number, data: MedicalAttention): Observable<MedicalAttention> {
    const normalizedPreEnrollment = data.preEnrollment ?? (data as any).pre_enrollment ?? null;
    const normalizedOtherTreatments = data.otherTreatments ?? (data as any).other_treatments ?? [];
    const normalizedTreatments = data.treatments ?? [];
    const normalizedTreatmentIds = this.normalizeTreatmentIds(normalizedTreatments.length ? normalizedTreatments : (data as any).treatment_ids ?? data.treatment_ids);

    const payload = {
      ...data,
      pre_enrollment: normalizedPreEnrollment,
      other_treatments: normalizedOtherTreatments,
      treatment_ids: normalizedTreatmentIds,
      medical_history_id: data.medical_history_id ?? (data as any).medical_history_id ?? null,
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
    return this.http
      .get<Appointment[]>(`${this.baseUrl}/doctor/patients/${patientId}/appointments`, { headers: this.getAuthHeaders() })
      .pipe(
        map(appointments => (appointments ?? []).map(app => ({
          ...app,
          status: (app as any).status ?? 'pending',
          payment_status: (app as any).payment_status ?? 'Pendiente'
        })))
      );
  }
/*
  getMedicalAttentionByAppointment(appointmentId: number) {
    return this.http.get<MedicalAttention>(`/api/medical-attentions?appointment_id=${appointmentId}`);
  }
*/
  getMedicalAttentionByAppointment(appointmentId: number) {
    return this.http.get<MedicalAttention>(`${this.baseUrl}/medical-attentions/by-appointment/${appointmentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Convierte cualquier forma de tratamientos a un array de IDs
  private normalizeTreatmentIds(input: any): number[] {
    if (!input) return [];
    
    if (Array.isArray(input)) {
      return input.map(i => (typeof i === 'object' && i?.id ? Number(i.id) : Number(i)));
    }
    
    if (typeof input === 'object' && input?.id) {
      return [Number(input.id)];
    }
    
    const n = Number(input);
    return isNaN(n) ? [] : [n];
  }

  
}
