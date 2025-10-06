import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Payment, RawPayment, CreatePaymentDto } from '../interfaces/payment.interface';
/*
interface RawPayment {
  id: number;
  patient_id: number;
  appointment_id: number;
  treatment_id?: number;
  amount: string;
  date: string;
  method: string;
  status: string;
  patient: any;
  appointment: any;
  treatment?: any;
}
export interface CreatePaymentDto {
  patient_id: number;
  appointment_id: number;
  treatment_id?: number;
  amount: number;
  date: string;
  method: string;
  status: string;
}
*/

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = 'http://localhost:8000/api/payments';

  constructor(private http: HttpClient) {}

  getPayments(): Observable<Payment[]> {
    return this.http.get<RawPayment[]>(this.apiUrl).pipe(
      map(data => data.map(this.mapPaymentFromBackend))
    );
  }

  createPayment(payload: CreatePaymentDto): Observable<Payment> {
    return this.http.post<RawPayment>(this.apiUrl, payload).pipe(
      map(this.mapPaymentFromBackend)
    );
  }


  updatePayment(id: number, payload: any): Observable<Payment> {
    return this.http.put<RawPayment>(`${this.apiUrl}/${id}`, payload).pipe(
      map(this.mapPaymentFromBackend)
    );
  }

  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private mapPaymentFromBackend(raw: RawPayment): Payment {
    return {
      id: raw.id,
      patientId: raw.patient_id,
      appointmentId: raw.appointment_id,
      treatmentId: raw.treatment_id,
      treatments: raw.treatments,
      other_treatments: raw.other_treatments,
      amount: parseFloat(raw.amount),
      date: raw.date,
      method: raw.method,
      status: raw.status,
      patient: raw.patient,
      appointment: raw.appointment,
      treatment: undefined
    };
  }
  
}
