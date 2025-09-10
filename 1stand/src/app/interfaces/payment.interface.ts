// Lo que viene del backend
export interface RawPayment {
  id: number;
  patient_id: number;
  appointment_id: number;
  treatment_id?: number;
  amount: string;
  date: string;
  method: string;
  status: string;
  patient?: {
    id: number;
    name: string;
  };
  appointment?: {
    id: number;
    date: string;
    doctor_name: string;
  };
  treatment?: {
    id: number;
    nombre: string;
  };
}

// Lo que usás en el frontend
export interface Payment {
  id: number;
  patientId: number;
  appointmentId: number;
  treatmentId?: number;
  amount: number;
  date: string;
  method: string;
  status: string;
  patient?: {
    id: number;
    name: string;
  };
  appointment?: {
    id: number;
    date: string;
    doctor_name: string;
  };
  treatment?: {
    id: number;
    nombre: string;
  };
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
