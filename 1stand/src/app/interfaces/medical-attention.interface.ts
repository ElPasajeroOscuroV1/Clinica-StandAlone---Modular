export interface MedicalAttention {
  id: number;
  patient_id: number;
  appointment_id: number;
  diagnosis: string;
  //preEnrollment?: boolean;
  preEnrollment?: string;
  otherTreatments?: { name: string; price: number }[];
  treatment_ids: number[];
  total_cost?: number;
  appointment?: {
    id: number;
    date: string;
    time: string;
    doctor_id?: number;
  };
  treatments?: {
    id: number;
    nombre: string;
    precio: string;
  }[];
}
