export interface Patient {
  id: number;
  name: string;
  email: string;
  ci: string;
}

export interface MedicalHistory {
  id: number;
  patient_id: number;
  consultation_reason: string;
  allergies: string;
  created_at: string;
  patient: Patient;
  appointment_id?: number | null;
  medical_attention_id?: number | null;
  diagnosis?: string;
  medical_background?: string;
  dental_background?: string;
  extraoral_exam?: string;
  intraoral_exam?: string;
  odontogram?: string;
  treatments_performed?: string[] | string;
  current_medications?: string;
  other_treatments?: any[];
  relevant_oral_habits?: string;
  pre_enrollment?: string;
  details?: string;
}

export interface ApiResponse<T> {
  data: T;
}
