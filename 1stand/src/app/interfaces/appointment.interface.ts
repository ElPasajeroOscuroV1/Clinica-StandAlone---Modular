import { Doctor } from './doctor.interface';

export type PaymentStatus = 'Pendiente' | 'Pagado' | 'Cancelado';

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string | null;
  ci?: string | null;
  doctor_id?: number | null;
  doctor?: Doctor | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
  date: string;
  time: string;
  reason: string;
  payment_status?: PaymentStatus;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}
