// Lo que viene del backend
export interface RawPayment {
  id: number;
  patient_id: number;
  appointment_id: number;
  treatment_id?: number;
  treatments?: any[]; // array of {id, nombre, precio}
  other_treatments?: any[]; // array of {name, price}
  amount: string;
  date: string;
  method: string;
  status: string;
  patient?: {
    id: number;
    name: string;
    ci?: string;
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
  treatments?: any[];
  other_treatments?: any[];
  amount: number;
  date: string;
  method: string;
  status: string;
  patient?: {
    id: number;
    name: string;
    ci?: string;
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
  treatment_ids?: number[];
  other_treatments?: {name: string, price: number}[];
  amount: number;
  date: string;
  method: string;
  status: string;
}
