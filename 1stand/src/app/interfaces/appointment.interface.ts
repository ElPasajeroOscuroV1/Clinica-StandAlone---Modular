export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string | null;
  ci: string;
  doctor_id?: number;
  date: string;
  time: string; // Agregar esta propiedad
  reason: string;
  payment_status: string;
  created_at: string;
  updated_at: string;

}