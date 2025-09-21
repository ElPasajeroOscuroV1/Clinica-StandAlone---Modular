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
}

export interface ApiResponse<T> {
  data: T;
}
