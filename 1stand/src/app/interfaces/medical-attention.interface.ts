export interface MedicalAttention {
  id: number;
  patient_id: number;
  appointment_id: number;
  treatment_ids: number[];
  total_cost?: number;
  appointment?: {
    id: number;
    date: string;
    time: string;
    // Otras propiedades de Appointment
  };
  patient?: any; // Define Patient si lo tienes
  treatments?: {
    id: number;
    nombre: string;
    precio: string;
    // Otras propiedades de Treatment
  }[];
}