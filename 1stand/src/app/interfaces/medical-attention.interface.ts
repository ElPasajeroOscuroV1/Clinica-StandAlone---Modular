export interface MedicalAttention {
  id: number;
  patient_id: number;
  appointment_id: number;
  diagnosis: string;
  //preEnrollment?: boolean;
  preEnrollment?: string;
  otherTreatments?: { name: string; price: number }[];
  treatment_ids: number[];
  medical_history_id?: number; // Agregado para la relación con MedicalHistory
  total_cost?: number;
  appointment?: {
    id: number;
    date: string;
    time: string;
    doctor_id?: number;
    reason?: string | null;
    status?: string | null;
    payment_status?: string | null;
  };
  appointment_status?: string | null;
  treatments?: {
    id: number;
    nombre: string;
    precio: string;
  }[];
}
